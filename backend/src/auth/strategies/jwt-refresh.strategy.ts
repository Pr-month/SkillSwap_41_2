import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';
import { TJwtPayload } from '../auth.types';
import { Request } from 'express';

export interface AuthRequest extends Request {
  cookies: {
    refreshToken?: string;
  };
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(@Inject(jwtConfig.KEY) private readonly config: TJwtConfig) {
    super({
      jwtFromRequest: (req: Request) => {
        const r = req as AuthRequest;
        return r.cookies?.refreshToken ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: config.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: TJwtPayload) {
    const r = req as AuthRequest;

    return {
      ...payload,
      refreshToken: r.cookies?.refreshToken ?? null,
    };
  }
}
