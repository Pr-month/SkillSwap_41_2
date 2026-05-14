/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Skill } from '../src/skills/entities/skill.entity';

import { AuthService } from '../src/auth/auth.service';
import { seedTestUsers } from '../src/seeding/seed-test-users.data';

import { seedTestSkills } from '../src/seeding/seed-test-skills.data';
import { RequestStatus } from '../src/requests/requests.enum';

describe('RequestsController (E2E with Pre‑seeded Data)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let authToken: string;
  let authTokenR: string;
  let testUser: User;
  let offeredSkill: Skill;
  let requestedSkill: Skill;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Получаем репозитории
    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    skillRepository = moduleFixture.get(getRepositoryToken(Skill));

    // Находим тестового пользователя
    const testUserR = await userRepository.findOne({
      where: { email: seedTestUsers[0].email },
    });

    if (testUserR) {
      testUser = testUserR;
    } else {
      throw new Error(
        `Test user with email ${seedTestUsers[0].email} not found in database. Please check seeding.`,
      );
    }

    // Генерируем JWT‑токен для тестового пользователя
    authToken = (
      await authService.login({
        email: seedTestUsers[0].email,
        password: seedTestUsers[0].password,
      })
    ).accessToken;
    authTokenR = (
      await authService.login({
        email: seedTestUsers[1].email,
        password: seedTestUsers[1].password,
      })
    ).accessToken;

    // Находим навыки для тестирования
    const offeredSkillR = await skillRepository.findOne({
      where: { title: seedTestSkills[0].title },
      relations: ['owner'],
    });

    if (offeredSkillR) {
      offeredSkill = offeredSkillR;
    } else {
      throw new Error(
        `Offered skill "${seedTestSkills[0].title}" not found in database`,
      );
    }

    const requestedSkillR = await skillRepository.findOne({
      where: { title: seedTestSkills[1].title },
      relations: ['owner'],
    });

    if (requestedSkillR) {
      requestedSkill = requestedSkillR;
    } else {
      throw new Error(
        `Requested skill "${seedTestSkills[1].title}" not found in database`,
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /requests', () => {
    it('должен создать новую заявку', async () => {
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };

      const response = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.senderId).toBe(testUser.id);
      expect(response.body.receiverId).toBeDefined();
      expect(response.body.status).toBe(RequestStatus.PENDING);
      expect(response.body.offeredSkill.title).toBe(offeredSkill.title);
      expect(response.body.requestedSkill.title).toBe(requestedSkill.title);
    });

    it('должен вернуть 400 при попытке отправить заявку самому себе', async () => {
      const createRequestDto = {
        requestedSkillId: offeredSkill.id,
        offeredSkillId: offeredSkill.id,
      };

      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto)
        .expect(400);
    });

    it('должен вернуть 404 если навык не найден', async () => {
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: uuidv4(),
      };

      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto)
        .expect(404);
    });
  });

  describe('GET /requests/outgoing', () => {
    it('должен вернуть исходящие заявки пользователя', async () => {
      // Сначала создаём заявку
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };
      await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto);

      // Затем получаем исходящие заявки
      const response = await request(app.getHttpServer())
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0].senderId).toBe(testUser.id);
      expect(response.body[0].offeredSkill.title).toBe(offeredSkill.title);
    });
  });

  describe('GET /requests/incoming', () => {
    it('должен вернуть входящие заявки пользователя', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      // Создаём вх заявку для тестирования
      const createRequestDto = {
        requestedSkillId: offeredSkill.id,
        offeredSkillId: requestedSkill.id,
      };

      const response = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenR}`)
        .send(createRequestDto);
      requestId = response.body.id;
    });

    it('должен обновить статус заявки на "accepted"', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };

      const response = await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(RequestStatus.ACCEPTED);
    });

    it('должен вернуть 403 при попытке обновить чужую заявку', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenR}`)
        .send(updateDto)
        .expect(403);
    });

    it('должен вернуть 400 для недопустимого статуса', async () => {
      const updateDto = { status: 'INVALID_STATUS' };

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      // Создаём заявку для тестирования
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };
      const response = await request(app.getHttpServer())
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto);
      requestId = response.body.id;
    });

    it('должен удалить заявку пользователя', async () => {
      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Проверяем, что заявка больше не существует
      await request(app.getHttpServer())
        .get(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 403 при попытке удалить чужую заявку', async () => {
      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenR}`)
        .expect(403);
    });

    it('должен вернуть 404 если заявка не существует', async () => {
      const idTest = uuidv4();
      await request(app.getHttpServer())
        .delete(`/requests/${idTest}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
