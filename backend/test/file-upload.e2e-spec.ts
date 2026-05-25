import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from 'src/common/all-exception.filter';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import type { Server } from 'http';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { sendmailConfig } from '../src/config/sendmail.config';
import { dataSource } from '../src/config/database.config';
import { mockConfigService, testSendmailConfig } from './test-utils';

dotenv.config();

interface UploadSuccessResponse {
  filePath: string;
}

interface ErrorResponse {
  message: string;
}

describe('FileUploadController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let api: ReturnType<typeof request>;

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
      .compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
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

    httpServer = app.getHttpServer() as Server;
    api = request(httpServer);
  });

  afterAll(async () => {
    const uploadsPath = path.resolve(
      process.cwd(),
      process.env.UPLOADS_PATH || 'test-uploads',
    );
    await fs.rm(uploadsPath, { recursive: true, force: true });
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('/files (POST) => should upload jpg file', async () => {
    const res = await api
      .post('/files')
      .attach('file', 'test/fixtures/test-image.jpg')
      .expect(201);

    const body = res.body as UploadSuccessResponse;

    expect(body.filePath).toMatch(/^\/uploads\//);
  });

  it('/files (POST) => should return 400 with file in missing', async () => {
    await api.post('/files').expect(400);
  });

  it('/files (POST) => should reject invalid mime type', async () => {
    const res = await api
      .post('/files')
      .attach('file', 'test/fixtures/test.rtf')
      .expect(400);

    const body = res.body as ErrorResponse;

    expect(body.message).toContain(
      'Недопустимый формат файла. Разрешено: jpeg, png, gif',
    );
  });

  it('/files (POST) => should reject fake png file', async () => {
    const res = await api
      .post('/files')
      .attach('file', 'test/fixtures/fake-image.png')
      .expect(400);

    const body = res.body as ErrorResponse;
    expect(body.message).toContain(
      'Не удалось определить тип файла по содержимому',
    );
  });

  it('/files (POST) => should reject too big file', async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024); // 5MB

    const res = await api.post('/files').attach('file', bigBuffer, {
      filename: 'bit-image.png',
      contentType: 'image/png',
    });

    const body = res.body as ErrorResponse;

    expect([400, 413]).toContain(res.status);
    expect(body.message).toContain('Размер файла больше допустимого 2 МБ');
  });
});
