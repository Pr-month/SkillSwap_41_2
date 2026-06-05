import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { ApiProperty } from '@nestjs/swagger';
import { SkillStatus } from '../enums/skills.enums';

@Entity('skills')
@Unique(['owner', 'title'])
export class Skill {
  @ApiProperty({ example: 12345 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'React & Redux Toolkit' })
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @ApiProperty({
    example: 'Building scalable SPA with modern state management',
  })
  @Column({ type: 'text' })
  description!: string;

  @ApiProperty({ example: Category })
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @Column('text', { array: true, default: () => "'{}'" })
  images!: string[];

  @ApiProperty({ example: User })
  @ManyToOne(() => User, (user) => user.skills, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner!: User;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ApiProperty({ example: Request })
  @OneToMany(() => Request, (request) => request.offeredSkill)
  offeredInRequests!: Request[];

  @ApiProperty({ example: Request })
  @OneToMany(() => Request, (request) => request.requestedSkill)
  requestedInRequests!: Request[];

  @ApiProperty({ example: SkillStatus })
  @Column({
    type: 'enum',
    enum: SkillStatus,
    default: SkillStatus.ACTIVE,
  })
  status!: SkillStatus;
}
