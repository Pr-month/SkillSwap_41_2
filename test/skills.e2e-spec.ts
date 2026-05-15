import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { Repository } from 'typeorm';
import { Category } from '../src/categories/entities/category.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/users.enums';
import { AppModule } from './../src/app.module';

describe('Skills (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let skillRepository: Repository<Skill>;
  let jwtService: JwtService;

  let testUser: User;
  let testCategory: Category;
  let testSkill: Skill;
  let accessToken: string;

  const testUserEmail = `e2e-skills-${Date.now()}@test.com`;
  const testUserPassword = 'Test1234';
  const testCategoryName = `E2E Category ${Date.now()}`;
  const testSkillTitle = `E2E Skill ${Date.now()}`;

  // перед тестами инициализируем приложение и создаем необходимые тестовые данные 
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    categoryRepository = app.get(getRepositoryToken(Category));
    skillRepository = app.get(getRepositoryToken(Skill));
    jwtService = app.get(JwtService);

    // Создаём тестовую категорию
    testCategory = await categoryRepository.save({ name: testCategoryName });

    // Создаём тестового пользователя
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = await userRepository.save({
      name: 'E2E Skills User',
      email: testUserEmail,
      password: hashedPassword,
      role: UserRole.USER,
    });

    // Генерируем JWT токен
    accessToken = jwtService.sign(
      { sub: testUser.id, email: testUser.email, role: testUser.role },
      { secret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2' },
    );
  });
  
  // после тестов удаляем тестовые данные и закрываем приложение
  afterAll(async () => {
    if (testSkill) await skillRepository.delete(testSkill.id).catch(() => {});
    await userRepository.delete(testUser.id);
    await categoryRepository.delete(testCategory.id);
    await app.close();
  });

  // проверяем создание навыка
  describe('POST /skills', () => {
    it('Должен создаться навык при авторизованном запросе', async () => {
      const payload = {
        title: testSkillTitle,
        description: 'E2E test description',
        categoryId: testCategory.id,
        images: ['image1.png'],
      };

      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: payload.title,
        description: payload.description,
        images: expect.arrayContaining(payload.images),
        category: expect.objectContaining({ id: testCategory.id }),
        owner: expect.objectContaining({ id: testUser.id }),
      });

      testSkill = response.body;
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(app.getHttpServer())
        .post('/skills')
        .send({ title: 'test', description: 'test', categoryId: 1, images: [] })
        .expect(401);
    });

    it('Должна вернуться ошибка 400 при невалидных данных', async () => {
      const invalidPayload = {
        title: '',
        description: 'desc',
        categoryId: 'not-number',
        images: [],
      };
      const response = await request(app.getHttpServer())
        .post('/skills')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidPayload)
        .expect(400);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  // проверяем получение списка навыков
  describe('GET /skills', () => {
    it('Должен вернуться список навыков', async () => {
      const response = await request(app.getHttpServer())
        .get('/skills')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.some((s: Skill) => s.id === testSkill.id);
      expect(found).toBe(true);
    });

    it('Должен сработать фильтр по категории', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills?category=${testCategory.id}`)
        .expect(200);
      expect(response.body.some((s: Skill) => s.id === testSkill.id)).toBe(true);
    });

    it('Должен сработать фильтр по ID владельца', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills?owner=${testUser.id}`)
        .expect(200);
      expect(response.body.some((s: Skill) => s.id === testSkill.id)).toBe(true);
    });

    it('Должен сработать поиск', async () => {
      const searchTerm = testSkillTitle.substring(0, 5);
      const response = await request(app.getHttpServer())
        .get(`/skills?search=${searchTerm}`)
        .expect(200);
      expect(response.body.some((s: Skill) => s.id === testSkill.id)).toBe(true);
    });

    it('Должна вернуться ошибка 404 при offset > total', async () => {
      const response = await request(app.getHttpServer())
        .get('/skills?offset=10000')
        .expect(404);
      expect(response.body.message).toContain('Навыки не найдены');
    });
  });

  // проверяем получение конкретного навыка по ID
  describe('GET /skills/:id', () => {
    it('Должен вернуться навык по id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills/${testSkill.id}`)
        .expect(200);
      expect(response.body.id).toBe(testSkill.id);
    });

    it('Должна вернуться ошибка 404 для несуществующего id', async () => {
      await request(app.getHttpServer()).get('/skills/99999').expect(404);
    });
  });

  // проверяем обновление навыка по ID
  describe('PATCH /skills/:id', () => {
    it('Должен обновиться навык, если обновляет владелец', async () => {
      const updatePayload = { title: 'Updated E2E Title' };
      const response = await request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);
      expect(response.body.title).toBe(updatePayload.title);
    });

    it('Должна вернуться ошибка 403 при попытке обновить чужой навык', async () => {
      const otherUserEmail = `other-${Date.now()}@test.com`;
      const otherUser = await userRepository.save({
        name: 'Other',
        email: otherUserEmail,
        password: await bcrypt.hash('password', 10),
        role: UserRole.USER,
      });
      const otherSkill = await skillRepository.save({
        title: 'Other Skill',
        description: 'desc',
        category: testCategory,
        owner: otherUser,
        images: [],
      });

      await request(app.getHttpServer())
        .patch(`/skills/${otherSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hack' })
        .expect(403);

      await skillRepository.delete(otherSkill.id);
      await userRepository.delete(otherUser.id);
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(app.getHttpServer())
        .patch(`/skills/${testSkill.id}`)
        .send({ title: 'unauth' })
        .expect(401);
    });
  });

  // проверка удаления навыка по ID
  describe('DELETE /skills/:id', () => {
    let tempSkill: Skill;

    beforeEach(async () => {
      tempSkill = await skillRepository.save({
        title: 'To Be Deleted',
        description: 'desc',
        category: testCategory,
        owner: testUser,
        images: [],
      });
    });

    afterEach(async () => {
      if (tempSkill) await skillRepository.delete(tempSkill.id).catch(() => {});
    });

    it('Должен удалиться навык, если удаляет владелец', async () => {
      await request(app.getHttpServer())
        .delete(`/skills/${tempSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const found = await skillRepository.findOneBy({ id: tempSkill.id });
      expect(found).toBeNull();
    });

    it('Должна вернуться ошибка 403 при удалении чужого навыка', async () => {
      const otherUserEmail = `otherdel-${Date.now()}@test.com`;
      const otherUser = await userRepository.save({
        name: 'OtherDel',
        email: otherUserEmail,
        password: await bcrypt.hash('pass', 10),
        role: UserRole.USER,
      });
      const otherSkill = await skillRepository.save({
        title: 'OtherDelSkill',
        description: 'desc',
        category: testCategory,
        owner: otherUser,
        images: [],
      });
      await request(app.getHttpServer())
        .delete(`/skills/${otherSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      await skillRepository.delete(otherSkill.id);
      await userRepository.delete(otherUser.id);
    });
  });

  // проверка добавления навыка в Избранное
  describe('POST /skills/:id/favorite', () => {
    it('Должен добавиться навык в избранное', async () => {
      await request(app.getHttpServer())
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });

    it('Должна вернуться ошибка 409 при повторном добавлении', async () => {
      await request(app.getHttpServer())
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(app.getHttpServer())
        .post(`/skills/${testSkill.id}/favorite`)
        .expect(401);
    });
  });

  // проверка удаления навыка из Избранного
  describe('DELETE /skills/:id/favorite', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send()
        .catch(() => {});
    });

    it('Должен удалиться навык из избранного', async () => {
      await request(app.getHttpServer())
        .delete(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('Должна вернуться ошибка 404 при повторном удалении', async () => {
      await request(app.getHttpServer())
        .delete(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  // проверка получения списка похожих навыков
  describe('GET /skills/:id/similar', () => {
    let anotherSkill: Skill;

    beforeAll(async () => {
      anotherSkill = await skillRepository.save({
        title: 'Similar Skill',
        description: 'desc',
        category: testCategory,
        owner: testUser,
        images: [],
      });
    });

    afterAll(async () => {
      await skillRepository.delete(anotherSkill.id);
    });

    it('Должен вернуться список пользователей с навыками в той же категории', async () => {
      const response = await request(app.getHttpServer())
        .get(`/skills/${testSkill.id}/similar`)
        .expect(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      const userIds = response.body.users.map((u: any) => u.id);
      expect(userIds).toContain(testUser.id);
    });

    it('Должна вернуться ошибка 404 для несуществующего навыка', async () => {
      await request(app.getHttpServer())
        .get('/skills/99999/similar')
        .expect(404);
    });
  });
});
