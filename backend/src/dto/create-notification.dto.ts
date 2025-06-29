import { 
  IsNotEmpty, 
  IsEnum, 
  IsString, 
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  IsNumber,
  IsPositive,
  IsObject,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '../common/enums/roles.enum';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nueva asignación disponible',
    minLength: 3,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\,\!\?\:\-\(\)]+$/, {
    message: 'El título contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    description: 'Mensaje detallado de la notificación',
    example: 'Se ha asignado una nueva operación para el vuelo AA1234 en Terminal 1',
    minLength: 10,
    maxLength: 1000
  })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'El mensaje no puede exceder 1000 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\,\!\?\;\:\-\(\)\[\]\n\r]+$/, {
    message: 'El mensaje contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  message: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.ASSIGNMENT
  })
  @IsNotEmpty({ message: 'El tipo de notificación es obligatorio' })
  @IsEnum(NotificationType, { message: 'Tipo de notificación inválido' })
  type: NotificationType;

  @ApiProperty({
    description: 'Prioridad de la notificación',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
    required: false
  })
  @IsOptional()
  @IsEnum(NotificationPriority, { message: 'Prioridad de notificación inválida' })
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'ID del usuario destinatario (null para broadcast)',
    example: 5,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del destinatario debe ser un número' })
  @IsPositive({ message: 'El ID del destinatario debe ser positivo' })
  recipientId?: number;

  @ApiProperty({
    description: 'ID del usuario que envía la notificación',
    example: 1
  })
  @IsNotEmpty({ message: 'El ID del remitente es obligatorio' })
  @IsNumber({}, { message: 'El ID del remitente debe ser un número' })
  @IsPositive({ message: 'El ID del remitente debe ser positivo' })
  senderId: number;

  @ApiProperty({
    description: 'Datos adicionales relacionados con la notificación',
    example: { operationId: 123, stationId: 5, priority: "HIGH" },
    required: false
  })
  @IsOptional()
  @IsObject({ message: 'Los datos adicionales deben ser un objeto JSON válido' })
  data?: Record<string, any>;
}
