import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { seedTestUsers } from './seed-test-users.data';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const configService = app.get(ConfigService);
    const salt = configService.get<number>('app.hashSalt') ?? 10;

    let createdUser = 0;
    let skippedUser = 0;

    for ( const userData of seedTestUsers ) {
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
        role: userData.role,
      })
      createdUser++;
      console.log(`user ${userData.email} created`);
    }
    console.log(`seeding finished. Created users ${createdUser}, skipped users ${skippedUser}`);
  } catch (error) {
    console.error('seeding finished error', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();