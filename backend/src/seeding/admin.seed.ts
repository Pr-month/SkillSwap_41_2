import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Category } from '../categories/entities/category.entity';
import { UserRole } from '../users/enums/users.enums';
import { databaseConfig } from '../config/database.config';
import { Request } from '../requests/entities/request.entity';
import { City } from 'src/cities/entities/city.entity';

const AppDataSource = new DataSource({
  ...databaseConfig(),
  entities: [User, Skill, Category, Request, City],
});

async function seedAdmin() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

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
  } else {
    console.log('Admin уже существует');
  }

  console.log('✅ Сидинг админа успешно завершен');
  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
