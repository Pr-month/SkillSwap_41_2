import { Exclude } from 'class-transformer';
import { Request } from 'src/requests/entities/request.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender, UserRole } from '../enums/users.enums';
import { City } from 'src/cities/entities/city.entity';
import { Category } from 'src/categories/entities/category.entity';
import { OAuthProvider } from 'src/auth/auth.enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Exclude()
  @Column({ nullable: true, type: 'varchar', length: 255 })
  password?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: Date;

  @ManyToOne(() => City, { nullable: true })
  city?: City;

  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender?: Gender;

  @Column({ nullable: true })
  avatar?: string;

  @OneToMany(() => Skill, (skill) => skill.owner)
  skills?: Skill[];

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'user_favorite_skills' })
  favoriteSkills?: Skill[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string | null;

  @OneToMany(() => Request, (request) => request.sender)
  sentRequests!: Request[];

  @OneToMany(() => Request, (request) => request.receiver)
  receivedRequests!: Request[];

  @ManyToMany(() => Category, (category) => category.usersWhoWantToLearn)
  @JoinTable({
    name: 'wantToLearn',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  wantToLearn?: Category[];

  @Column({ type: 'enum', enum: OAuthProvider, nullable: true })
  provider?: OAuthProvider | null;
}
