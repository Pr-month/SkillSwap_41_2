import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TJwtConfig, jwtConfig } from '../../config/jwt.config';
import { Inject } from '@nestjs/common';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: TJwtConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    let token: string | undefined;

    // Извлекаем токен из различных источников
    // Проверяем в query-параметрах (например, ws://...?token=...)
    if (client.handshake?.query?.token) {
      token = client.handshake.query.token as string;
    }
    // Проверяем в аuth заголовке (Authorization: Bearer <token>)
    else if (client.handshake?.headers?.authorization) {
      const authHeader = client.handshake.headers.authorization;
      const [type, extractedToken] = authHeader.split(' ');
      if (type === 'Bearer' && extractedToken) {
        token = extractedToken;
      }
    }
    // Проверяем в auth-объекте Socket.IO (socket.handshake.auth.token)
    else if (client.handshake?.auth?.token) {
      token = client.handshake.auth.token as string;
    }

    if (!token) {
      throw new UnauthorizedException('Отсутствует токен авторизации');
    }

    try {
      // Верифицируем токен с помощью секрета из конфига
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtCfg.accessSecret,
      });
      // Добавляем информацию о пользователе в объект сокета
      client.data.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Невалидный токен');
    }
  }
}