import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig, TDatabaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';
import { SkillsModule } from './skills/skills.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig, jwtConfig, appConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (config: TDatabaseConfig) => config,
    }),
    UsersModule,
    AuthModule,
    SkillsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
