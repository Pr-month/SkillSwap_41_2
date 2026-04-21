import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
//ManyToMany,
//OneToMany,
//JoinTable,
} from 'typeorm';
//import { Skill } from '../../skills/entities/skill.entity';
//import { Category } from '../../categories/entities/category.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255})
  password!: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: Date;
    
  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender?: Gender;

  @Column({ nullable: true })
  avatar?: string;

  // TODO: раскомментировать после реализации сущностей Skill и Category
  //@OneToMany(() => Skill, (skill) => skill.owner)
  //skills?: Skill[];

  //@ManyToMany(() => Category)
  //@JoinTable({ name: 'user_want_to_learn' })
  //wantToLearn?: Category[];

  //@ManyToMany(() => Skill)
  //@JoinTable({ name: 'user_favorite_skills' })
  //favoriteSkills?: Skill[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string;
}
