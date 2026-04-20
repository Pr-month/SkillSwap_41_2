import { TJwtPayload } from '../auth.types';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// import { jwtConfig, TJwtConfig } from '../../config/jwt.config';//предположительно

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() // @Inject(jwtConfig.KEY)
  // private readonly config: TJwtConfig,
  {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      // secretOrKey: config.refreshSecret,
      secretOrKey: 'mock',
      passReqToCallback: true,
    });
  }

  validate<T extends { body: { refreshToken: string } }>(
    req: T,
    payload: TJwtPayload,
  ) {
    return {
      ...payload,
      refreshToken: req.body.refreshToken,
    };
  }
}
