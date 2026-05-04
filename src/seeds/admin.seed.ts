import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { UserRole } from '../users/enums/users.enums';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Skill, Category],
});

async function seedAdmin() {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL или ADMIN_PASSWORD не заданы');
    process.exit(1);
  }

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log('Admin уже существует');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await repo.save({
    email,
    password: hashedPassword,
    name: 'Admin',
    role: UserRole.ADMIN,
  });

  console.log('Admin создан');

  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
