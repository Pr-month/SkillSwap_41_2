import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';

interface SeedCreateCategory {
  name: string;
  children?: string[];
}

export const CategoriesData: SeedCreateCategory[] = [ { name: 'Творчество и искусство', children: [ 'Управление командой', 'Маркетинг и реклама', 'Продажи и переговоры', 'Личный бренд', 'Резюме и собеседование', 'Тайм-менеджмент', 'Проектное управление', 'Предпринимательство', ], }, { name: 'IT и программирование', children: [ 'Frontend', 'Backend', 'DevOps', 'Мобильная разработка', 'GameDev', ], }, { name: 'Дизайн и UX/UI', children: ['Графический дизайн', 'UX/UI', 'Motion-дизайн', 'Web-дизайн'], }, { name: 'Финансы и бухгалтерия', children: [ 'Личная финансовая грамотность', 'Бухгалтерия и налоги', 'Инвестиции', ], }, { name: 'Маркетинг и продажи', children: ['Таргетинг', 'Контекстная реклама', 'SEO', 'Email-маркетинг'], }, { name: 'Образование и обучение', children: ['Методика преподавания', 'Онлайн-курсы', 'Педагогика'], }, { name: 'Языки', children: [ 'Английский язык', 'Немецкий язык', 'Французский язык', 'Испанский язык', 'Китайский язык', 'Русский язык', ], }, { name: 'Музыкальные инструменты', children: [ 'Гитара', 'Фортепиано', 'Скрипка', 'Ударные', 'Вокал', 'Бас-гитара', 'Саксофон', ], }, ];

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Category],
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
        parent: parent,
      });
    }
  }
}

  console.log('Categories seeded');

  await AppDataSource.destroy();
}

seedCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});