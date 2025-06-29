import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  MaxLength, 
  MinLength,
  IsOptional,
  IsArray,
  Matches,
  IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { StationType } from '../station/station.entity';

export class CreateStationDto {
  @ApiProperty({
    description: 'Nombre único de la estación',
    example: 'Terminal Principal Santo Domingo',
    minLength: 3,
    maxLength: 200
  })
  @IsNotEmpty({ message: 'El nombre de la estación es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\-\(\)]+$/, {
    message: 'El nombre solo puede contener letras, números, espacios, puntos, guiones y paréntesis'
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Ubicación geográfica de la estación',
    example: 'Santo Domingo, República Dominicana',
    maxLength: 255
  })
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  @IsString({ message: 'La ubicación debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La ubicación no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\,\.\-\(\)]+$/, {
    message: 'La ubicación contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  location: string;

  @ApiProperty({
    description: 'Tipo de estación',
    enum: StationType,
    example: StationType.TERMINAL
  })
  @IsNotEmpty({ message: 'El tipo de estación es obligatorio' })
  @IsEnum(StationType, { message: 'Tipo de estación inválido' })
  type: StationType;

  @ApiProperty({
    description: 'Número mínimo de personal requerido',
    example: 5,
    minimum: 1,
    maximum: 100
  })
  @IsNotEmpty({ message: 'El personal mínimo es obligatorio' })
  @IsNumber({}, { message: 'El personal mínimo debe ser un número' })
  @Min(1, { message: 'El personal mínimo debe ser al menos 1' })
  @Max(100, { message: 'El personal mínimo no puede exceder 100' })
  minimumStaff: number;

  @ApiProperty({
    description: 'Número máximo de personal permitido',
    example: 20,
    minimum: 1,
    maximum: 500
  })
  @IsNotEmpty({ message: 'El personal máximo es obligatorio' })
  @IsNumber({}, { message: 'El personal máximo debe ser un número' })
  @Min(1, { message: 'El personal máximo debe ser al menos 1' })
  @Max(500, { message: 'El personal máximo no puede exceder 500' })
  maximumStaff: number;

  @ApiProperty({
    description: 'Certificaciones requeridas para trabajar en esta estación',
    example: ['airport_operations', 'security_clearance'],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Las certificaciones deben ser un array' })
  @IsString({ each: true, message: 'Cada certificación debe ser una cadena de texto' })
  @MaxLength(50, { each: true, message: 'Cada certificación no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z_]+$/, { each: true, message: 'Las certificaciones solo pueden contener letras y guiones bajos' })
  requiredCertifications?: string[];

  @ApiProperty({
    description: 'Código único de la estación (opcional)',
    example: 'SDQ-T1',
    required: false,
    maxLength: 20
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres' })
  @Matches(/^[A-Z0-9\-]+$/, {
    message: 'El código solo puede contener letras mayúsculas, números y guiones'
  })
  code?: string;

  @ApiProperty({
    description: 'Si la estación está activa',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser true o false' })
  isActive?: boolean;
}
