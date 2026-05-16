import { ConfigType, registerAs } from '@nestjs/config';

export const uploadConfig = registerAs('upload', () => ({
  folder: process.env.UPLOAD_PATH ?? 'public/uploads',
  maxSize: process.env.UPLOAD_MAX_FILE_SIZE ?? 2 * 1024 * 1024,
}));

export type TploadConfig = ConfigType<typeof uploadConfig>;
