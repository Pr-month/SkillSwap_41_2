import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessSecret: string;
  accessTokenExpires: string;
  refreshSecret: string;
  refreshTokenExpires: string;
}

export const jwtConfig = registerAs('JWT_CONFIG', (): JwtConfig => ({
  // Access Token
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'skillswap_41_2',
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  
  // Refresh Token
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'skillswap_41_2',
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
