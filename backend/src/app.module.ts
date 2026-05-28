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
import { FileUploadModule } from './file-upload/file-upload.module';
import { RequestsModule } from './requests/requests.module';
import { NotificationModule } from './notification/notification.module';
import { CitiesModule } from './cities/cities.module';
import { uploadConfig } from './config/upload.config';
import { sendmailConfig } from './config/sendmail.config';
import { SendmailModule } from './sendmail/sendmail.module';
import { yandexConfig } from './config/yandex.config';
import { googleConfig } from './config/google.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        databaseConfig,
        jwtConfig,
        appConfig,
        uploadConfig,
        sendmailConfig,
        yandexConfig,
        googleConfig,
      ],
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
    FileUploadModule,
    RequestsModule,
    NotificationModule,
    CitiesModule,
    SendmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
