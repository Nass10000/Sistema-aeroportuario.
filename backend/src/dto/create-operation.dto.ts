import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  Min, 
  Max, 
  MaxLength, 
  MinLength,
  IsOptional,
  Matches,
  IsPositive
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum OperationType {
  ARRIVAL = 'ARRIVAL',
  DEPARTURE = 'DEPARTURE',
  TRANSIT = 'TRANSIT',
  MAINTENANCE = 'MAINTENANCE'
}

export enum FlightType {
  DOMESTIC = 'DOMESTIC',
  INTERNATIONAL = 'INTERNATIONAL',
  CARGO = 'CARGO',
  PRIVATE = 'PRIVATE'
}

export enum OperationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED'
}

export class CreateOperationDto {
  @ApiProperty({
    description: 'Nombre descriptivo de la operación',
    example: 'Vuelo AA1234 - Llegada Internacional',
    minLength: 5,
    maxLength: 200
  })
  @IsNotEmpty({ message: 'El nombre de la operación es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(5, { message: 'El nombre debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Número de vuelo (formato estándar de aerolínea)',
    example: 'AA1234',
    minLength: 2,
    maxLength: 10
  })
  @IsNotEmpty({ message: 'El número de vuelo es obligatorio' })
  @IsString({ message: 'El número de vuelo debe ser una cadena de texto' })
  @MinLength(2, { message: 'El número de vuelo debe tener al menos 2 caracteres' })
  @MaxLength(10, { message: 'El número de vuelo no puede exceder 10 caracteres' })
  @Matches(/^[A-Z]{2}[0-9]{1,4}[A-Z]?$/, {
    message: 'Formato de número de vuelo inválido (ej: AA1234, UA567A)'
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  flightNumber: string;

  @ApiProperty({
    description: 'Ciudad/aeropuerto de origen',
    example: 'Miami, FL (MIA)',
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El origen es obligatorio' })
  @IsString({ message: 'El origen debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El origen no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\,\.\-\(\)]+$/, {
    message: 'El origen contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  origin: string;

  @ApiProperty({
    description: 'Ciudad/aeropuerto de destino',
    example: 'Santo Domingo, DR (SDQ)',
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El destino es obligatorio' })
  @IsString({ message: 'El destino debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El destino no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\,\.\-\(\)]+$/, {
    message: 'El destino contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  destination: string;

  @ApiProperty({
    description: 'Fecha y hora programada de la operación (ISO string)',
    example: '2024-12-25T10:30:00.000Z'
  })
  @IsNotEmpty({ message: 'La fecha programada es obligatoria' })
  @IsDateString({}, { message: 'Formato de fecha inválido (ISO 8601)' })
  scheduledTime: string;

  @ApiProperty({
    description: 'Número de pasajeros',
    example: 180,
    minimum: 0,
    maximum: 1000
  })
  @IsNotEmpty({ message: 'El número de pasajeros es obligatorio' })
  @IsNumber({}, { message: 'El número de pasajeros debe ser un número' })
  @Min(0, { message: 'El número de pasajeros no puede ser negativo' })
  @Max(1000, { message: 'El número de pasajeros no puede exceder 1000' })
  passengerCount: number;

  @ApiProperty({
    description: 'Tipo de operación',
    enum: OperationType,
    example: OperationType.ARRIVAL
  })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio' })
  @IsEnum(OperationType, { message: 'Tipo de operación inválido' })
  type: OperationType;

  @ApiProperty({
    description: 'Tipo de vuelo',
    enum: FlightType,
    example: FlightType.INTERNATIONAL,
    required: false
  })
  @IsOptional()
  @IsEnum(FlightType, { message: 'Tipo de vuelo inválido' })
  flightType?: FlightType;

  @ApiProperty({
    description: 'Estado de la operación',
    enum: OperationStatus,
    example: OperationStatus.SCHEDULED,
    required: false
  })
  @IsOptional()
  @IsEnum(OperationStatus, { message: 'Estado de operación inválido' })
  status?: OperationStatus;

  @ApiProperty({
    description: 'ID de la estación donde se realizará la operación',
    example: 1
  })
  @IsNotEmpty({ message: 'El ID de la estación es obligatorio' })
  @IsNumber({}, { message: 'El ID de la estación debe ser un número' })
  @IsPositive({ message: 'El ID de la estación debe ser un número positivo' })
  stationId: number;
}
