import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
import { RequestStatus } from '../requests.enum';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sentRequests, { nullable: false })
  sender!: User;

  @ManyToOne(() => User, (user) => user.receivedRequests, { nullable: false })
  receiver!: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @ManyToOne(() => Skill, (skill) => skill.offeredInRequests, {
    nullable: false,
  })
  offeredSkill!: Skill;

  @ManyToOne(() => Skill, (skill) => skill.requestedInRequests, {
    nullable: false,
  })
  requestedSkill!: Skill;

  @Column({ default: false })
  isRead!: boolean;
}
