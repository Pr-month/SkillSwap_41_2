import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  about?: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: Date;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  avatar?: string;

  @OneToMany(() => Skill, (skill) => skill.owner)
  skills?: Skill[];

  @ManyToMany(() => Category)
  @JoinTable({ name: 'user_want_to_learn' })
  wantToLearn?: Category[];

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'user_favorite_skills' })
  favoriteSkills?: Skill[];

  @Column({ type: 'enum', enum: ['USER', 'ADMIN'], default: 'USER' })
  role!: 'USER' | 'ADMIN';

  @Column({ nullable: true })
  refreshToken?: string;
}