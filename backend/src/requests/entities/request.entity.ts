import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../enums/request.enums';
import { ApiProperty } from '@nestjs/swagger';

@Entity('requests')
export class Request {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426655440000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: { id: 123 } })
  @ManyToOne(() => User, (user) => user.sentRequests, { nullable: false })
  sender!: User;

  @ApiProperty({ example: { id: 321 } })
  @ManyToOne(() => User, (user) => user.receivedRequests, { nullable: false })
  receiver!: User;

  @ApiProperty({ example: 'pending' })
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @ApiProperty({ example: Skill })
  @ManyToOne(() => Skill, (skill) => skill.offeredInRequests, {
    nullable: false,
  })
  offeredSkill!: Skill;

  @ApiProperty({ example: Skill })
  @ManyToOne(() => Skill, (skill) => skill.requestedInRequests, {
    nullable: false,
  })
  requestedSkill!: Skill;

  @ApiProperty({ example: true })
  @Column({ default: false })
  isRead!: boolean;
}
