import { 
  IsEmail, 
  IsNotEmpty, 
  IsEnum, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsString,
  IsOptional,
  ValidateIf,
  IsPhoneNumber,
  IsDateString,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, EmployeeCategory, ShiftType } from '../common/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Nombre completo del usuario',
    example: 'Juan Carlos Pérez',
    minLength: 2,
    maxLength: 100
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\.\-\']+$/, { 
    message: 'El nombre solo puede contener letras, espacios, puntos, guiones y apostrofes' 
  })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ 
    description: 'Email corporativo del usuario',
    example: 'juan.perez@aeo.com',
    format: 'email'
  })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Formato de email inválido'
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ 
    description: 'Contraseña segura (mín. 8 caracteres, mayúscula, minúscula, número y carácter especial)',
    example: 'MiPassword123!',
    minLength: 8,
    maxLength: 128
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)'
  })
  password: string;

  @ApiProperty({ 
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.EMPLOYEE
  })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role: UserRole;

  @ApiProperty({ 
    description: 'Número de teléfono (opcional)',
    example: '+1-809-555-1234',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Formato de teléfono inválido (ej: +1-809-555-1234)'
  })
  phone?: string;

  @ApiProperty({ 
    description: 'Categoría del empleado (requerido para role employee)',
    enum: EmployeeCategory,
    example: EmployeeCategory.BAGGAGE,
    required: false
  })
  @ValidateIf(o => o.role === UserRole.EMPLOYEE)
  @IsEnum(EmployeeCategory, { message: 'Categoría de empleado inválida' })
  category?: EmployeeCategory;

  @ApiProperty({ 
    description: 'Turno preferido del empleado',
    enum: ShiftType,
    example: ShiftType.MORNING,
    required: false
  })
  @IsOptional()
  @IsEnum(ShiftType, { message: 'Tipo de turno inválido' })
  preferredShift?: ShiftType;

  @ApiProperty({ 
    description: 'Salario por hora en USD',
    example: 15.50,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El salario debe ser un número' })
  @Min(0, { message: 'El salario no puede ser negativo' })
  @Max(1000, { message: 'El salario no puede exceder $1000/hora' })
  hourlyRate?: number;

  @ApiProperty({ 
    description: 'Certificaciones del empleado',
    example: ['airport_operations', 'security_clearance'],
    required: false
  })
  @IsOptional()
  @IsString({ each: true, message: 'Cada certificación debe ser una cadena de texto' })
  @MaxLength(50, { each: true, message: 'Cada certificación no puede exceder 50 caracteres' })
  certifications?: string[];

  @ApiProperty({ 
    description: 'ID de la estación donde trabaja el empleado',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID de la estación debe ser un número' })
  @Min(1, { message: 'El ID de la estación debe ser mayor a 0' })
  stationId?: number;
}
