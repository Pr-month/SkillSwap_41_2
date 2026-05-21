import { ConfigType, registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const databaseConfig = registerAs(
  'DB_CONFIG',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost', // Если undefined, будет 'localhost'
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10), // Гарантируем строку для parseInt
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '', // Пустая строка вместо undefined
    database: process.env.DATABASE_NAME ?? 'my_db',
    entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
    synchronize: process.env.NODE_ENV !== 'production',
    migrations: [path.join(__dirname, '/../database/migrations/**/*{.ts,.js}')],
  }),
);

export type TDatabaseConfig = ConfigType<typeof databaseConfig>;

export const dataSource = new DataSource(databaseConfig());
