import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { UserRole } from '../src/users/enums/users.enums';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { jwtConfig } from '../src/config/jwt.config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

const testJwtConfig = {
  accessSecret: 'test-access-secret',
  accessTokenExpires: '15m',
  refreshSecret: 'test-refresh-secret',
  refreshTokenExpires: '7d',
};

interface LoginResponse {
  accessToken: string;
}

interface CategoryResponse {
  id: number;
  name: string;
}

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let adminToken: string;
  let userToken: string;

  let testAdmin: User;
  let testUser: User;
  let testCategories: Category[];

  const adminEmail = `admin-categories-${Date.now()}@test.com`;
  const adminPassword = 'Admin123!';
  const userEmail = `user-categories-${Date.now()}@test.com`;
  const userPassword = 'User123!';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    httpServer = app.getHttpServer() as express.Express;

    userRepository = app.get(getRepositoryToken(User));
    categoryRepository = app.get(getRepositoryToken(Category));

    // Создаём администратора
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    testAdmin = await userRepository.save({
      name: 'Admin Tester',
      email: adminEmail,
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    });

    // Создаём обычного пользователя
    const hashedUserPassword = await bcrypt.hash(userPassword, 10);
    testUser = await userRepository.save({
      name: 'Regular Tester',
      email: userEmail,
      password: hashedUserPassword,
      role: UserRole.USER,
    });

    // Создаём тестовые категории (чтобы GET /categories не был пустым)
    testCategories = await categoryRepository.save([
      { name: 'Test Category 1' },
      { name: 'Test Category 2' },
    ]);

    // Логинимся как админ
    const adminLogin = await request(httpServer)
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    const adminBody = adminLogin.body as LoginResponse;
    adminToken = adminBody.accessToken;

    // Логинимся как обычный пользователь
    const userLogin = await request(httpServer)
      .post('/auth/login')
      .send({ email: userEmail, password: userPassword });
    const userBody = userLogin.body as LoginResponse;
    userToken = userBody.accessToken;
  });

  afterAll(async () => {
    // Удаляем созданные категории по ID
    if (testCategories && testCategories.length) {
      await categoryRepository.delete(testCategories.map((c) => c.id));
    }
    await userRepository.delete(testAdmin.id);
    await userRepository.delete(testUser.id);
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('GET /categories', () => {
    it('should return not empty array', async () => {
      const res = await request(httpServer).get('/categories').expect(200);
      const categories = res.body as CategoryResponse[];
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('POST /categories', () => {
    it('should create category if admin', async () => {
      const name = `Test category ${Date.now()}`;
      const res = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name })
        .expect(201);
      const created = res.body as CategoryResponse;
      expect(created).toMatchObject({ name });
    });

    it('should return 403 if user is not admin', async () => {
      await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(httpServer)
        .post('/categories')
        .send({ name: `Test category ${Date.now()}` })
        .expect(401);
    });

    it('should return 400 if name is too short', async () => {
      await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' })
        .expect(400);
    });
  });

  describe('GET /categories/:id', () => {
    it('should return category by id', async () => {
      const name = `Test category ${Date.now()}`;
      const createRes = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name })
        .expect(201);
      const created = createRes.body as CategoryResponse;

      const getRes = await request(httpServer)
        .get(`/categories/${created.id}`)
        .expect(200);
      const category = getRes.body as CategoryResponse;
      expect(category).toMatchObject({ name });
    });

    it('should return 404 if category not found', async () => {
      await request(httpServer).get('/categories/99999').expect(404);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update category if admin', async () => {
      const createRes = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);
      const created = createRes.body as CategoryResponse;

      const updatedName = `Updated category ${Date.now()}`;
      const updateRes = await request(httpServer)
        .patch(`/categories/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName })
        .expect(200);
      const updated = updateRes.body as CategoryResponse;
      expect(updated).toMatchObject({ name: updatedName });
    });

    it('should return 403 if user is not admin', async () => {
      const createRes = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);
      const created = createRes.body as CategoryResponse;

      await request(httpServer)
        .patch(`/categories/${created.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: `Updated ${Date.now()}` })
        .expect(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category if admin', async () => {
      const createRes = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);
      const created = createRes.body as CategoryResponse;

      await request(httpServer)
        .delete(`/categories/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(httpServer).get(`/categories/${created.id}`).expect(404);
    });

    it('should return 403 if user is not admin', async () => {
      const createRes = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);
      const created = createRes.body as CategoryResponse;

      await request(httpServer)
        .delete(`/categories/${created.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
