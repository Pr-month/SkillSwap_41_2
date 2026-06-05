import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsAuthService } from './ws-auth.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig, TJwtConfig } from 'src/config/jwt.config';

type MockSocket = {
  handshake: {
    query: Record<string, string | string[]>;
    headers: Record<string, string>;
    auth?: {
      token?: string;
    };
    time: string;
    address: string;
    xdomain: boolean;
    secure: boolean;
    issued: number;
    url: string;
    id: string;
  };
} & Partial<Socket>;

// Мок JwtService
const mockJwtService = {
  verifyAsync: jest.fn(),
};

// Мок конфига
const mockJwtConfig: TJwtConfig = {
  accessSecret: 'test-secret',
  refreshSecret: 'test-refresh-secret',
  accessTokenExpires: '15m',
  refreshTokenExpires: '7d',
  frontendUrl: 'http://localhost:8080',
};

describe('WsAuthService', () => {
  let service: WsAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    service = module.get<WsAuthService>(WsAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===============
  // Extract token
  // ===================
  describe('extractToken', () => {
    let mockSocket: MockSocket;

    beforeEach(() => {
      // Создаем полный мок сокета с необходимыми полями
      mockSocket = {
        handshake: {
          query: {},
          headers: {},
          auth: {},
          // Заглушки для обязательных полей Handshake
          time: '2024-01-01T00:00:00.000Z',
          address: '::1',
          xdomain: false,
          secure: false,
          issued: 1234567890,
          url: '/socket.io',
          id: 'test-socket-id',
        },
      };
    });

    it('должен извлечь токен из query.token', () => {
      const expectedToken = 'test-token-from-query';
      mockSocket.handshake.query = { token: expectedToken };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBe(expectedToken);
    });

    it('должен извлечь токен из headers.authorization с Bearer схемой', () => {
      const expectedToken = 'test-bearer-token';
      mockSocket.handshake.headers = {
        authorization: `Bearer ${expectedToken}`,
      };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBe(expectedToken);
    });

    it('должен вернуть undefined если заголовок authorization без Bearer схемы', () => {
      mockSocket.handshake.headers = {
        authorization: 'Basic base64credentials',
      };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBeUndefined();
    });

    it('должен вернуть undefined если заголовок authorization имеет неверный формат', () => {
      mockSocket.handshake.headers = {
        authorization: 'InvalidFormat',
      };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBeUndefined();
    });

    it('должен извлечь токен из handshake.auth.token', () => {
      const expectedToken = 'test-token-from-auth';
      mockSocket.handshake.auth = { token: expectedToken };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBe(expectedToken);
    });

    it('должен отдавать приоритет query.token перед другими способами', () => {
      const queryToken = 'token-from-query';
      const authToken = 'token-from-auth';

      mockSocket.handshake.query = { token: queryToken };
      mockSocket.handshake.auth = { token: authToken };
      mockSocket.handshake.headers = {
        authorization: 'Bearer token-from-header',
      };

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBe(queryToken);
    });

    it('должен отдавать приоритет headers.authorization над auth.token если query.token отсутствует', () => {
      const headerToken = 'token-from-header';
      const authToken = 'token-from-auth';

      mockSocket.handshake.headers = {
        authorization: `Bearer ${headerToken}`,
      };
      mockSocket.handshake.auth = { token: authToken };
      mockSocket.handshake.query = {};

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBe(headerToken);
    });

    it('должен вернуть undefined если токен не найден ни в одном месте', () => {
      mockSocket.handshake.query = {};
      mockSocket.handshake.headers = {};
      mockSocket.handshake.auth = {};

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBeUndefined();
    });

    it('должен корректно обработать отсутствие handshake', () => {
      mockSocket.handshake = undefined as any;

      const result = service.extractToken(mockSocket as unknown as Socket);

      expect(result).toBeUndefined();
    });
  });

  // ===================
  // Validate token
  // ===================
  describe('validateToken', () => {
    const mockPayload = {
      sub: 123,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    };

    it('должен вернуть payload при валидном токене', async () => {
      const token = 'valid-token';
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.validateToken(token);

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.accessSecret,
      });
    });

    it('должен выбросить UnauthorizedException при невалидном токене', async () => {
      const token = 'invalid-token';
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateToken(token)).rejects.toThrow(
        'Невалидный токен',
      );
    });

    it('должен выбросить UnauthorizedException при просроченном токене', async () => {
      const token = 'expired-token';
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ====================
  // Authenticate socket
  // ====================
  describe('authenticateSocket', () => {
    let mockSocket: MockSocket;
    const mockPayload = {
      sub: 123,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    };

    beforeEach(() => {
      mockSocket = {
        handshake: {
          query: {},
          headers: {},
          auth: {},
          time: '2024-01-01T00:00:00.000Z',
          address: '::1',
          xdomain: false,
          secure: false,
          issued: 1234567890,
          url: '/socket.io',
          id: 'test-socket-id',
        },
      };
    });

    it('должен успешно аутентифицировать сокет с токеном в query', async () => {
      const token = 'valid-token';
      mockSocket.handshake.query = { token: token };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.authenticateSocket(
        mockSocket as unknown as Socket,
      );

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.accessSecret,
      });
    });

    it('должен успешно аутентифицировать сокет с токеном в headers', async () => {
      const token = 'valid-token';
      mockSocket.handshake.headers = {
        authorization: `Bearer ${token}`,
      };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.authenticateSocket(
        mockSocket as unknown as Socket,
      );

      expect(result).toEqual(mockPayload);
    });

    it('должен успешно аутентифицировать сокет с токеном в auth', async () => {
      const token = 'valid-token';
      mockSocket.handshake.auth = { token: token };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.authenticateSocket(
        mockSocket as unknown as Socket,
      );

      expect(result).toEqual(mockPayload);
    });

    it('должен выбросить UnauthorizedException если токен отсутствует', async () => {
      mockSocket.handshake.query = {};
      mockSocket.handshake.headers = {};
      mockSocket.handshake.auth = {};

      await expect(
        service.authenticateSocket(mockSocket as unknown as Socket),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.authenticateSocket(mockSocket as unknown as Socket),
      ).rejects.toThrow('Отсутствует токен авторизации');
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('должен выбросить UnauthorizedException если токен невалиден', async () => {
      const token = 'invalid-token';
      mockSocket.handshake.query = { token: token };
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.authenticateSocket(mockSocket as unknown as Socket),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен пробросить оригинальную ошибку от validateToken', async () => {
      const token = 'expired-token';
      mockSocket.handshake.query = { token: token };
      mockJwtService.verifyAsync.mockRejectedValue(
        new UnauthorizedException('Токен просрочен'),
      );

      await expect(
        service.authenticateSocket(mockSocket as unknown as Socket),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
