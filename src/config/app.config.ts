import { registerAs, ConfigType } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  hashSalt: parseInt(process.env.HASH_SALT || '10', 10),
}));

export type TAppConfig = ConfigType<typeof appConfig>;
