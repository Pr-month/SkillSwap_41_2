import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { describe, beforeEach, it } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'src/common/all-exception.filter';
import { RegisterDTO } from 'src/auth/dto/register.dto';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

let userRepository: Repository<User>

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const registerUserDto: RegisterDTO = {
    name: 'test_user',
    email: 'test@example.com',
    password: 'Password123!',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))

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
  });

  // ===== Registration =====
  it('/auth/register (POST) => should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerUserDto)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
    refreshToken = res.headers['set-cookie'][0]
  });

  it('/auth/register (POST) => should fail duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerUserDto)
      .expect(409);
  });

  // ===== Login =====
  it('/auth/login (POST) => should login a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: registerUserDto.password,
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken || res.headers['set-cookie'][0];
  });

  it('/auth/login (POST) => should fail with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerUserDto.email,
        password: 'WrongPassword!',
      })
      .expect(401);
  });

  // ===== Refresh =====
  it('/auth/refresh (POST) => should refresh tokens', async () => {
    console.log('====== Refresh token cookie ======:', refreshToken);

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    // expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken || res.headers['set-cookie'][0];
  });

  it('/auth/refresh (POST) => should fail with invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: 'invalidtoken',
      })
      .expect(401);
  });

  // ===== Logout =====
  it('/auth/logout (POST) => should logout a user', async () => {
    const res = await request(app.getHttpServer())
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
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });
});
