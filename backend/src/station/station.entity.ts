import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';
import { Operation } from '../operation/operation.entity';

export enum StationType {
  TERMINAL = 'TERMINAL',
  PLATFORM = 'PLATFORM',
  CARGO = 'CARGO',
  MAINTENANCE = 'MAINTENANCE',
  FUEL = 'FUEL',
  SECURITY = 'SECURITY',
}

@Entity()
export class Station {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: StationType })
  type: StationType;

  @Column({ nullable: true })
  description: string;

  @Column('int', { default: 1 })
  minimumStaff: number; // Personal mínimo requerido

  @Column('int', { default: 10 })
  maximumStaff: number; // Personal máximo

  @Column({ default: true })
  isActive: boolean;

  @Column('text', { array: true, default: '{}' })
  requiredCertifications: string[]; // Certificaciones requeridas

  @Column({ nullable: true, unique: true })
  code: string; // Código único de la estación

  @ManyToOne(() => User, user => user.managedStations, { nullable: true })
  manager: User; // Gerente de la estación

  @OneToMany(() => Operation, operation => operation.station)
  operations: Operation[];
}
