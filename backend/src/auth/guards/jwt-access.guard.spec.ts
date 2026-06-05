import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request } from 'express';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';
import { UserRole } from '../../users/enums/users.enums';
import { TJwtPayload } from '../auth.types';
import { JwtAccessStrategy } from '../strategies/jwt-access.strategy';
import { JwtAccessGuard } from './jwt-access.guard';

const testJwtConfig: TJwtConfig = {
  accessSecret: 'test-access-secret',
  accessTokenExpires: '15m',
  refreshSecret: 'test-refresh-secret',
  refreshTokenExpires: '7d',
  frontendUrl: 'http://localhost:8080',
};

const jwtPayload: TJwtPayload = {
  sub: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: UserRole.USER,
};

type TestRequest = Partial<Request> & {
  body?: Record<string, unknown>;
  user?: unknown;
};

const createExecutionContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: jest.fn(),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAccessGuard', () => {
  let guard: JwtAccessGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessGuard,
        JwtAccessStrategy,
        JwtService,
        {
          provide: jwtConfig.KEY,
          useValue: testJwtConfig,
        },
      ],
    }).compile();

    guard = module.get<JwtAccessGuard>(JwtAccessGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should extract access token from authorization header and attach payload to request user', async () => {
    const accessToken = jwtService.sign(jwtPayload, {
      secret: testJwtConfig.accessSecret,
    });
    const request: TestRequest = {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(request.user).toEqual(expect.objectContaining(jwtPayload));
  });

  it('should reject request without access token', async () => {
    const request: TestRequest = {
      headers: {},
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });
});
