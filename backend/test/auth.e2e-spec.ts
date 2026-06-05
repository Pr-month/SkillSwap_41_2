import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { Repository } from 'typeorm';
import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from 'src/common/all-exception.filter';
import { RegisterDTO } from 'src/auth/dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import type { Server } from 'http';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

type AuthResponse = {
  accessToken: string;
};

function extractRefreshTokenFromCookie(
  cookieHeader: string | string[] | undefined,
): string | null {
  if (!cookieHeader) return null;
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  for (const cookie of cookies) {
    const match = cookie.match(/refresh_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

describe('AuthController (e2e)', () => {
  let userRepository: Repository<User>;
  let app: INestApplication;
  let currentAccessToken: string;
  let currentRefreshToken: string | null = null;
  let httpServer: Server;
  let api: ReturnType<typeof request>;
  let moduleFixture: TestingModule;

  const registerUserDto: RegisterDTO = {
    name: 'test_user',
    email: 'test@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(SendmailService)
      .useValue({ sendEmail: jest.fn() })
      .overrideProvider(NotificationService)
      .useValue({
        notifyNewRequest: jest.fn(),
        notifyRequestAccepted: jest.fn(),
        notifyRequestRejected: jest.fn(),
      })
      .overrideProvider(sendmailConfig.KEY)
      .useValue(testSendmailConfig)
      .compile();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await userRepository.delete({ email: registerUserDto.email });

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        forbidUnknownValues: true,

        exceptionFactory: (errors) => {
          return new BadRequestException({
            message: 'Validation failed',
            errors: errors.map((err) => ({
              field: err.property,
              errors: Object.values(err.constraints || {}),
            })),
          });
        },
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;
    api = request(httpServer);
  });

  afterAll(async () => {
    await userRepository.delete({ email: registerUserDto.email });
    await app.close();
    await moduleFixture.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  // ===== Registration =====
  it('/auth/register (POST) => should register a new user', async () => {
    const res = await api
      .post('/auth/register')
      .send(registerUserDto)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    const body = res.body as AuthResponse;
    currentAccessToken = body.accessToken;

    expect(currentAccessToken).toBeDefined();
    expect(typeof currentAccessToken).toBe('string');
    expect(currentAccessToken.length).toBeGreaterThan(0);

    currentRefreshToken = extractRefreshTokenFromCookie(
      res.headers['set-cookie'],
    );
    expect(currentRefreshToken).not.toBeNull();
  });

  it('/auth/register (POST) => should fail duplicate email', async () => {
    await api.post('/auth/register').send(registerUserDto).expect(409);
  });

  // ===== Login =====
  it('/auth/login (POST) => should login a user', async () => {
    const res = await api
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: registerUserDto.password,
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    const body = res.body as AuthResponse;
    currentAccessToken = body.accessToken;
    currentRefreshToken = extractRefreshTokenFromCookie(
      res.headers['set-cookie'],
    );
    expect(currentRefreshToken).not.toBeNull();
  });

  it('/auth/login (POST) => should fail with wrong password', async () => {
    await api
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: 'WrongPassword!',
      })
      .expect(401);
  });

  // ===== Refresh =====
  it('/auth/refresh (POST) => should refresh tokens', async () => {
    // Логинимся, чтобы получить свежий refreshToken
    const loginRes = await api
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: registerUserDto.password,
      })
      .expect(201);

    const refreshTokenFromLogin = extractRefreshTokenFromCookie(
      loginRes.headers['set-cookie'],
    );
    expect(refreshTokenFromLogin).not.toBeNull();

    // Отправляем refresh запрос с refreshToken в cookie
    const res = await api
      .post('/auth/refresh')
      .set('Cookie', `refreshToken=${refreshTokenFromLogin}`)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    const newRefreshToken = extractRefreshTokenFromCookie(
      res.headers['set-cookie'],
    );
    expect(newRefreshToken).not.toBeNull();

    // Обновляем глобальные токены для следующих тестов
    currentRefreshToken = newRefreshToken!;
    const body = res.body as AuthResponse;
    currentAccessToken = body.accessToken;
  });

  it('/auth/refresh (POST) => should fail with invalid refresh token', async () => {
    // Отправляем запрос с невалидным refreshToken в cookie
    await api
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=invalidtoken')
      .expect(401);
  });

  // ===== Logout =====
  it('/auth/logout (POST) => should logout a user', async () => {
    // Логинимся, чтобы получить токены
    const loginRes = await api
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: registerUserDto.password,
      })
      .expect(201);

    const loginResponseBody = loginRes.body as AuthResponse;
    const accessTokenForLogout = loginResponseBody.accessToken;
    const refreshTokenForLogout = extractRefreshTokenFromCookie(
      loginRes.headers['set-cookie'],
    );

    // Отправляем logout запрос с access token в заголовке и refresh token в cookie
    await api
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessTokenForLogout}`)
      .set('Cookie', `refreshToken=${refreshTokenForLogout}`)
      .expect(201);

    const testUser = await userRepository.findOne({
      where: { email: registerUserDto.email },
    });

    expect(testUser?.refreshToken).toBeNull();
  });

  it('/auth/logout (POST) => should fail with invalid access token', async () => {
    await api
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });
});
