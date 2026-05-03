import { Skill } from '../../skills/entities/skill.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestStatus } from '../requests.enum';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: false })
  sender!: User;

  @ManyToOne(() => User, { nullable: false })
  receiver!: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.Pending,
  })
  status!: RequestStatus;

  @ManyToOne(() => Skill, { nullable: false })
  offeredSkill!: Skill;

  @ManyToOne(() => Skill, { nullable: false })
  requestedSkill!: Skill;

  @Column({ default: false })
  isRead!: boolean;
}
