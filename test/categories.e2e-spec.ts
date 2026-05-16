import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { resetDatabase } from './setup-e2e';
import { seedTestUsers } from '../src/seeding/seed-test-users.data';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    await resetDatabase(dataSource);

    // Сидируем админа
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        name: 'Admin',
        role: 'admin',
      });

    // Логинимся как админ — получаем токен
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      });
    adminToken = adminLogin.body.accessToken;

    // Логинимся как обычный юзер
    const userData = seedTestUsers[0];
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData);

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userData.email, password: userData.password });
    userToken = userLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('should return empty array initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('POST /categories', () => {
    it('should create category if admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'IT и программирование' })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'IT и программирование' });
    });

    it('should return 403 if user is not admin', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Дизайн' })
        .expect(403);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Дизайн' })
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
      // Создаём категорию
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Языки' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/categories/${created.body.id}`)
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Языки' });
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
        .send({ name: 'Старое название' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Новое название' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'Новое название' });
    });

    it('should return 403 if user is not admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Категория для патча' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Попытка изменить' })
        .expect(403);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete category if admin', async () => {
      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Удаляемая категория' })
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
        .send({ name: 'Защищённая категория' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});