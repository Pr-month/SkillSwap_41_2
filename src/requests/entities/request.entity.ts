import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import { RequestStatus } from '../requests.enum';

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Время создания
  @CreateDateColumn()
  createdAt: Date;

  // Создавший заявку юзер
  @ManyToOne(() => User, { nullable: false })
  sender: User;

  // Юзер которому предложили
  @ManyToOne(() => User, {
    nullable: false,
  })
  receiver: User;

  // status "enum список"
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.Pending,
  })
  status: RequestStatus;

  // Предложенный отправителем навык
  @ManyToOne(() => Skill, {
    nullable: false,
  })
  offeredSkill: Skill;

  // Желаемый отправителем навык
  @ManyToOne(() => Skill, {
    nullable: false,
  })
  requestedSkill: Skill;

  // Прочел ли получатель
  @Column({ default: false })
  isRead: boolean;
}