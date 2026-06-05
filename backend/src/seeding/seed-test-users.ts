import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { seedTestUsers } from './seed-test-users.data';
import { faker } from '@faker-js/faker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const configService = app.get(ConfigService);
    const salt = configService.get<number>('app.hashSalt') ?? 10;

    let createdUser = 0;
    let skippedUser = 0;

    for (const userData of seedTestUsers) {
      const existingUser = await usersRepository.findOne({
        where: { email: userData.email },
      });
      if (existingUser) {
        skippedUser++;
        console.log(`user ${userData.email} already exists`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      await usersRepository.save({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        about: userData.about,
        birthdate: userData.birthdate,
        city: userData.city ? { id: userData.city } : undefined,
        gender: userData.gender,
        avatar: userData.avatar,
        role: userData.role,
        createdAt: faker.date.recent({ days: 365 * 3 }), // Добавляем случайную дату создания
      });
      createdUser++;
      console.log(`user ${userData.email} created`);
    }
    console.log(
      `✅ Seeding finished\nCreated users ${createdUser}\nskipped users ${skippedUser}`,
    );
  } catch (error) {
    console.error('seeding finished error', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
