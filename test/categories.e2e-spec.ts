import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { seedTestUsers } from '../src/seeding/seed-test-users.data';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
    adminToken = adminLogin.body.accessToken;

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: seedTestUsers[0].email,
        password: seedTestUsers[0].password,
      });
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('should return not empty array', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /categories', () => {
    it('should create category if admin', async () => {
      const name = `Test category ${Date.now()}`;

      const res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name })
        .expect(201);

      expect(res.body).toMatchObject({ name });
    });

    it('should return 403 if user is not admin', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: `Test category ${Date.now()}` })
        .expect(401);
    });

    it('should return 400 if name is too short', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A' })
        .expect(400);
    });
  });

  describe('GET /categories/:id', () => {
    it('should return category by id', async () => {
      const name = `Test category ${Date.now()}`;

      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/categories/${created.body.id}`)
        .expect(200);

      expect(res.body).toMatchObject({ name });
    });

    it('should return 404 if category not found', async () => {
      await request(app.getHttpServer())
        .get('/categories/99999')
        .expect(404);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update category if admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);

      const updatedName = `Updated category ${Date.now()}`;

      const res = await request(app.getHttpServer())
        .patch(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName })
        .expect(200);

      expect(res.body).toMatchObject({ name: updatedName });
    });

    it('should return 403 if user is not admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: `Updated ${Date.now()}` })
        .expect(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category if admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/categories/${created.body.id}`)
        .expect(404);
    });

    it('should return 403 if user is not admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Test category ${Date.now()}` })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});