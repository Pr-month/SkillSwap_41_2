import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/users.enums';
import { AppModule } from './../src/app.module';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { jwtConfig } from '../src/config/jwt.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

const testJwtConfig = {
  accessSecret: 'test-access-secret',
  accessTokenExpires: '15m',
  refreshSecret: 'test-refresh-secret',
  refreshTokenExpires: '7d',
};

type ValidationErrorItem = {
  field: string;
  errors: string[];
};

type ValidationErrorResponse = {
  message: string;
  errors: ValidationErrorItem[];
};

type UsersListItem = {
  id: number;
  email: string;
  name: string;
};

type UsersListResponse = {
  data: UsersListItem[];
  meta: unknown;
};

type UserResponse = {
  id: number;
  email: string;
  name: string;
  password?: string;
  refreshToken?: string;
};

type SimpleMessageResponse = {
  message: string;
};

describe('Users (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  let regularUser: User;
  let adminUser: User;
  let regularAccessToken: string;
  let adminAccessToken: string;

  const regularEmail = `e2e-regular-${Date.now()}@test.com`;
  const adminEmail = `e2e-admin-${Date.now()}@test.com`;
  const password = 'Test1234!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
      .overrideProvider(jwtConfig.KEY)
      .useValue(testJwtConfig)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
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

    httpServer = app.getHttpServer() as express.Express;

    userRepository = app.get(getRepositoryToken(User));
    jwtService = app.get(JwtService);

    const hashedPassword = await bcrypt.hash(password, 10);

    regularUser = await userRepository.save({
      name: 'Regular E2E User',
      email: regularEmail,
      password: hashedPassword,
      role: UserRole.USER,
    });

    adminUser = await userRepository.save({
      name: 'Admin E2E User',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    const payloadRegular = {
      sub: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    };
    const payloadAdmin = {
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    };

    regularAccessToken = jwtService.sign(payloadRegular, {
      secret: testJwtConfig.accessSecret,
    });
    adminAccessToken = jwtService.sign(payloadAdmin, {
      secret: testJwtConfig.accessSecret,
    });
  });

  afterAll(async () => {
    await userRepository.delete(regularUser.id);
    await userRepository.delete(adminUser.id);
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('GET /users', () => {
    it('должен вернуть список пользователей (публичный)', async () => {
      const response = await request(httpServer).get('/users').expect(200);

      const body = response.body as UsersListResponse;

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('должен найти пользователя по поиску (email)', async () => {
      const response = await request(httpServer)
        .get(`/users?search=${regularEmail}`)
        .expect(200);

      const body = response.body as UsersListResponse;

      const found = body.data.some((u) => u.email === regularEmail);
      expect(found).toBe(true);
    });

    it('должен вернуть 400 при offset > 100 (ограничение валидации)', async () => {
      const response = await request(httpServer)
        .get('/users?offset=10000')
        .expect(400);

      const body = response.body as ValidationErrorResponse;

      expect(body.message).toBe('Validation failed');
    });
  });

  describe('GET /users/:id', () => {
    it('должен вернуть пользователя по существующему ID', async () => {
      const response = await request(httpServer)
        .get(`/users/${regularUser.id}`)
        .expect(200);

      const body = response.body as UserResponse;

      expect(body.id).toBe(regularUser.id);
      expect(body.email).toBe(regularEmail);
      expect(body).not.toHaveProperty('password');
      expect(body).not.toHaveProperty('refreshToken');
    });

    it('должен вернуть 404 для несуществующего ID', async () => {
      await request(httpServer).get('/users/99999').expect(404);
    });
  });

  describe('PATCH /users/me', () => {
    it('должен обновить имя пользователя', async () => {
      const newName = 'Updated Regular User';
      const response = await request(httpServer)
        .patch('/users/me')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: newName })
        .expect(200);

      const body = response.body as UserResponse;

      expect(body.name).toBe(newName);
    });

    it('должен вернуть 401 без токена', async () => {
      await request(httpServer)
        .patch('/users/me')
        .send({ name: 'hack' })
        .expect(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('должен сменить пароль и вернуть сообщение', async () => {
      const newPassword = 'NewPass1!';
      const response = await request(httpServer)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({
          oldPassword: password,
          newPassword,
        })
        .expect(200);

      const body = response.body as SimpleMessageResponse;

      expect(body).toHaveProperty('message', 'Пароль успешно обновлен.');
    });

    it('должен вернуть 401 при неверном старом пароле', async () => {
      await request(httpServer)
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({
          oldPassword: 'WrongOldPass1!',
          newPassword: 'Whatever1!',
        })
        .expect(401);
    });

    it('должен вернуть 401 без токена', async () => {
      await request(httpServer)
        .patch('/users/me/password')
        .send({ oldPassword: 'old', newPassword: 'new' })
        .expect(401);
    });
  });

  describe('DELETE /users/:id', () => {
    let userToDelete: User;

    beforeEach(async () => {
      userToDelete = await userRepository.save({
        name: 'To Delete',
        email: `delete-${Date.now()}@test.com`,
        password: await bcrypt.hash('pass', 10),
        role: UserRole.USER,
      });
    });

    afterEach(async () => {
      if (userToDelete) {
        await userRepository.delete(userToDelete.id).catch(() => {});
      }
    });

    it('должен удалить пользователя при запросе от админа', async () => {
      await request(httpServer)
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const found = await userRepository.findOneBy({ id: userToDelete.id });
      expect(found).toBeNull();
    });

    it('должен вернуть 403 при запросе от обычного пользователя', async () => {
      await request(httpServer)
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(403);
    });

    it('должен вернуть 401 без токена', async () => {
      await request(httpServer).delete(`/users/${userToDelete.id}`).expect(401);
    });

    it('должен вернуть 404 для несуществующего пользователя', async () => {
      await request(httpServer)
        .delete('/users/99999')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });
});
