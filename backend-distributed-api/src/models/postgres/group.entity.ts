import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'groups_users_user',
    joinColumns: [{ name: 'groups_id' }], // This entity (Group)
    inverseJoinColumns: [{ name: 'users_id' }], // The related entity (User)
  })
  users: User[];
}
