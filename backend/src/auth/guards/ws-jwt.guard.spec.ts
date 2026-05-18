import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {
  describe,
  beforeEach,
  it,
  expect,
  jest,
  afterEach,
} from '@jest/globals';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsAuthService } from '../ws-auth.service';
import { AuthenticatedSocket } from '../auth.types';
import { TJwtPayload } from '../auth.types';
import { UserRole } from '../../users/enums/users.enums';

// Helper для создания мока клиента с минимальным набором полей
const createMockClient = (): AuthenticatedSocket => {
  return {
    id: 'mock-id',
    data: { user: undefined },
    disconnect: jest.fn(),
    join: jest.fn(),
  } as any as AuthenticatedSocket;
};

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let wsAuthService: {
    authenticateSocket: jest.MockedFunction<
      (client: any) => Promise<TJwtPayload>
    >;
  };

  const mockPayload: TJwtPayload = {
    sub: 1,
    email: 'test@test.com',
    name: 'Test',
    role: UserRole.USER,
  };

  const mockExecutionContext = (
    client: AuthenticatedSocket,
  ): ExecutionContext =>
    ({
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(client),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockWsAuthService = {
      authenticateSocket: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        { provide: WsAuthService, useValue: mockWsAuthService },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    wsAuthService = module.get(WsAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Должен быть определен', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('Необходимо выполнить аутентификацию и вернуть true, если токен действителен.', async () => {
      const client = createMockClient();
      const context = mockExecutionContext(client);
      wsAuthService.authenticateSocket.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(client.data.user).toEqual(mockPayload);
      expect(wsAuthService.authenticateSocket).toHaveBeenCalledWith(client);
    });

    it('При сбое аутентификации (отсутствие токена) должно генерироваться исключение UnauthorizedException.', async () => {
      const client = createMockClient();
      const context = mockExecutionContext(client);
      const error = new UnauthorizedException('Отсутствует токен авторизации');
      wsAuthService.authenticateSocket.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(wsAuthService.authenticateSocket).toHaveBeenCalledWith(client);
      expect(client.data.user).toBeUndefined();
    });

    it('При сбое аутентификации (недействительный токен) должно генерироваться исключение UnauthorizedException.', async () => {
      const client = createMockClient();
      const context = mockExecutionContext(client);
      const error = new UnauthorizedException('Невалидный токен');
      wsAuthService.authenticateSocket.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(wsAuthService.authenticateSocket).toHaveBeenCalledWith(client);
    });
  });
});
