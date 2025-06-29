import { 
  IsInt, 
  IsNotEmpty, 
  IsString, 
  IsDateString, 
  IsNumber, 
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
  IsPositive,
  IsOptional,
  IsEnum
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AssignmentFunction {
  SUPERVISOR_EQUIPAJE = 'SUPERVISOR_EQUIPAJE',
  OPERADOR_EQUIPAJE = 'OPERADOR_EQUIPAJE',
  SUPERVISOR_RAMPA = 'SUPERVISOR_RAMPA',
  OPERADOR_RAMPA = 'OPERADOR_RAMPA',
  SUPERVISOR_COMBUSTIBLE = 'SUPERVISOR_COMBUSTIBLE',
  OPERADOR_COMBUSTIBLE = 'OPERADOR_COMBUSTIBLE',
  SUPERVISOR_CARGA = 'SUPERVISOR_CARGA',
  OPERADOR_CARGA = 'OPERADOR_CARGA',
  SUPERVISOR_LIMPIEZA = 'SUPERVISOR_LIMPIEZA',
  OPERADOR_LIMPIEZA = 'OPERADOR_LIMPIEZA',
  SUPERVISOR_SEGURIDAD = 'SUPERVISOR_SEGURIDAD',
  AGENTE_SEGURIDAD = 'AGENTE_SEGURIDAD',
  TECNICO_MANTENIMIENTO = 'TECNICO_MANTENIMIENTO',
  COORDINADOR_OPERACIONES = 'COORDINADOR_OPERACIONES'
}

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'ID de la operación a asignar',
    example: 1
  })
  @IsNotEmpty({ message: 'El ID de la operación es obligatorio' })
  @IsNumber({}, { message: 'El ID de la operación debe ser un número' })
  @IsPositive({ message: 'El ID de la operación debe ser positivo' })
  operationId: number;

  @ApiProperty({
    description: 'ID del usuario a asignar',
    example: 1
  })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @IsPositive({ message: 'El ID del usuario debe ser positivo' })
  userId: number;

  @ApiProperty({
    description: 'Función específica en la asignación',
    enum: AssignmentFunction,
    example: AssignmentFunction.SUPERVISOR_EQUIPAJE
  })
  @IsNotEmpty({ message: 'La función es obligatoria' })
  @IsEnum(AssignmentFunction, { message: 'Función de asignación inválida' })
  function: AssignmentFunction;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la asignación (ISO string)',
    example: '2024-12-25T08:00:00.000Z'
  })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsDateString({}, { message: 'Formato de fecha de inicio inválido (ISO 8601)' })
  startTime: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la asignación (ISO string)',
    example: '2024-12-25T16:00:00.000Z'
  })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsDateString({}, { message: 'Formato de fecha de fin inválido (ISO 8601)' })
  endTime: string;

  @ApiProperty({
    description: 'Costo por hora de la asignación en USD',
    example: 25.50,
    minimum: 0,
    maximum: 1000
  })
  @IsNotEmpty({ message: 'El costo es obligatorio' })
  @IsNumber({}, { message: 'El costo debe ser un número' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  @Max(1000, { message: 'El costo no puede exceder $1000/hora' })
  cost: number;

  @ApiProperty({
    description: 'Notas adicionales sobre la asignación',
    example: 'Requiere certificación especial para manejo de equipos',
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
}
