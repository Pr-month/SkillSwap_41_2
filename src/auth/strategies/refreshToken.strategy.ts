import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken || req?.body?.refreshToken,
      ]),
      secretOrKey: secret,
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    return { ...payload, refreshToken };
  }
}