import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { describe, expect, beforeEach, it } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { jwtConfig } from 'src/config/jwt.config';
import { Response } from 'express';

jest.mock('bcrypt', () => ({
  hash: jest.fn(), //.mockResolvedValue('hashedPassword'),
  compare: jest.fn(), //.mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;

  // === Mock dependencies ===
  const mockJwtService = {
    sign: jest.fn(), //.mockReturnValue('mockedToken'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'app.hashSalt') return 10;
      return null;
    }),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtConfig = {
    accessSecret: 'accessSecret',
    accessTokenExpires: '15m',
    refreshSecret: 'refreshSecret',
    refreshTokenExpires: '7d',
  };

  // === Tests ===
  beforeEach(async () => {
    // Создание тестового модуля
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: jwtConfig.KEY, useValue: mockJwtConfig },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    })
      // .overrideProvider('JWT_CONFIG')
      // .useValue(mockJwtConfig)
      .compile();

    // Получение экземпляра сервиса из тестового модуля
    service = module.get<AuthService>(AuthService);

    // Очищаем все моки перед каждым тестом
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockConfigService.get.mockReturnValue(10); // Hash salt

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password'); // Mock hashed password

      mockUserRepository.create.mockReturnValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      });

      mockUserRepository.save.mockResolvedValueOnce({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        refreshToken: 'hashed-refresh-token',
      });

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

      const dto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      };

      const result = await service.register(dto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1 }); // Simulate existing user

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.user).toEqual(user);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        password: 'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        role: 'USER',
        refreshToken: 'hashed-refresh-token',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(1, 'refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        refreshToken: 'hashed-refresh-token',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshTokens(1, 'invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      mockUserRepository.update.mockResolvedValue(undefined);

      const result = await service.logout(1);

      expect(mockUserRepository.update).toHaveBeenCalledWith(1, {
        refreshToken: null,
      });
      expect(result).toEqual({ message: 'Успешный выход' });
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set cookie', () => {
      const cookieMock = jest.fn();

      const res = {
        cookie: cookieMock,
      } as unknown as Response;

      service.setRefreshTokenCookie(res, 'refresh-token');

      expect(cookieMock).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          path: '/', // Changed from '/auth' to '/'
        }),
      );
    });
  });
});
