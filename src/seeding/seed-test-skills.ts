import 'dotenv/config'; 
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { seedTestUsers } from './seed-test-users.data';
import { seedTestSkills } from './seed-test-skills.data';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const skillRepo = app.get<Repository<Skill>>(getRepositoryToken(Skill));
    const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));

    const adminEmail = process.env.ADMIN_EMAIL;
    const admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error('Admin not found. Run seed-admin.ts first');
    }

    // --- Тестовые пользователи ---
    const testUsers: User[] = [];
    for (const userData of seedTestUsers) {
      const user = await userRepo.findOne({ where: { email: userData.email } });
      if (!user) {
        throw new Error(`User ${userData.email} not found. Run seed-test-users.ts first`);
      }
      testUsers.push(user);
    }

    // --- Категории ---
    const backendCat = await categoryRepo.findOne({ where: { name: 'Backend' } });
    const frontendCat = await categoryRepo.findOne({ where: { name: 'Frontend' } });
    if (!backendCat || !frontendCat) {
      throw new Error('Categories not found. Run categories.seed.ts first');
    }

    // --- Навыки ---
    const owners = [admin, ...testUsers];
    const categories = [backendCat, frontendCat];

    let createdSkill = 0;
    let skippedSkill = 0;

    for (let i = 0; i < seedTestSkills.length; i++) {
      const skillData = seedTestSkills[i];

      const exists = await skillRepo.findOne({ where: { title: skillData.title } });
      if (exists) {
        skippedSkill++;
        console.log(`skill "${skillData.title}" already exists`);
        continue;
      }

      const owner = owners[i % owners.length];
      const category = categories[i % categories.length];

      await skillRepo.save({ ...skillData, owner, category });
      createdSkill++;
      console.log(`skill "${skillData.title}" created → owner: ${owner.email}`);
    }

    console.log(
      `seeding finished. Created skills: ${createdSkill}, skipped skills: ${skippedSkill}`,
    );
  } catch (error) {
    console.error('seeding finished error', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();