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
    refreshToken = res.headers['set-cookie'][0]
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

  it('/auth/refresh (POST) => should refresh tokens', async () => {

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshToken.split(';')[0])
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    // expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.accessToken;
    refreshToken = res.headers['set-cookie'][0]
  });

  it('/auth/refresh (POST) => should fail with invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=invalidtoken')
      .expect(401);
  });

  it('/auth/logout (POST) => should logout a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body).toEqual({ message: 'Успешный выход' });
  });

  it('/auth/logout (POST) => should fail with invalid access token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });
});
