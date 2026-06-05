import { Exclude } from 'class-transformer';
import { Request } from 'src/requests/entities/request.entity';
import { Skill } from 'src/skills/entities/skill.entity';
import {
  Column,
  CreateDateColumn,
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
import { ApiProperty } from '@nestjs/swagger';
import { OAuthProvider } from 'src/auth/auth.enums';

@Entity('users')
export class User {
  @ApiProperty({ example: 1234567890 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'John Doe' })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Exclude()
  @Column({ nullable: true, type: 'varchar', length: 255 })
  password?: string;

  @ApiProperty({ example: 'About me' })
  @Column({ type: 'text', nullable: true })
  about?: string;

  @ApiProperty({ example: '1990-01-01' })
  @Column({ type: 'date', nullable: true })
  birthdate?: Date;

  @ApiProperty({ example: City })
  @ManyToOne(() => City, { nullable: true })
  city?: City;

  @ApiProperty({ example: Gender })
  @Column({ nullable: true, type: 'enum', enum: Gender })
  gender?: Gender;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @Column({ nullable: true })
  avatar?: string;

  @ApiProperty({ example: Skill })
  @OneToMany(() => Skill, (skill) => skill.owner)
  skills?: Skill[];

  @ApiProperty({ example: Skill })
  @ManyToMany(() => Skill)
  @JoinTable({ name: 'favoriteSkills' })
  favoriteSkills?: Skill[];

  @ApiProperty({ example: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken?: string | null;

  @ApiProperty({ example: Request })
  @OneToMany(() => Request, (request) => request.sender)
  sentRequests!: Request[];

  @ApiProperty({ example: Request })
  @OneToMany(() => Request, (request) => request.receiver)
  receivedRequests!: Request[];

  @ApiProperty({ example: Category })
  @ManyToMany(() => Category, (category) => category.usersWhoWantToLearn)
  @JoinTable({
    name: 'wantToLearn',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  wantToLearn?: Category[];

  @Column({ type: 'enum', enum: OAuthProvider, nullable: true })
  provider?: OAuthProvider | null;

  @CreateDateColumn()
  createdAt!: Date;
}
