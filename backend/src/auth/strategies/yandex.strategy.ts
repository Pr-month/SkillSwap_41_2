import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-yandex';
import { TYandexConfig, yandexConfig } from 'src/config/yandex.config';
import { OAuthUserDto } from '../dto/OAuthUserDto';
import { Gender } from 'src/users/enums/users.enums';
import { OAuthProvider } from '../auth.enums';

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, 'yandex') {
  constructor(
    @Inject(yandexConfig.KEY) private readonly config: TYandexConfig,
  ) {
    /* В конструктор родителя мы можем передать параметры для стратегии */
    super({
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): OAuthUserDto {
    return {
      provider: OAuthProvider.YANDEX,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      gender: profile.gender as Gender,
      avatar: profile.photos?.[0]?.value,
    };
  }
}
