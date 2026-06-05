/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { MailerService } from '@nestjs-modules/mailer';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { SendmailController } from '../src/sendmail/sendmail.controller';
import { sendmailConfig, TSendmailConfig } from '../src/config/sendmail.config';

interface ErrorResponse {
  message: string;
  errors: Array<{ field: string; errors: string[] }>;
}

describe('SendmailController (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;
  let mailerService: jest.Mocked<MailerService>;

  const testConfig: TSendmailConfig = {
    transport: {
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: { user: 'test', pass: 'test' },
    },
    defaults: { from: 'test@example.com' },
    retry: { maxRetries: 1, delayMs: 0 },
  };

  const validTextPayload = {
    to: 'test@example.com',
    subject: 'Test subject',
    text: 'Hello world',
  };

  const validHtmlPayload = {
    to: 'user@example.com',
    subject: 'HTML email',
    html: '<h1>Hello</h1>',
  };

  beforeAll(async () => {
    // Моки логгера перед созданием приложения
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SendmailController],
      providers: [
        SendmailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({}),
            transporter: { verify: jest.fn().mockResolvedValue(true) },
          },
        },
        {
          provide: sendmailConfig.KEY,
          useValue: testConfig,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: true,
        exceptionFactory: (errors) => {
          return new BadRequestException({
            message: 'Validation failed',
            errors: errors.map((err) => ({
              field: err.property,
              errors: Object.values(err.constraints || {}),
            })),
          });
        },
      }),
    );
    await app.init();
    httpServer = app.getHttpServer() as express.Express;
    mailerService = moduleFixture.get(MailerService);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен успешно отправить текстовое письмо (204)', async () => {
    await request(httpServer)
      .post('/sendmail/send')
      .send(validTextPayload)
      .expect(204);

    const sendMailMock = mailerService.sendMail;
    expect(sendMailMock.mock.calls.length).toBe(1);
    expect(sendMailMock.mock.calls[0][0]).toMatchObject({
      to: validTextPayload.to,
      subject: validTextPayload.subject,
      text: validTextPayload.text,
      html: undefined,
    });
  });

  it('должен успешно отправить HTML-письмо (204)', async () => {
    await request(httpServer)
      .post('/sendmail/send')
      .send(validHtmlPayload)
      .expect(204);

    const sendMailMock = mailerService.sendMail;
    expect(sendMailMock.mock.calls.length).toBe(1);
    expect(sendMailMock.mock.calls[0][0]).toMatchObject({
      to: validHtmlPayload.to,
      subject: validHtmlPayload.subject,
      text: undefined,
      html: validHtmlPayload.html,
    });
  });

  it('должен вернуть 400, если отсутствует поле to', async () => {
    const payload = { subject: 'No to', text: 'message' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'to' })]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400, если отсутствует subject', async () => {
    const payload = { to: 'test@example.com', text: 'message' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'subject' })]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400, если отсутствуют и text, и html', async () => {
    const payload = { to: 'test@example.com', subject: 'No content' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    const fields = body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['text', 'html']));
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400, если email невалидный', async () => {
    const payload = { to: 'not-email', subject: 'Invalid email', text: 'msg' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'to' })]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400, если subject пустая строка', async () => {
    const payload = { to: 'test@example.com', subject: '', text: 'msg' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'subject' })]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400, если text пустая строка', async () => {
    const payload = { to: 'test@example.com', subject: 'Test', text: '' };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'text' })]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 400 при наличии лишних полей (forbidNonWhitelisted)', async () => {
    const payload = {
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
      extraField: 'should be forbidden',
    };
    const response = await request(httpServer)
      .post('/sendmail/send')
      .send(payload)
      .expect(400);
    const body = response.body as ErrorResponse;
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'extraField' }),
      ]),
    );
    expect(mailerService.sendMail).not.toHaveBeenCalled();
  });

  it('должен вернуть 500, если отправка письма не удалась (SMTP ошибка)', async () => {
    (mailerService.sendMail as jest.Mock).mockRejectedValueOnce(
      new Error('SMTP error'),
    );
    await request(httpServer)
      .post('/sendmail/send')
      .send(validTextPayload)
      .expect(500);
    expect(mailerService.sendMail).toHaveBeenCalled();
  });
});
