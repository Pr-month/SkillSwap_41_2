import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { databaseConfig } from '../config/database.config';
import { User } from 'src/users/entities/user.entity';
import { City } from 'src/cities/entities/city.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import { Request } from 'src/requests/entities/request.entity';
import { CategoriesData } from './categories.data';

const AppDataSource = new DataSource({
  ...databaseConfig(),
  entities: [Category, User, City, Skill, Request],
});

async function seedCategories() {
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(Category);

  for (const category of CategoriesData) {
    let parent = await repo.findOne({
      where: { name: category.name },
    });

    if (!parent) {
      parent = await repo.save({
        name: category.name,
        slug: category.slug,
      });
    }

    if (category.children?.length) {
      for (const childName of category.children) {
        const childExists = await repo.findOne({
          where: { name: childName },
        });

        if (childExists) continue;

        await repo.save({
          name: childName,
          parent,
        });
      }
    }
  }

  console.log('✅ Categories seeded');

  await AppDataSource.destroy();
}

seedCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});
