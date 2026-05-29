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
import { SkillStatus } from '../src/skills/enums/skills.enums';

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

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
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
  let category: Category;
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
    category = await categoryRepository.save({ name: categoryName });

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
      status: SkillStatus.ACTIVE,
    });

    requestedSkill = await skillRepository.save({
      title: 'Requested Skill',
      description: 'Requested skill description',
      category,
      owner: receiverUser,
      images: [],
      status: SkillStatus.ACTIVE,
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
    await categoryRepository.delete(category.id);
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

      // Удаляем созданную заявку
      await request(httpServer)
        .delete(`/requests/${body.id}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);
    });

    it('должен вернуть 404 если предлагаемый навык не найден', async () => {
      const createRequestDto = {
        offeredSkillId: 99999,
        requestedSkillId: requestedSkill.id,
      };

      await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(404);
    });

    it('должен вернуть 404 если запрашиваемый навык не найден', async () => {
      const createRequestDto = {
        offeredSkillId: offeredSkill.id,
        requestedSkillId: 99999,
      };

      await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto)
        .expect(404);
    });

    it('должен вернуть 403 при попытке предложить чужой навык', async () => {
      const createRequestDto = {
        offeredSkillId: requestedSkill.id, // Навык получателя
        requestedSkillId: requestedSkill.id,
      };

      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto);

      expect(response.status).toBe(403);
    });

    it('должен вернуть 403 при попытке отправить заявку самому себе', async () => {
      // Создаем навык принадлежащий отправителю
      const senderOwnedSkill = await skillRepository.save({
        title: 'Sender Owned Skill',
        description: 'Sender owned skill description',
        category: category,
        owner: senderUser,
        images: [],
        status: SkillStatus.ACTIVE,
      });

      const createRequestDto = {
        offeredSkillId: offeredSkill.id,
        requestedSkillId: senderOwnedSkill.id, // Навык принадлежит отправителю
      };

      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto);

      expect(response.status).toBe(403);

      // Очищаем
      await skillRepository.delete(senderOwnedSkill.id);
    });

    it('должен вернуть ошибку при одинаковых навыках', async () => {
      const createRequestDto = {
        offeredSkillId: offeredSkill.id,
        requestedSkillId: offeredSkill.id,
      };

      const response = await request(httpServer)
        .post('/requests')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .send(createRequestDto);

      // Проверяем, что статус ошибки либо 400, либо 403
      // В зависимости от логики сервера
      expect([400, 403]).toContain(response.status);

      // Если хотим проверить конкретное сообщение
      if (response.status === 400) {
        const body = response.body as ErrorResponse;
        expect(body.message).toContain('Нельзя указать один и тот же навык');
      }
      // Если 403 - проверяем сообщение о заявке самому себе
      else if (response.status === 403) {
        const body = response.body as ErrorResponse;
        expect(body.message).toContain('Нельзя отправить заявку самому себе');
      }
    });
  });

  describe('GET /requests/outgoing', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
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

  describe('PATCH /requests/:id/accept', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
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

    it('должен принять заявку', async () => {
      await request(httpServer)
        .patch(`/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .expect(200);

      // Проверяем что статус изменился - заявка больше не в incoming
      const response = await request(httpServer)
        .get('/requests/incoming')
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .expect(200);

      const acceptedRequest = (response.body as CreateRequestResponse[]).find(
        (r) => r.id === requestId,
      );
      expect(acceptedRequest).toBeUndefined(); // Принятые заявки не должны попадать в incoming
    });

    it('должен вернуть 403 при попытке принять чужую заявку', async () => {
      await request(httpServer)
        .patch(`/requests/${requestId}/accept`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(403);
    });
  });

  describe('PATCH /requests/:id/reject', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
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

    it('должен отклонить заявку', async () => {
      await request(httpServer)
        .patch(`/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${authTokenReceiver}`)
        .expect(200);
    });

    it('должен вернуть 403 при попытке отклонить чужую заявку', async () => {
      await request(httpServer)
        .patch(`/requests/${requestId}/reject`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(403);
    });
  });

  describe('DELETE /requests/:id', () => {
    let requestId: string;

    beforeEach(async () => {
      const createRequestDto = {
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

    it('должен удалить заявку отправителя', async () => {
      await request(httpServer)
        .delete(`/requests/${requestId}`)
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);

      const response = await request(httpServer)
        .get('/requests/outgoing')
        .set('Authorization', `Bearer ${authTokenSender}`)
        .expect(200);

      const body = response.body as OutgoingRequestResponse[];
      expect(
        body.some((r: OutgoingRequestResponse) => r.id === requestId),
      ).toBe(false);
    });

    it('должен вернуть 403 при попытке удалить заявку получателем', async () => {
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
