import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { AppModule } from '../src/app.module';
import { seedTestUsers } from '../src/seeding/seed-test-users.data';

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
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    httpServer = app.getHttpServer() as express.Express;

    const adminLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
    const adminBody = adminLogin.body as LoginResponse;
    adminToken = adminBody.accessToken;

    const userLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: seedTestUsers[0].email,
        password: seedTestUsers[0].password,
      });
    const userBody = userLogin.body as LoginResponse;
    userToken = userBody.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('should return not empty array', async () => {
      const res = await request(httpServer)
        .get('/categories')
        .expect(200);

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
      await request(httpServer)
        .get('/categories/99999')
        .expect(404);
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

      await request(httpServer)
        .get(`/categories/${created.id}`)
        .expect(404);
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
