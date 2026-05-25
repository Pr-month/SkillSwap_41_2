import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
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
import express from 'express';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

interface SimilarResponse {
  users: Array<{ id: number; name: string; avatar: string | null }>;
}

describe('Skills (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
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
    await app.init();
    httpServer = app.getHttpServer() as express.Express;

    userRepository = app.get(getRepositoryToken(User));
    categoryRepository = app.get(getRepositoryToken(Category));
    skillRepository = app.get(getRepositoryToken(Skill));
    jwtService = app.get(JwtService);

    testCategory = await categoryRepository.save({ name: testCategoryName });

    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = await userRepository.save({
      name: 'E2E Skills User',
      email: testUserEmail,
      password: hashedPassword,
      role: UserRole.USER,
    });

    accessToken = jwtService.sign(
      { sub: testUser.id, email: testUser.email, role: testUser.role },
      { secret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2' },
    );
  });

  afterAll(async () => {
    if (testSkill) await skillRepository.delete(testSkill.id).catch(() => {});
    await userRepository.delete(testUser.id);
    await categoryRepository.delete(testCategory.id);
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /skills', () => {
    it('Должен создаться навык при авторизованном запросе', async () => {
      const payload = {
        title: testSkillTitle,
        description: 'E2E test description',
        categoryId: testCategory.id,
        images: ['image1.png'],
      };

      const response = await request(httpServer)
        .post('/skills')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const createdSkill = response.body as Skill;
      expect(createdSkill).toMatchObject({
        id: expect.any(Number),
        title: payload.title,
        description: payload.description,
        images: expect.arrayContaining(payload.images),
        category: expect.objectContaining({ id: testCategory.id }),
        owner: expect.objectContaining({ id: testUser.id }),
      });

      testSkill = createdSkill;
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(httpServer)
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
      const response = await request(httpServer)
        .post('/skills')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidPayload)
        .expect(400);
      const errorBody = response.body as { message: string };
      expect(errorBody.message).toBe('Validation failed');
    });
  });

  describe('GET /skills', () => {
    it('Должен вернуться список навыков', async () => {
      const response = await request(httpServer).get('/skills').expect(200);
      const skills = response.body as Skill[];
      expect(Array.isArray(skills)).toBe(true);
      const found = skills.some((s) => s.id === testSkill.id);
      expect(found).toBe(true);
    });

    it('Должен сработать фильтр по категории', async () => {
      const response = await request(httpServer)
        .get(`/skills?category=${testCategory.id}`)
        .expect(200);
      const skills = response.body as Skill[];
      const found = skills.some((s) => s.id === testSkill.id);
      expect(found).toBe(true);
    });

    it('Должен сработать фильтр по ID владельца', async () => {
      const response = await request(httpServer)
        .get(`/skills?owner=${testUser.id}`)
        .expect(200);
      const skills = response.body as Skill[];
      const found = skills.some((s) => s.id === testSkill.id);
      expect(found).toBe(true);
    });

    it('Должен сработать поиск', async () => {
      const searchTerm = testSkillTitle.substring(0, 5);
      const response = await request(httpServer)
        .get(`/skills?search=${searchTerm}`)
        .expect(200);
      const skills = response.body as Skill[];
      const found = skills.some((s) => s.id === testSkill.id);
      expect(found).toBe(true);
    });

    it('Должна вернуться ошибка 404 при offset > total', async () => {
      const response = await request(httpServer)
        .get('/skills?offset=10000')
        .expect(404);
      const errorBody = response.body as { message: string };
      expect(errorBody.message).toContain('Навыки не найдены');
    });
  });

  describe('GET /skills/:id', () => {
    it('Должен вернуться навык по id', async () => {
      const response = await request(httpServer)
        .get(`/skills/${testSkill.id}`)
        .expect(200);
      const skill = response.body as Skill;
      expect(skill.id).toBe(testSkill.id);
    });

    it('Должна вернуться ошибка 404 для несуществующего id', async () => {
      await request(httpServer).get('/skills/99999').expect(404);
    });
  });

  describe('PATCH /skills/:id', () => {
    it('Должен обновиться навык, если обновляет владелец', async () => {
      const updatePayload = { title: 'Updated E2E Title' };
      const response = await request(httpServer)
        .patch(`/skills/${testSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);
      const updatedSkill = response.body as Skill;
      expect(updatedSkill.title).toBe(updatePayload.title);
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

      await request(httpServer)
        .patch(`/skills/${otherSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hack' })
        .expect(403);

      await skillRepository.delete(otherSkill.id);
      await userRepository.delete(otherUser.id);
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(httpServer)
        .patch(`/skills/${testSkill.id}`)
        .send({ title: 'unauth' })
        .expect(401);
    });
  });

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
      await request(httpServer)
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
      await request(httpServer)
        .delete(`/skills/${otherSkill.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      await skillRepository.delete(otherSkill.id);
      await userRepository.delete(otherUser.id);
    });
  });

  describe('POST /skills/:id/favorite', () => {
    it('Должен добавиться навык в избранное', async () => {
      await request(httpServer)
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });

    it('Должна вернуться ошибка 409 при повторном добавлении', async () => {
      await request(httpServer)
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });

    it('Должна вернуться ошибка 401 без токена', async () => {
      await request(httpServer)
        .post(`/skills/${testSkill.id}/favorite`)
        .expect(401);
    });
  });

  describe('DELETE /skills/:id/favorite', () => {
    beforeAll(async () => {
      await request(httpServer)
        .post(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send()
        .catch(() => {});
    });

    it('Должен удалиться навык из избранного', async () => {
      await request(httpServer)
        .delete(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('Должна вернуться ошибка 404 при повторном удалении', async () => {
      await request(httpServer)
        .delete(`/skills/${testSkill.id}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

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
      const response = await request(httpServer)
        .get(`/skills/${testSkill.id}/similar`)
        .expect(200);
      const similar = response.body as SimilarResponse;
      expect(similar.users).toBeDefined();
      expect(Array.isArray(similar.users)).toBe(true);
      const userIds = similar.users.map((u) => u.id);
      expect(userIds).toContain(testUser.id);
    });

    it('Должна вернуться ошибка 404 для несуществующего навыка', async () => {
      await request(httpServer).get('/skills/99999/similar').expect(404);
    });
  });
});
