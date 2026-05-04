import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Skill } from '../skills/entities/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ Skill, Request]), AuthModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
