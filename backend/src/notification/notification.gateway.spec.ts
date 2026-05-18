import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from './notification.gateway';
import { WsAuthService } from '../auth/ws-auth.service';
import { Server, Socket } from 'socket.io';
import { NotificationType } from './notification.types';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let wsAuthService: WsAuthService;

  const mockSocket = () => {
    return {
      id: 'socket-id',
      join: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;
  };

  const mockServer = () => {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
  };

  const mockWsAuthService = {
    authenticateSocket: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: WsAuthService,
          useValue: mockWsAuthService,
        },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    wsAuthService = module.get<WsAuthService>(WsAuthService);

    gateway.server = mockServer();
    jest.clearAllMocks();
  });

  describe('Обработка подключения', () => {
    it('Аутентифицируем сокет и кладём его в room (userId)', async () => {
      const client = mockSocket();

      mockWsAuthService.authenticateSocket.mockResolvedValue({
        sub: 123,
      });

      await gateway.handleConnection(client);

      expect(wsAuthService.authenticateSocket).toHaveBeenCalledWith(client);
      expect(client.join).toHaveBeenCalledWith('123');
    });

    it('Если авторизация не удалась - провал:', async () => {
      const client = mockSocket();

      mockWsAuthService.authenticateSocket.mockRejectedValue(
        new Error('Unauthorized'),
      );

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('Обработка отключения', () => {
    it('Метод безопасно выполняется и не падает', () => {
      const client = mockSocket();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(client);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Client disconnected: ${client.id}`,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Отправка сообщений', () => {
    it('Сообщение идёт конкретному пользователю', () => {
      const server = gateway.server;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.sendNotification(123, 'TEST_TYPE' as NotificationType, {
        foo: 'bar',
      });

      const expectAnyString = () => expect.any(String) as unknown as string;

      expect(server.to).toHaveBeenCalledWith('123');
      expect(server.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'TEST_TYPE',
          data: { foo: 'bar' },
          timestamp: expectAnyString(),
        }),
      );

      consoleSpy.mockRestore();
    });
  });
});
