import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import express from 'express';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Skill } from '../src/skills/entities/skill.entity';
import { Category } from '../src/categories/entities/category.entity';
import { Request as RequestEntity } from '../src/requests/entities/request.entity';
import { AuthService } from '../src/auth/auth.service';
import { RequestStatus } from '../src/requests/enums/request.enums';
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

interface CreateRequestResponse {
  id: string;
  sender: { id: number };
  receiver: { id: number };
  status: RequestStatus;
  offeredSkill: { title: string };
  requestedSkill: { title: string };
}

interface OutgoingRequestResponse {
  id: string;
  sender: { id: number };
  offeredSkill: { title: string };
}

interface UpdateRequestResponse {
  status: RequestStatus;
}

describe('RequestsController (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let authService: AuthService;
  let userRepository: Repository<User>;
  let skillRepository: Repository<Skill>;
  let categoryRepository: Repository<Category>;
  let requestRepository: Repository<RequestEntity>;

  let senderUser: User;
  let receiverUser: User;
  let offeredSkill: Skill;
  let requestedSkill: Skill;
  let authTokenSender: string;
  let authTokenReceiver: string;

  const senderEmail = `sender-${Date.now()}@test.com`;
  const receiverEmail = `receiver-${Date.now()}@test.com`;
  const password = 'Password123!';
  const categoryName = `Test Category ${Date.now()}`;

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
    categoryRepository = moduleFixture.get(getRepositoryToken(Category));
    requestRepository = moduleFixture.get(getRepositoryToken(RequestEntity));

    // 1. Создаём категорию
    const category = await categoryRepository.save({ name: categoryName });

    // 2. Создаём отправителя и получателя
    const hashedPassword = await bcrypt.hash(password, 10);
    senderUser = await userRepository.save({
      name: 'Sender',
      email: senderEmail,
      password: hashedPassword,
    });
    receiverUser = await userRepository.save({
      name: 'Receiver',
      email: receiverEmail,
      password: hashedPassword,
    });

    // 3. Создаём навыки
    offeredSkill = await skillRepository.save({
      title: 'Offered Skill',
      description: 'Offered skill description',
      category,
      owner: senderUser,
      images: [],
    });
    requestedSkill = await skillRepository.save({
      title: 'Requested Skill',
      description: 'Requested skill description',
      category,
      owner: receiverUser,
      images: [],
    });

    // 4. Получаем токены
    const loginSenderResult = await authService.login({
      email: senderEmail,
      password,
    });
    authTokenSender = loginSenderResult.accessToken;

    const loginReceiverResult = await authService.login({
      email: receiverEmail,
      password,
    });
    authTokenReceiver = loginReceiverResult.accessToken;
  });

  afterAll(async () => {
    // Удаляем все заявки, затем навыки, пользователей и категорию
    await requestRepository.clear();
    await skillRepository.delete(offeredSkill.id);
    await skillRepository.delete(requestedSkill.id);
    await userRepository.delete(senderUser.id);
    await userRepository.delete(receiverUser.id);
    await categoryRepository.delete({ name: categoryName });
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await requestRepository.clear();
  });

  describe('POST /requests', () => {
    it('должен создать новую заявку', async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: offeredSkill.id,
        requestedSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(201);

      const body = response.body as CreateRequestResponse;
      expect(body).toHaveProperty('id');
      expect(body.sender.id).toBe(senderUser.id);
      expect(body.receiver.id).toBe(receiverUser.id);
      expect(body.status).toBe(RequestStatus.PENDING);
      expect(body.offeredSkill.title).toBe(offeredSkill.title);
      expect(body.requestedSkill.title).toBe(requestedSkill.title);

      // Удаляем созданную заявку, чтобы не было конфликта в других тестах
      await request(httpServer)
        .delete(`/requests/${body.id}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);
    });

    it('должен вернуть 404 если навык не найден', async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: 99999,
        requestedSkillId: requestedSkill.id,
      };
      await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(404);
    });
  });

  describe('GET /requests/outgoing', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: offeredSkill.id,
        requestedSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(201);
      requestId = (response.body as CreateRequestResponse).id;
    });

    afterEach(async () => {
      if (requestId) {
        await request(httpServer)
          .delete(`/requests/${requestId}`)
          .set('Authorization', `Bearer ${authTokenSender}`)
          .expect(200);
      }
    });

    it('должен вернуть исходящие заявки пользователя', async () => {
      const response = await request(httpServer)
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);

      const body = response.body as OutgoingRequestResponse[];
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0]).toHaveProperty('id');
      expect(body[0].sender.id).toBe(senderUser.id);
      expect(body[0].offeredSkill.title).toBe(offeredSkill.title);
    });
  });

  describe('GET /requests/incoming', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: offeredSkill.id,
        requestedSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(201);
      requestId = (response.body as CreateRequestResponse).id;
    });

    afterEach(async () => {
      if (requestId) {
        await request(httpServer)
          .delete(`/requests/${requestId}`)
          .set('Authorization', `Bearer ${authTokenSender}`)
          .expect(200);
      }
    });

    it('должен вернуть входящие заявки пользователя', async () => {
      const response = await request(httpServer)
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .expect(200);

      const body = response.body as CreateRequestResponse[];
      expect(body).toBeInstanceOf(Array);
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].id).toBe(requestId);
    });
  });

  describe('PATCH /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: offeredSkill.id,
        requestedSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(201);
      requestId = (response.body as CreateRequestResponse).id;
    });

    afterEach(async () => {
      if (requestId) {
        await request(httpServer)
          .delete(`/requests/${requestId}`)
          .set('Authorization', `Bearer ${authTokenSender}`)
          .expect(200);
      }
    });

    it('должен обновить статус заявки на "accepted"', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };
      const response = await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .send(updateDto)
        .expect(200);
      const updated = response.body as UpdateRequestResponse;
      expect(updated.status).toBe(RequestStatus.ACCEPTED);
    });

    it('должен вернуть 403 при попытке обновить чужую заявку', async () => {
      const updateDto = { status: RequestStatus.ACCEPTED };
      await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(updateDto)
        .expect(403);
    });

    it('должен вернуть 400 для недопустимого статуса', async () => {
      const updateDto = { status: 'INVALID_STATUS' };
      await request(httpServer)
        .patch(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
        receiverId: receiverUser.id,
        offeredSkillId: offeredSkill.id,
        requestedSkillId: requestedSkill.id,
      };
      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(201);
      requestId = (response.body as CreateRequestResponse).id;
    });

    it('должен удалить заявку пользователя', async () => {
      await request(httpServer)
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);
      await request(httpServer)
        .get(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(404);
    });

    it('должен вернуть 403 при попытке удалить чужую заявку', async () => {
      await request(httpServer)
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .expect(403);
    });

    it('должен вернуть 404 если заявка не существует', async () => {
      const fakeId = '11111111-2222-3333-4444-555555555555';
      await request(httpServer)
        .delete(`/requests/${fakeId}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(404);
    });
  });
});
