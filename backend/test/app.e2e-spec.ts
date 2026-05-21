import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import express from 'express';
import { AppModule } from './../src/app.module';
import { describe, beforeEach, it } from '@jest/globals';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: express.Express;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as express.Express;
  });

  it('/ (GET)', async () => {
    await request(httpServer)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
