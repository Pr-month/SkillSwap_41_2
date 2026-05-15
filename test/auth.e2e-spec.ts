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
import { describe, it } from '@jest/globals';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from 'src/common/all-exception.filter';
import { RegisterDTO } from 'src/auth/dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import type { Server } from 'http';

describe('AuthController (e2e)', () => {
  type AuthResponse = {
    accessToken: string;
    refreshToken?: string;
  };

  let userRepository: Repository<User>;
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
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
    }).compile();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

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
    await app.close();
    await moduleFixture.close();
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

    accessToken = body.accessToken;
    refreshToken = body.refreshToken || res.headers['set-cookie'][0];
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

    accessToken = body.accessToken;
    refreshToken = body.refreshToken || res.headers['set-cookie'][0];
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
    const res = await api
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    // expect(res.headers['set-cookie']).toBeDefined();

    const body = res.body as AuthResponse;

    accessToken = body.accessToken;
    refreshToken = body.refreshToken || res.headers['set-cookie'][0];
  });

  it('/auth/refresh (POST) => should fail with invalid refresh token', async () => {
    await api
      .post('/auth/refresh')
      .send({
        refreshToken: 'invalidtoken',
      })
      .expect(401);
  });

  // ===== Logout =====
  it('/auth/logout (POST) => should logout a user', async () => {
    const res = await api
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toEqual({ message: 'Успешный выход' });

    const testUser = await userRepository.findOne({
      where: {
        email: registerUserDto.email,
      },
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
