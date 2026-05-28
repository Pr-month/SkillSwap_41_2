import { ConfigType, registerAs } from '@nestjs/config';

export const googleConfig = registerAs('google_config', () => ({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL:
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/auth/google/callback',
  scope: ['profile', 'email'],
}));

export type TGoogleConfig = ConfigType<typeof googleConfig>;
