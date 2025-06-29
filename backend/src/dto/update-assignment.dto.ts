import { 
  IsOptional, 
  IsEnum, 
  IsString, 
  IsDateString, 
  IsNumber,
  MaxLength,
  Matches,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '../assignment/assignment.entity';
import { AssignmentFunction } from './create-assignment.dto';

export class UpdateAssignmentDto {
  @ApiProperty({
    description: 'Función específica en la asignación',
    enum: AssignmentFunction,
    example: AssignmentFunction.SUPERVISOR_EQUIPAJE,
    required: false
  })
  @IsOptional()
  @IsEnum(AssignmentFunction, { message: 'Función de asignación inválida' })
  function?: AssignmentFunction;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la asignación (ISO string)',
    example: '2024-12-25T08:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha de inicio inválido (ISO 8601)' })
  startTime?: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la asignación (ISO string)',
    example: '2024-12-25T16:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha de fin inválido (ISO 8601)' })
  endTime?: string;

  @ApiProperty({
    description: 'Costo por hora de la asignación en USD',
    example: 25.50,
    minimum: 0,
    maximum: 1000,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El costo debe ser un número' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  @Max(1000, { message: 'El costo no puede exceder $1000/hora' })
  cost?: number;

  @ApiProperty({
    description: 'Estado actual de la asignación',
    enum: AssignmentStatus,
    example: AssignmentStatus.CONFIRMED,
    required: false
  })
  @IsOptional()
  @IsEnum(AssignmentStatus, { message: 'Estado de asignación inválido' })
  status?: AssignmentStatus;

  @ApiProperty({
    description: 'Notas adicionales sobre la asignación',
    example: 'Asignación completada sin incidentes',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\,\;\:\-\(\)\[\]]+$/, {
    message: 'Las notas contienen caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  notes?: string;

  @ApiProperty({
    description: 'Hora real de inicio (ISO string)',
    example: '2024-12-25T08:15:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha de inicio real inválido (ISO 8601)' })
  actualStartTime?: string;

  @ApiProperty({
    description: 'Hora real de fin (ISO string)',
    example: '2024-12-25T16:30:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha de fin real inválido (ISO 8601)' })
  actualEndTime?: string;

  @ApiProperty({
    description: 'Horas extra trabajadas',
    example: 2.5,
    minimum: 0,
    maximum: 16,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las horas extra deben ser un número' })
  @Min(0, { message: 'Las horas extra no pueden ser negativas' })
  @Max(16, { message: 'Las horas extra no pueden exceder 16 horas' })
  overtimeHours?: number;
}
