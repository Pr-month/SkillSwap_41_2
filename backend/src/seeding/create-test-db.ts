import { Client } from 'pg';
import 'dotenv/config';

async function createTestDb() {
  const client = new Client({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: 'postgres',
  });

  await client.connect();

  const dbName = process.env.DATABASE_NAME;
  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName],
  );

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database --- ${dbName} --- created`);
  } else {
    console.log(`✅ Database --- ${dbName} --- already exists`);
  }

  await client.end();
}

createTestDb().catch((err) => {
  console.error('❌ Failed to create database:', err);
  process.exit(1);
});
