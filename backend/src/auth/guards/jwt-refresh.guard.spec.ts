import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Request } from 'express';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';
import { UserRole } from '../../users/enums/users.enums';
import { TJwtPayload } from '../auth.types';
import { JwtRefreshStrategy } from '../strategies/jwt-refresh.strategy';
import { JwtRefreshGuard } from './jwt-refresh.guard';

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
  cookies?: { refreshToken?: string };
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

describe('JwtRefreshGuard', () => {
  let guard: JwtRefreshGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshGuard,
        JwtRefreshStrategy,
        JwtService,
        {
          provide: jwtConfig.KEY,
          useValue: testJwtConfig,
        },
      ],
    }).compile();

    guard = module.get<JwtRefreshGuard>(JwtRefreshGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should extract refresh token from cookies and attach payload with token to request user', async () => {
    const refreshToken = jwtService.sign(jwtPayload, {
      secret: testJwtConfig.refreshSecret,
    });
    const request: TestRequest = {
      cookies: {
        refreshToken,
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(request.user).toEqual(
      expect.objectContaining({
        ...jwtPayload,
        refreshToken,
      }),
    );
  });

  it('should reject request without refresh token', async () => {
    const request: TestRequest = {
      cookies: {},
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('should reject request with invalid refresh token', async () => {
    const request: TestRequest = {
      cookies: {
        refreshToken: 'invalid-token',
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });
});
