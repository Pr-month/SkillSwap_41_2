import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../../users/enums/users.enums';
import { RolesGuard } from './roles.guard';

type TestRequest = {
  user?: {
    role: UserRole;
  };
};

const createExecutionContext = (request: TestRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  }) as unknown as ExecutionContext;

describe('RolesGuard тесты:', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    const context = createExecutionContext({ user: { role: UserRole.USER } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if required roles list is empty', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([]);

    const context = createExecutionContext({ user: { role: UserRole.USER } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);

    const context = createExecutionContext({ user: { role: UserRole.ADMIN } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedException if user is not authenticated', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);

    const context = createExecutionContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user does not have required role', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([UserRole.ADMIN]);

    const context = createExecutionContext({ user: { role: UserRole.USER } });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue([UserRole.ADMIN, UserRole.USER]);

    const context = createExecutionContext({ user: { role: UserRole.USER } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should fallback to class roles if handler has no roles', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValueOnce(undefined) // handler
      .mockReturnValueOnce([UserRole.ADMIN]); // class

    const context = createExecutionContext({ user: { role: UserRole.ADMIN } });

    expect(guard.canActivate(context)).toBe(true);
  });
});
