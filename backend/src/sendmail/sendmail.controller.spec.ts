import { Test, TestingModule } from '@nestjs/testing';
import { SendmailController } from './sendmail.controller';
import { SendmailService } from './sendmail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { sendmailConfig } from '../config/sendmail.config';

describe('SendmailController', () => {
  let controller: SendmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendmailController],
      providers: [
        SendmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
            transporter: { verify: jest.fn() },
          },
        },
        {
          provide: sendmailConfig.KEY,
          useValue: { retry: { maxRetries: 3, delayMs: 10 } },
        },
      ],
    }).compile();

    controller = module.get<SendmailController>(SendmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
