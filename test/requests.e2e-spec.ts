import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAccessGuard } from '../src/auth/guards/jwt-access.guard';
import { TRequestWithUser } from '../src/auth/auth.types';
import { RequestsController } from '../src/requests/requests.controller';
import { RequestsService } from '../src/requests/requests.service';
import { UserRole } from '../src/users/enums/users.enums';

describe('RequestsController (e2e)', () => {
  let app: INestApplication<App>;
  const requestsServiceMock = {
    findOutgoing: jest.fn(),
  };
  const accessTokenGuardMock: CanActivate = {
    canActivate(context: ExecutionContext) {
      const req = context.switchToHttp().getRequest<TRequestWithUser>();
      req.user = {
        name: 'user-1',
        sub: 1,
        email: 'user1@example.com',
        role: UserRole.USER,
      };
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: requestsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAccessGuard)
      .useValue(accessTokenGuardMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns outgoing requests for the authenticated user', async () => {
    requestsServiceMock.findOutgoing.mockResolvedValue([{ id: 'request-1' }]);

    await request(app.getHttpServer())
      .get('/requests/outgoing')
      .expect(200)
      .expect([{ id: 'request-1' }]);

    expect(requestsServiceMock.findOutgoing).toHaveBeenCalledWith('user-1');
  });
});
