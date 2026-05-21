import { ConfigType, registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  // Access Token
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2',
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

  // Refresh Token
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'skillswap_41_2',
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:8080',
}));

export type TJwtConfig = ConfigType<typeof jwtConfig>;
