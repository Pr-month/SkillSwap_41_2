import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { Request } from './entities/request.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([Request, User, Skill]),
    AuthModule,
    NotificationModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
