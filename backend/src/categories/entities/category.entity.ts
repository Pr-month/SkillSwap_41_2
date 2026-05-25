import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  @ManyToMany(() => User, (user) => user.wantToLearn)
  usersWhoWantToLearn?: User[];

  @Column({ nullable: true, type: 'varchar', length: 50 })
  slug?: string;
}
