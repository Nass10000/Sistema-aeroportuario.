import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Operation } from '../operation/operation.entity';
import { User } from '../user/user.entity';

export enum AssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABSENT = 'ABSENT',
  CANCELLED = 'CANCELLED',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

@Column({ nullable: true }) // ← AGREGA EXPLÍCITAMENTE
  operationId: number;


  @ManyToOne(() => Operation, (operation) => operation.assignments)
  operation: Operation;

    @Column({ nullable: true }) // ← AGREGA EXPLÍCITAMENTE
  userId: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  function: string; // Función específica (ej: "Supervisor de Equipaje")

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp')
  endTime: Date;

  @Column('float')
  cost: number; // Costo por hora o total

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.SCHEDULED })
  status: AssignmentStatus;

  @Column({ nullable: true })
  notes: string; // Notas adicionales

  @Column('timestamp', { nullable: true })
  actualStartTime: Date; // Hora real de inicio

  @Column('timestamp', { nullable: true })
  actualEndTime: Date; // Hora real de fin

  @Column('float', { nullable: true })
  overtimeHours: number; // Horas extra

  @Column({ default: false })
  isReplacement: boolean; // Si es un reemplazo

  @ManyToOne(() => User, { nullable: true })
  replacementFor: User; // A quién está reemplazando

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
