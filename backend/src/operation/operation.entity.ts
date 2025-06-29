import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Station } from '../station/station.entity';
import { Assignment } from '../assignment/assignment.entity';

export enum OperationType {
  ARRIVAL = 'ARRIVAL',
  DEPARTURE = 'DEPARTURE',
}

export enum OperationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FlightType {
  DOMESTIC = 'DOMESTIC',
  INTERNATIONAL = 'INTERNATIONAL',
}

@Entity()
export class Operation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  flightNumber: string;

  @Column()
  origin: string;

  @Column()
  destination: string;

  @Column('timestamp')
  scheduledTime: Date;

  @Column('int')
  passengerCount: number;

  @Column({ type: 'enum', enum: OperationType, default: OperationType.ARRIVAL })
  type: OperationType;

  @Column({ type: 'enum', enum: OperationStatus, default: OperationStatus.SCHEDULED })
  status: OperationStatus;

  @Column({ type: 'enum', enum: FlightType, default: FlightType.DOMESTIC })
  flightType: FlightType;

  @Column('float', { nullable: true })
  estimatedDuration: number; // Duración estimada en horas

  @Column('int', { nullable: true })
  minimumStaffRequired: number; // Personal mínimo requerido

  @ManyToOne(() => Station, station => station.operations)
  station: Station;

  @OneToMany(() => Assignment, assignment => assignment.operation)
  assignments: Assignment[];
}
