import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';
import { TJwtPayload } from './auth.types';

@Injectable()
export class WsAuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY) private jwtCfg: TJwtConfig,
  ) {}

  async validateToken(token: string): Promise<TJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<TJwtPayload>(token, {
        secret: this.jwtCfg.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Невалидный токен');
    }
  }
}