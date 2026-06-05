import { AllExceptionsFilter } from '../src/common/all-exception.filter';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';
import express from 'express';
import { City } from '../src/cities/entities/city.entity';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/users.enums';
import { AppModule } from './../src/app.module';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

// Интерфейсы для типизации ответов
interface CityResponse {
  id: number;
  name: string;
  country: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  message: string;
  errors?: Array<{ field: string; errors: string[] }>;
}

describe('Cities (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let userRepository: Repository<User>;
  let cityRepository: Repository<City>;
  let jwtService: JwtService;

  let adminUser: User;
  let regularUser: User;
  let adminAccessToken: string;
  let regularAccessToken: string;
  let testCity: CityResponse;

  const adminEmail = `admin-cities-${Date.now()}@test.com`;
  const adminPassword = 'Admin1234';
  const regularEmail = `user-cities-${Date.now()}@test.com`;
  const regularPassword = 'User1234';

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
      .compile();

    app = moduleFixture.createNestApplication();
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
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    httpServer = app.getHttpServer() as express.Express;

    userRepository = app.get(getRepositoryToken(User));
    cityRepository = app.get(getRepositoryToken(City));
    jwtService = app.get(JwtService);

    // Создаём администратора
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await userRepository.save({
      name: 'Admin Tester',
      email: adminEmail,
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    });

    // Создаём обычного пользователя
    const hashedUserPassword = await bcrypt.hash(regularPassword, 10);
    regularUser = await userRepository.save({
      name: 'Regular Tester',
      email: regularEmail,
      password: hashedUserPassword,
      role: UserRole.USER,
    });

    // Генерируем JWT токены
    adminAccessToken = jwtService.sign(
      { sub: adminUser.id, email: adminUser.email, role: adminUser.role },
      { secret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2' },
    );
    regularAccessToken = jwtService.sign(
      { sub: regularUser.id, email: regularUser.email, role: regularUser.role },
      { secret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2' },
    );
  });

  afterAll(async () => {
    if (testCity) await cityRepository.delete(testCity.id).catch(() => {});
    await userRepository.delete(adminUser.id);
    await userRepository.delete(regularUser.id);
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  // -------------------------------------------------------------------
  // 1. GET /cities – список городов
  // -------------------------------------------------------------------
  describe('GET /cities', () => {
    let city1: City;
    let city2: City;

    beforeAll(async () => {
      city1 = await cityRepository.save({
        name: 'E2E City Alpha',
        country: 'Testland',
        region: 'Alpha Region',
      });
      city2 = await cityRepository.save({
        name: 'E2E City Beta',
        country: 'Testland',
        region: 'Beta Region',
      });
    });

    afterAll(async () => {
      await cityRepository.delete(city1.id);
      await cityRepository.delete(city2.id);
    });

    it('Должен вернуть список городов (публичный эндпоинт)', async () => {
      const response = await request(httpServer).get('/cities').expect(200);

      const cities = response.body as CityResponse[];
      expect(Array.isArray(cities)).toBe(true);
      const ids = cities.map((c) => c.id);
      expect(ids).toContain(city1.id);
      expect(ids).toContain(city2.id);
    });

    it('Должен фильтровать по search (поиск по имени)', async () => {
      const response = await request(httpServer)
        .get('/cities?search=Alpha')
        .expect(200);

      const cities = response.body as CityResponse[];
      expect(cities.length).toBeGreaterThanOrEqual(1);
      const names = cities.map((c) => c.name);
      expect(names).toContain('E2E City Alpha');
      expect(names).not.toContain('E2E City Beta');
    });

    it('Должен ограничивать количество результатов через limit', async () => {
      const limit = 1;
      const response = await request(httpServer)
        .get(`/cities?limit=${limit}`)
        .expect(200);

      const cities = response.body as CityResponse[];
      expect(cities.length).toBeLessThanOrEqual(limit);
    });
  });

  // -------------------------------------------------------------------
  // 2. GET /cities/:id
  // -------------------------------------------------------------------
  describe('GET /cities/:id', () => {
    let singleCity: City;

    beforeAll(async () => {
      singleCity = await cityRepository.save({
        name: 'Single City',
        country: 'Testia',
        region: 'Central',
      });
    });

    afterAll(async () => {
      await cityRepository.delete(singleCity.id);
    });

    it('Должен вернуть город по ID', async () => {
      const response = await request(httpServer)
        .get(`/cities/${singleCity.id}`)
        .expect(200);

      const city = response.body as CityResponse;
      expect(city.id).toBe(singleCity.id);
      expect(city.name).toBe(singleCity.name);
    });

    it('Должен вернуть 404 для несуществующего ID', async () => {
      await request(httpServer).get('/cities/99999').expect(404);
    });
  });

  // -------------------------------------------------------------------
  // 3. POST /cities (только ADMIN)
  // -------------------------------------------------------------------
  describe('POST /cities', () => {
    const newCityPayload = {
      name: 'Admin Created City',
      country: 'Adminsland',
      region: 'Admin Region',
    };

    it('Должен создать город при запросе от администратора', async () => {
      const response = await request(httpServer)
        .post('/cities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newCityPayload)
        .expect(201);

      const created = response.body as CityResponse;
      expect(created).toMatchObject({
        id: expect.any(Number),
        name: newCityPayload.name,
        country: newCityPayload.country,
        region: newCityPayload.region,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      testCity = created;
    });

    it('Должен вернуть 401 при отсутствии токена', async () => {
      await request(httpServer)
        .post('/cities')
        .send(newCityPayload)
        .expect(401);
    });

    it('Должен вернуть 403 при запросе от обычного пользователя', async () => {
      await request(httpServer)
        .post('/cities')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send(newCityPayload)
        .expect(403);
    });

    it('Должен вернуть 400 при невалидных данных', async () => {
      const invalidPayload = { name: '', country: 123 };
      const response = await request(httpServer)
        .post('/cities')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(invalidPayload)
        .expect(400);

      const errorBody = response.body as ErrorResponse;
      expect(errorBody.message).toBe('Validation failed');
    });
  });

  // -------------------------------------------------------------------
  // 4. PATCH /cities/:id (только ADMIN)
  // -------------------------------------------------------------------
  describe('PATCH /cities/:id', () => {
    it('Должен обновить город администратором', async () => {
      const updatePayload = { name: 'Updated City Name', region: 'New Region' };
      const response = await request(httpServer)
        .patch(`/cities/${testCity.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updatePayload)
        .expect(200);

      const updated = response.body as CityResponse;
      expect(updated.name).toBe(updatePayload.name);
      expect(updated.region).toBe(updatePayload.region);
      expect(updated.country).toBe('Adminsland');
    });

    it('Должен вернуть 404 при обновлении несуществующего города', async () => {
      await request(httpServer)
        .patch('/cities/99999')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Ghost' })
        .expect(404);
    });

    it('Должен вернуть 403 для обычного пользователя', async () => {
      await request(httpServer)
        .patch(`/cities/${testCity.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: 'Hack' })
        .expect(403);
    });
  });

  // -------------------------------------------------------------------
  // 5. DELETE /cities/:id (только ADMIN)
  // -------------------------------------------------------------------
  describe('DELETE /cities/:id', () => {
    let cityToDelete: City;

    beforeAll(async () => {
      cityToDelete = await cityRepository.save({
        name: 'To Be Deleted',
        country: 'Temp',
      });
    });

    it('Должен удалить город администратором', async () => {
      await request(httpServer)
        .delete(`/cities/${cityToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const deleted = await cityRepository.findOneBy({ id: cityToDelete.id });
      expect(deleted).toBeNull();
    });

    it('Должен вернуть 404 при повторном удалении', async () => {
      await request(httpServer)
        .delete(`/cities/${cityToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('Должен вернуть 403 для обычного пользователя', async () => {
      const tempCity = await cityRepository.save({ name: 'Temp' });
      await request(httpServer)
        .delete(`/cities/${tempCity.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(403);
      await cityRepository.delete(tempCity.id);
    });
  });
});
