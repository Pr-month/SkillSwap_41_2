import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import express from 'express';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { AuthService } from '../src/auth/auth.service';
import { seedTestUsers } from '../src/seeding/seed-test-users.data';
import { seedTestSkills } from '../src/seeding/seed-test-skills.data';
import { RequestStatus } from '../src/requests/requests.enum';

interface CreateRequestResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: RequestStatus;
  offeredSkill: { title: string };
  requestedSkill: { title: string };
}

interface OutgoingRequestResponse {
  id: string;
  senderId: string;
  offeredSkill: { title: string };
}

describe('RequestsController (E2E with Pre‑seeded Data)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let authToken: string;
  let authTokenR: string;
  let testUser: User | null;
  let offeredSkill: Skill;
  let requestedSkill: Skill;

  const getSkillOrThrow = async (title: string): Promise<Skill> => {
    const skill = await skillRepository.findOne({
      where: { title },
      relations: ['owner'],
    });
    if (!skill) throw new Error(`Skill "${title}" not found`);
    return skill;
  };

  const seedTestData = async () => {
    for (const userData of seedTestUsers) {
      const existing = await userRepository.findOne({ where: { email: userData.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await userRepository.save({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        });
      }
    }

    const users = await userRepository.find();
    for (let i = 0; i < seedTestSkills.length; i++) {
      const skillData = seedTestSkills[i];
      const exists = await skillRepository.findOne({ where: { title: skillData.title } });
      if (!exists) {
        const owner = users[i % users.length];
        await skillRepository.save({ ...skillData, owner });
      }
    }
  };

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
    httpServer = app.getHttpServer() as express.Express;

    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    skillRepository = moduleFixture.get(getRepositoryToken(Skill));

    await seedTestData();

    testUser = await userRepository.findOne({
      where: { email: seedTestUsers[0].email },
    });
    if (!testUser) throw new Error(`Test user ${seedTestUsers[0].email} not found`);

    authToken = (await authService.login({
      email: seedTestUsers[0].email,
      password: seedTestUsers[0].password,
    })).accessToken;
    authTokenR = (await authService.login({
      email: seedTestUsers[1].email,
      password: seedTestUsers[1].password,
    })).accessToken;

    if (seedTestSkills.length < 2) throw new Error('Need at least 2 skills');
    const offeredTitle = seedTestSkills[0].title;
    const requestedTitle = seedTestSkills[1].title;
    if (!offeredTitle || !requestedTitle) throw new Error('Skill titles missing');

    offeredSkill = await getSkillOrThrow(offeredTitle);
    requestedSkill = await getSkillOrThrow(requestedTitle);
  });

  afterEach(async () => {
    await skillRepository.delete({});
    await userRepository.delete({ email: In(seedTestUsers.map(u => u.email)) });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /requests', () => {
    it('должен создать новую заявку', async () => {
      if (!testUser) throw new Error('Test user not initialized');

      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };

      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto)
        .expect(201);

      const body = response.body as CreateRequestResponse;
      expect(body).toHaveProperty('id');
      expect(body.senderId).toBe(testUser.id);
      expect(body.receiverId).toBeDefined();
      expect(body.status).toBe(RequestStatus.PENDING);
      expect(body.offeredSkill.title).toBe(offeredSkill.title);
      expect(body.requestedSkill.title).toBe(requestedSkill.title);
    });

    it('должен вернуть 400 при попытке отправить заявку самому себе', async () => {
      const createRequestDto = {
        requestedSkillId: offeredSkill.id,
        offeredSkillId: offeredSkill.id,
      };
      await request(httpServer)
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
      await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto)
        .expect(404);
    });
  });

  describe('GET /requests/outgoing', () => {
    it('должен вернуть исходящие заявки пользователя', async () => {
      if (!testUser) throw new Error('Test user is not defined');
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };
      await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto);

      const response = await request(httpServer)
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body as OutgoingRequestResponse[];
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0]).toHaveProperty('id');
      expect(body[0].senderId).toBe(testUser.id);
      expect(body[0].offeredSkill.title).toBe(offeredSkill.title);
    });
  });

  describe('GET /requests/incoming', () => {
    it('должен вернуть входящие заявки пользователя', async () => {
      const response = await request(httpServer)
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        requestedSkillId: offeredSkill.id,
        offeredSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenR}`)
        .send(createRequestDto)
        .expect(201);
      const body = response.body as CreateRequestResponse;
      requestId = body.id;
    });

    it('должен обновить статус заявки на "accepted"', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };
      const response = await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);
      const updated = response.body as { status: RequestStatus };
      expect(updated.status).toBe(RequestStatus.ACCEPTED);
    });

    it('должен вернуть 403 при попытке обновить чужую заявку', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };
      await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenR}`)
        .send(updateDto)
        .expect(403);
    });

    it('должен вернуть 400 для недопустимого статуса', async () => {
      const updateDto = { status: 'INVALID_STATUS' };
      await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        requestedSkillId: requestedSkill.id,
        offeredSkillId: offeredSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRequestDto);
      const body = response.body as CreateRequestResponse;
      requestId = body.id;
    });

    it('должен удалить заявку пользователя', async () => {
      await request(httpServer)
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(httpServer)
        .get(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 403 при попытке удалить чужую заявку', async () => {
      await request(httpServer)
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenR}`)
        .expect(403);
    });

    it('должен вернуть 404 если заявка не существует', async () => {
      const idTest = uuidv4();
      await request(httpServer)
        .delete(`/requests/${idTest}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
