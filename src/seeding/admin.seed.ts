import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { UserRole } from '../users/enums/users.enums';
import { databaseConfig } from '../config/database.config';

const AppDataSource = new DataSource({
  ...databaseConfig(),
  entities: [User, Skill, Category],
});

async function seedAdmin() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const skillRepo = AppDataSource.getRepository(Skill);

  const adminEmail = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;

  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(password, 10);
    admin = await userRepo.save({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
    });
    console.log('Admin создан');
  }

  let parentCat = await categoryRepo.findOne({ where: { name: 'Development' } });
  if (!parentCat) {
    parentCat = await categoryRepo.save({ name: 'Development' });
    console.log('Родительская категория Development создана');
  }

  let backendCat = await categoryRepo.findOne({ where: { name: 'Backend' } });
  if (!backendCat) {
    backendCat = await categoryRepo.save({ name: 'Backend', parent: parentCat });
    console.log('Категория Backend создана');
  }

  let frontendCat = await categoryRepo.findOne({ where: { name: 'Frontend' } });
  if (!frontendCat) {
    frontendCat = await categoryRepo.save({ name: 'Frontend', parent: parentCat });
    console.log('Категория Frontend создана');
  }

  if (!admin || !backendCat || !frontendCat) {
    throw new Error('Критическая ошибка: Зависимости для Skill не найдены');
  }

  const skillsToSeed: Partial<Skill>[] = [
    {
      title: 'NestJS Framework',
      description: 'Advanced backend development with TypeScript and Node.js',
      images: ['https://nestjs.com/img/logo-small.svg'],
      owner: admin,
      category: backendCat,
    },
    {
      title: 'React & Redux Toolkit',
      description: 'Building scalable SPA with modern state management',
      images: ['https://reactjs.org/logo-og.png'],
      owner: admin,
      category: frontendCat,
    },
    {
      title: 'Docker & Kubernetes',
      description: 'Containerization and orchestration',
      images: [],
      owner: admin,
      category: backendCat,
    },
    {
      title: 'PostgreSQL & TypeORM',
      description: 'Complex relations and query optimization',
      images: [],
      owner: admin,
      category: backendCat,
    }
  ];

  for (const s of skillsToSeed) {
    const exists = await skillRepo.findOne({ where: { title: s.title } });
    if (!exists) {
      await skillRepo.save(s);
      console.log(`Skill создан: ${s.title}`);
    }
  }

  console.log('Сидинг успешно завершен');
  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
