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
  UpdateDateColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  // Временно закомментировано
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column('text', { array: true, default: () => "'{}'" })
  images!: string[];

  @ManyToOne(() => User, (user) => user.skills, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Request, (request) => request.offeredSkill)
  offeredInRequests: Request[];

  @OneToMany(() => Request, (request) => request.requestedSkill)
  requestedInRequests: Request[];
}
