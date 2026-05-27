import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import 'dotenv/config';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import {
  seedTestSkills,
  seedTestSkillsExtended,
} from './seed-test-skills.data';
import { seedTestUsers } from './seed-test-users.data';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const skillRepo = app.get<Repository<Skill>>(getRepositoryToken(Skill));
    const categoryRepo = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    const adminEmail = process.env.ADMIN_EMAIL;
    const admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error('Admin not found. Run seed-admin.ts first');
    }

    // --- Тестовые пользователи ---
    const testUsers: User[] = [];
    for (const userData of seedTestUsers) {
      const user = await userRepo.findOne({
        where: { email: userData.email },
        relations: ['skills'],
      });
      if (!user) {
        throw new Error(
          `User ${userData.email} not found. Run seed-test-users.ts first`,
        );
      }
      testUsers.push(user);
    }

    // --- Получаем все категории с их children для поиска по имени ---
    const allCategories = await categoryRepo.find({
      relations: ['parent'],
    });

    // Создаем карту для быстрого поиска категории по имени (учитываем только дочерние категории)
    const categoryByNameMap = new Map<string, Category>();

    // Проходим по всем категориям и сохраняем только те, у которых есть parent (дочерние)
    for (const category of allCategories) {
      if (category.parent !== null && category.parent !== undefined) {
        categoryByNameMap.set(category.name, category);
      }
    }

    // --- Создаем карту пользователей по email для быстрого доступа ---
    const userByEmailMap = new Map<string, User>();
    for (const user of testUsers) {
      userByEmailMap.set(user.email, user);
    }

    let createdSkill = 0;
    let skippedSkill = 0;

    // --- Создаем навыки согласно расширенным данным ---
    for (const skillData of seedTestSkillsExtended) {
      // Проверяем, существует ли уже навык с таким title
      const exists = await skillRepo.findOne({
        where: { title: skillData.title },
      });

      if (exists) {
        skippedSkill++;
        console.log(`skill "${skillData.title}" already exists`);
        continue;
      }

      // Ищем пользователя, у которого в skills есть id этого навыка
      let owner: User | undefined;

      for (const user of testUsers) {
        const userFromSeed = seedTestUsers.find((u) => u.email === user.email);
        if (userFromSeed?.skills?.includes(skillData.id as number)) {
          owner = user;
          break;
        }
      }

      if (!owner) {
        console.warn(
          `No owner found for skill "${skillData.title}" (id: ${skillData.id}), skipping...`,
        );
        skippedSkill++;
        continue;
      }

      // Ищем категорию по имени среди дочерних категорий
      const categoryName = skillData.category?.name;
      if (!categoryName) {
        console.warn(
          `No category specified for skill "${skillData.title}", skipping...`,
        );
        skippedSkill++;
        continue;
      }

      const category = categoryByNameMap.get(categoryName);
      if (!category) {
        console.warn(
          `Category "${categoryName}" not found in database (must be a child category), skipping skill "${skillData.title}"...`,
        );
        skippedSkill++;
        continue;
      }

      // Создаем навык
      await skillRepo.save({
        title: skillData.title,
        description: skillData.description,
        images: skillData.images,
        owner: owner,
        category: category,
      });

      createdSkill++;
      console.log(
        `skill "${skillData.title}" created → owner: ${owner.email}, category: ${category.name}`,
      );
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

bootstrap().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
