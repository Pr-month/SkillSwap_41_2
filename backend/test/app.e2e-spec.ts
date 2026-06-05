import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { AppModule } from './../src/app.module';
import { afterAll, beforeEach, describe, it } from '@jest/globals';
import { SendmailService } from '../src/sendmail/sendmail.service';
import { NotificationService } from '../src/notification/notification.service';
import { sendmailConfig } from '../src/config/sendmail.config';
import { ConfigService } from '@nestjs/config';
import { dataSource } from '../src/config/database.config';
import { testSendmailConfig } from './test-utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === sendmailConfig.KEY) {
          return testSendmailConfig;
        }
        return undefined;
      }),
    };

    const moduleFixture = await Test.createTestingModule({
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
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as express.Express;
  });

  afterAll(async () => {
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('/ (GET)', async () => {
    await request(httpServer).get('/').expect(200).expect('Hello World!');
  });
});
