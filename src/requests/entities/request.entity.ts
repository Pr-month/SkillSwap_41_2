import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Skill } from '../../skills/entities/skill.entity';
import { RequestStatus } from '../enums/request.enums';

@Entity()
export class Request {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.sentRequests)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedRequests)
  receiver: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @ManyToOne(() => Skill, (skill) => skill.offeredInRequests)
  offeredSkill: Skill;

  @ManyToOne(() => Skill, (skill) => skill.requestedInRequests)
  requestedSkill: Skill;

  @Column({ default: false })
  isRead: boolean;
}
