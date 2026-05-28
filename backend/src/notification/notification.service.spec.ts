import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { SendmailService } from '../sendmail/sendmail.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/users.enums';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationGateway: jest.Mocked<NotificationGateway>;
  let sendmailService: jest.Mocked<SendmailService>;
  let consoleErrorSpy: jest.SpyInstance;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationGateway,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: SendmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationGateway = module.get(NotificationGateway);
    sendmailService = module.get(SendmailService);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('notifyNewRequest', () => {
    const data = {
      requestId: 'req-123',
      senderName: 'John Doe',
      offeredSkillTitle: 'React',
      requestedSkillTitle: 'Vue',
    };

    it('должен отправить WebSocket уведомление получателю', async () => {
      await service.notifyNewRequest(mockUser, data);

      expect(notificationGateway.sendNotification).toHaveBeenCalledTimes(1);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockUser.id,
        'new_request',
        {
          requestId: data.requestId,
          senderName: data.senderName,
          offeredSkillTitle: data.offeredSkillTitle,
          requestedSkillTitle: data.requestedSkillTitle,
        },
      );
    });

    it('должен отправить email получателю', async () => {
      await service.notifyNewRequest(mockUser, data);

      expect(sendmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(sendmailService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: 'Новая заявка на обмен навыками',
        html: expect.stringContaining(data.senderName),
        text: expect.stringContaining(data.senderName),
      });
    });

    it('не должен выбрасывать ошибку, если отправка email провалилась', async () => {
      const emailError = new Error('SMTP error');
      sendmailService.sendEmail.mockRejectedValueOnce(emailError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.notifyNewRequest(mockUser, data);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('должен отправить оба уведомления (WebSocket + email), даже если email упадёт', async () => {
      sendmailService.sendEmail.mockRejectedValueOnce(new Error('fail'));

      await service.notifyNewRequest(mockUser, data);
      await new Promise((resolve) => setImmediate(resolve));

      expect(notificationGateway.sendNotification).toHaveBeenCalled();
      expect(sendmailService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('notifyRequestAccepted', () => {
    const data = {
      requestId: 'req-123',
      receiverName: 'Jane Smith',
      offeredSkillTitle: 'React',
    };

    it('должен отправить WebSocket уведомление отправителю', async () => {
      await service.notifyRequestAccepted(mockUser, data);

      expect(notificationGateway.sendNotification).toHaveBeenCalledTimes(1);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockUser.id,
        'request_accepted',
        {
          requestId: data.requestId,
          receiverName: data.receiverName,
          offeredSkillTitle: data.offeredSkillTitle,
        },
      );
    });

    it('должен отправить email отправителю', async () => {
      await service.notifyRequestAccepted(mockUser, data);

      expect(sendmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(sendmailService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: 'Ваша заявка принята',
        html: expect.stringContaining(data.receiverName),
        text: expect.stringContaining(data.receiverName),
      });
    });

    it('не должен выбрасывать ошибку при падении email', async () => {
      sendmailService.sendEmail.mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.notifyRequestAccepted(mockUser, data),
      ).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('notifyRequestRejected', () => {
    const data = {
      requestId: 'req-123',
      receiverName: 'Jane Smith',
    };

    it('должен отправить WebSocket уведомление отправителю', async () => {
      await service.notifyRequestRejected(mockUser, data);

      expect(notificationGateway.sendNotification).toHaveBeenCalledTimes(1);
      expect(notificationGateway.sendNotification).toHaveBeenCalledWith(
        mockUser.id,
        'request_rejected',
        {
          requestId: data.requestId,
          receiverName: data.receiverName,
        },
      );
    });

    it('должен отправить email отправителю', async () => {
      await service.notifyRequestRejected(mockUser, data);

      expect(sendmailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(sendmailService.sendEmail).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: 'Заявка отклонена',
        html: expect.stringContaining(data.receiverName),
        text: expect.stringContaining(data.receiverName),
      });
    });

    it('не должен выбрасывать ошибку при падении email', async () => {
      sendmailService.sendEmail.mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.notifyRequestRejected(mockUser, data),
      ).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
