import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { jwtConfig, TJwtConfig } from '../config/jwt.config';
import type { StringValue } from 'ms';
import { UsersModule } from '../users/users.module';
import { YandexStrategy } from './strategies/yandex.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (config: TJwtConfig) => {
        const jwt = config;
        return {
          secret: jwt.accessSecret,
          signOptions: {
            expiresIn: jwt.accessTokenExpires as StringValue,
          },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    YandexStrategy,
    GoogleStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
