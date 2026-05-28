import { ConfigType, registerAs } from '@nestjs/config';

export const yandexConfig = registerAs('yandex_config', () => ({
  clientID: process.env.YANDEX_CLIENT_ID || 'your_client_id',
  clientSecret: process.env.YANDEX_CLIENT_SECRET || 'your_client_secret',
  callbackURL:
    process.env.YANDEX_REDIRECT_URI ||
    `http://localhost:${process.env.PORT}/auth/yandex/callback`,
}));

export type TYandexConfig = ConfigType<typeof yandexConfig>;
