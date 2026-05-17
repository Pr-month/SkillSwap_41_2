import { DataSource } from 'typeorm';
import { databaseConfig } from '../src/config/database.config';

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.synchronize(true);
}