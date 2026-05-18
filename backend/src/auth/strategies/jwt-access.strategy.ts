import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig, TJwtConfig } from '../../config/jwt.config';
import { TJwtPayload } from '../auth.types';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(@Inject(jwtConfig.KEY) private readonly config: TJwtConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.accessSecret,
    });
  }

  validate(payload: TJwtPayload) {
    return {
      ...payload,
      id: payload.sub,
    };
  }
}
