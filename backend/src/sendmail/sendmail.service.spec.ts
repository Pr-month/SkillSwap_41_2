import { Test, TestingModule } from '@nestjs/testing';
import { SendmailService } from './sendmail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { sendmailConfig } from '../config/sendmail.config';

interface MockMailerService {
  sendMail: jest.Mock;
  transporter: {
    verify: jest.Mock;
  };
}

describe('MailService', () => {
  let service: SendmailService;
  let mailerService: MockMailerService;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const mockConfig = {
    retry: {
      maxRetries: 3,
      delayMs: 10,
    },
  };

  beforeEach(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
            transporter: {
              verify: jest.fn(),
            },
          },
        },
        {
          provide: sendmailConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get(SendmailService);
    mailerService = module.get(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // =========================
  // sendEmail
  // =========================

  it('should send email successfully', async () => {
    mailerService.sendMail.mockResolvedValueOnce({});

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(mailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@mail.com',
      subject: 'Test',
      text: 'Hello',
      html: undefined,
    });
  });

  it('should support html email', async () => {
    mailerService.sendMail.mockResolvedValueOnce({});

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'HTML',
      html: '<b>Hello</b>',
    });

    expect(mailerService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<b>Hello</b>',
      }),
    );
  });

  it('should retry and succeed on last attempt', async () => {
    mailerService.sendMail
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce({} as any);

    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Retry Test',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should not retry if first attempt succeeds', async () => {
    mailerService.sendMail.mockResolvedValueOnce({});

    const sleepSpy = jest.spyOn(service as any, 'sleep');

    await service.sendEmail({
      to: 'test@mail.com',
      subject: 'Fast success',
    });

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(sleepSpy).not.toHaveBeenCalled();
  });

  it('should throw after all retries fail', async () => {
    mailerService.sendMail.mockRejectedValue(new Error('fail'));

    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    await expect(
      service.sendEmail({
        to: 'test@mail.com',
        subject: 'Fail test',
      }),
    ).rejects.toThrow('fail');

    expect(mailerService.sendMail).toHaveBeenCalledTimes(3);
    expect(sleepSpy).toHaveBeenCalledTimes(2);
  });

  it('should work with single retry config', async () => {
    const singleRetryConfig = {
      retry: { maxRetries: 1, delayMs: 10 },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockRejectedValue(new Error('fail')),
          },
        },
        {
          provide: sendmailConfig.KEY,
          useValue: singleRetryConfig,
        },
      ],
    }).compile();

    const localService = module.get(SendmailService);

    await expect(
      localService.sendEmail({
        to: 'test@mail.com',
        subject: 'One try',
      }),
    ).rejects.toThrow();

    const localMailer = module.get(MailerService);

    expect(localMailer.sendMail).toHaveBeenCalledTimes(1);
  });

  // =========================
  // verifyConnection
  // =========================

  it('should verify SMTP connection on init', async () => {
    const verifyMock = jest.fn().mockResolvedValue(true);
    mailerService.transporter.verify = verifyMock;
    await service.onModuleInit();
    expect(verifyMock).toHaveBeenCalled();
  });

  it('should handle missing transporter gracefully', async () => {
    const originalTransporter = mailerService.transporter;
    Reflect.set(mailerService, 'transporter', null);
    await expect(service.onModuleInit()).resolves.not.toThrow();
    Reflect.set(mailerService, 'transporter', originalTransporter);
  });

  it('should log error if verify fails', async () => {
    const error = new Error('SMTP fail');
    const verifyMock = jest.fn().mockRejectedValue(error);
    mailerService.transporter.verify = verifyMock;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await service.onModuleInit();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // =========================
  // edge cases
  // =========================

  it('should propagate last error correctly', async () => {
    const error = new Error('final error');
    mailerService.sendMail.mockRejectedValue(error);

    await expect(
      service.sendEmail({
        to: 'test@mail.com',
        subject: 'Error test',
      }),
    ).rejects.toBe(error);
  });
});
