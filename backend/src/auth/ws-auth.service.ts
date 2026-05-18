import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { Socket } from 'socket.io';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';
import { TJwtPayload } from './auth.types';

@Injectable()
export class WsAuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY) private jwtCfg: TJwtConfig,
  ) {}
  // Извлекает JWT-токен из handshake сокета
  extractToken(client: Socket): string | undefined {
    if (client.handshake?.query?.token) {
      return client.handshake.query.token as string;
    }
    if (client.handshake?.headers?.authorization) {
      const authHeader = client.handshake.headers.authorization;
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) {
        return token;
      }
    }
    if (client.handshake?.auth?.token) {
      return client.handshake.auth.token as string;
    }
    return undefined;
  }
  // Валидирует JWT-токен и возвращает payload
  async validateToken(token: string): Promise<TJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<TJwtPayload>(token, {
        secret: this.jwtCfg.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Невалидный токен');
    }
  }
  // Полная аутентификация сокета: извлекает токен, проверяет его,
  // возвращает payload. Если токена нет или он невалиден – выбрасывает исключение.
  async authenticateSocket(client: Socket): Promise<TJwtPayload> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Отсутствует токен авторизации');
    }
    return this.validateToken(token);
  }
}
