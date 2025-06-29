import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Assignment } from '../assignment/assignment.entity';
import { Station } from '../station/station.entity';
import { UserRole, EmployeeCategory, ShiftType } from '../common/enums/roles.enum';

// Re-export enums for backward compatibility
export { UserRole, EmployeeCategory, ShiftType };

@Entity('users')
export class User {
  @ApiProperty({ description: 'ID único del usuario', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan Pérez' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Email del usuario (único)', example: 'juan@aeo.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'Contraseña encriptada', example: 'hashedpassword123' })
  @Column()
  password: string;

  @ApiProperty({ 
    description: 'Rol del usuario en el sistema', 
    enum: UserRole, 
    example: UserRole.EMPLOYEE 
  })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  // Campos básicos del perfil
  @Column({ nullable: true })
  photo: string; // URL de la foto

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column('date', { nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ nullable: true })
  emergencyPhone: string;

  // Campos requeridos por scheduling service
  @Column('text', { array: true, default: [], nullable: true })
  certifications: string[]; // Certificaciones del empleado

  @Column('text', { array: true, default: [], nullable: true })
  skills: string[]; // Habilidades especiales

  @Column({ type: 'enum', enum: EmployeeCategory, array: true, default: [], nullable: true })
  categories: EmployeeCategory[]; // Categorías de trabajo

  @Column('text', { array: true, default: [], nullable: true })
  availableShifts: string[]; // Turnos disponibles

  @Column('float', { default: 40, nullable: true })
  maxWeeklyHours: number; // Horas máximas semanales

  @Column('float', { default: 8, nullable: true })
  maxDailyHours: number; // Horas máximas diarias

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isAvailable: boolean; // Disponibilidad actual

  // Campos para la jerarquía organizacional
  @Column({ nullable: true })
  stationId: number; // ID de la estación donde trabaja

  @Column({ nullable: true })
  supervisorId: number; // ID del supervisor directo

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Assignment, assignment => assignment.user)
  assignments: Assignment[];

  @OneToMany(() => Station, station => station.manager)
  managedStations: Station[];
}
