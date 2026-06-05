import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import 'dotenv/config';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Category } from '../categories/entities/category.entity';
import { Skill } from '../skills/entities/skill.entity';
import { User } from '../users/entities/user.entity';
import { seedTestSkillsExtended } from './seed-test-skills.data';
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
        relations: ['skills', 'favoriteSkills', 'wantToLearn'],
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

    // --- Создаем карту навыков по ID ---
    const skillByIdMap = new Map<number, Skill>();

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
        skillByIdMap.set(skillData.id as number, exists);
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
      const newSkill = new Skill();
      newSkill.title = skillData.title || '';
      newSkill.description = skillData.description || '';
      newSkill.images = skillData.images || [];
      newSkill.owner = owner;
      newSkill.category = category;

      const savedSkill = await skillRepo.save(newSkill);

      createdSkill++;
      console.log(
        `Skill "${skillData.title}" created. -> owner: ${owner.name},category: ${category.name}`,
      );
      skillByIdMap.set(skillData.id as number, savedSkill);
    }

    console.log(
      `✅ Seeding skills finished. Created skills: ${createdSkill}, skipped skills: ${skippedSkill}`,
    );

    // --- Добавляем избранные навыки ---
    let addedFavoriteSkills = 0;
    let skippedFavoriteSkills = 0;

    console.log('\n--- Adding favorite skills to users ---');

    for (const userData of seedTestUsers) {
      const user = userByEmailMap.get(userData.email);
      if (
        !user ||
        !userData.favoriteSkills ||
        userData.favoriteSkills.length === 0
      ) {
        continue;
      }

      const currentFavorites = user.favoriteSkills || [];
      const existingIds = new Set(currentFavorites.map((s) => s.id));

      const newFavoriteSkills: Skill[] = [];

      for (const skillId of userData.favoriteSkills) {
        const skill = skillByIdMap.get(skillId);
        if (skill && !existingIds.has(skill.id)) {
          newFavoriteSkills.push(skill);
        } else if (!skill) {
          console.warn(
            `Skill with id ${skillId} not found for user ${user.email}`,
          );
          skippedFavoriteSkills++;
        }
      }

      if (newFavoriteSkills.length > 0) {
        // Обновляем пользователя напрямую через репозиторий с кастомным запросом
        for (const skill of newFavoriteSkills) {
          try {
            await skillRepo.manager
              .createQueryBuilder()
              .relation(User, 'favoriteSkills')
              .of(user)
              .add(skill);
            addedFavoriteSkills++;
          } catch (error) {
            // Игнорируем дубликаты
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              !errorMessage.includes('duplicate') &&
              !errorMessage.includes('already exists')
            ) {
              console.error(
                `Error adding favorite skill ${skill.id}:`,
                errorMessage,
              );
              skippedFavoriteSkills++;
            } else {
              addedFavoriteSkills++;
            }
          }
        }
        console.log(
          `Added ${newFavoriteSkills.length} f-skills to ${user.name}`,
        );
      }
    }

    console.log(
      `✅ FavoriteSkills added: ${addedFavoriteSkills}, skipped: ${skippedFavoriteSkills}`,
    );

    // ============================================
    // --- Категории для изучения (wantToLearn) ---
    // ============================================
    let addedWantToLearn = 0;
    let skippedWantToLearn = 0;

    console.log('\n--- Adding wantToLearn categories to users ---');

    // Создаем карту ТОЛЬКО дочерних категорий (у которых есть parent)
    const childCategoryByIdMap = new Map<number, Category>();
    for (const category of allCategories) {
      // Добавляем только категории, у которых есть parent (дочерние)
      if (category.parent !== null && category.parent !== undefined) {
        childCategoryByIdMap.set(category.id, category);
      }
    }

    for (const userData of seedTestUsers) {
      const user = userByEmailMap.get(userData.email);
      if (!user || !userData.wantToLearn || userData.wantToLearn.length === 0) {
        continue;
      }

      // Загружаем актуальные wantToLearn пользователя с отношениями
      const userWithWantToLearn = await userRepo.findOne({
        where: { id: user.id },
        relations: ['wantToLearn'],
      });

      const currentWantToLearn = userWithWantToLearn?.wantToLearn || [];
      const existingIds = new Set(currentWantToLearn.map((c) => c.id));

      const newWantToLearnCategories: Category[] = [];

      for (const categoryId of userData.wantToLearn) {
        const category = childCategoryByIdMap.get(categoryId);

        if (!category) {
          console.warn(
            `Category with id ${categoryId} is not a child category or not found for user ${user.email}`,
          );
          skippedWantToLearn++;
          continue;
        }

        if (existingIds.has(category.id)) {
          console.log(
            `Category "${category.name}" (id: ${category.id}) already in wantToLearn for ${user.email}`,
          );
          skippedWantToLearn++;
          continue;
        }

        newWantToLearnCategories.push(category);
      }

      if (newWantToLearnCategories.length > 0) {
        // Добавляем категории через QueryBuilder
        for (const category of newWantToLearnCategories) {
          try {
            await categoryRepo.manager
              .createQueryBuilder()
              .relation(User, 'wantToLearn')
              .of(user)
              .add(category);
            addedWantToLearn++;
            console.log(
              `Added category "${category.name}" to ${user.name}'s wantToLearn`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (
              !errorMessage.includes('duplicate') &&
              !errorMessage.includes('already exists') &&
              !errorMessage.includes('violates unique constraint')
            ) {
              console.error(
                `Error adding wantToLearn category ${category.id}:`,
                errorMessage,
              );
              skippedWantToLearn++;
            } else {
              addedWantToLearn++;
            }
          }
        }
        console.log(
          `Added ${newWantToLearnCategories.length} wantToLearn categories to ${user.name}`,
        );
      }
    }

    console.log(
      `✅ WantToLearn added: ${addedWantToLearn}, skipped: ${skippedWantToLearn}`,
    );
  } catch (error) {
    console.error('❌ seeding finished error', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error during seeding:', err);
  process.exit(1);
});
