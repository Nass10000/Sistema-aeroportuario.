import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum PunchType {
  IN = 'in',
  OUT = 'out',
}

@Entity('punches')
export class Punch {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'enum', enum: PunchType })
  type: PunchType;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  comment?: string;

  
}
