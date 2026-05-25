import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { WsAuthService } from '../auth/ws-auth.service';
import { jwtConfig } from '../config/jwt.config';
import { SendmailModule } from '../sendmail/sendmail.module';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.register({}),
    SendmailModule,
  ],
  providers: [NotificationGateway, WsAuthService, NotificationService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
