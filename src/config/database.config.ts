import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export const databaseConfig = registerAs('DB_CONFIG', (): DataSourceOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost', // Если undefined, будет 'localhost'
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10), // Гарантируем строку для parseInt
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? '', // Пустая строка вместо undefined
  database: process.env.DATABASE_NAME ?? 'my_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false
}));
