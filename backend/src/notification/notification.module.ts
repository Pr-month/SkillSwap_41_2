import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { WsAuthService } from '../auth/ws-auth.service';
import { jwtConfig } from '../config/jwt.config';

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule.register({})],
  providers: [NotificationGateway, WsAuthService],
  exports: [NotificationGateway],
})
export class NotificationModule {}
