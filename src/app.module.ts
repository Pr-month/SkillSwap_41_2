import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<TypeOrmModuleOptions>('DB_CONFIG')!,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
