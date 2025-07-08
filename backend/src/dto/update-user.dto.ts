import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsPhoneNumber, 
  IsDateString, 
  IsNumber, 
  Min, 
  Max,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  IsBoolean,
  IsEmail
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeCategory, ShiftType } from '../user/user.entity';
import { UserRole } from '../common/enums/roles.enum';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Carlos Pérez González',
    minLength: 2,
    maxLength: 100,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\.\-\']+$/, { 
    message: 'El nombre solo puede contener letras, espacios, puntos, guiones y apostrofes' 
  })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({
    description: 'URL de la foto del perfil',
    example: 'https://images.example.com/profile/user123.jpg',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La foto debe ser una cadena de texto' })
  @IsUrl({}, { message: 'La foto debe ser una URL válida' })
  @MaxLength(500, { message: 'La URL de la foto no puede exceder 500 caracteres' })
  photo?: string;

  @ApiProperty({
    description: 'Número de teléfono',
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
    description: 'Dirección residencial',
    example: 'Calle Principal #123, Santo Domingo, República Dominicana',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\,\#\-\(\)]+$/, {
    message: 'La dirección contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento (ISO string)',
    example: '1990-05-15',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Formato de fecha de nacimiento inválido (ISO 8601)' })
  birthDate?: string;

  @ApiProperty({
    description: 'Nombre del contacto de emergencia',
    example: 'María Pérez',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'El contacto de emergencia debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El contacto de emergencia no puede exceder 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\.\-\']+$/, {
    message: 'El contacto de emergencia solo puede contener letras, espacios, puntos, guiones y apostrofes'
  })
  @Transform(({ value }) => value?.trim())
  emergencyContact?: string;

  @ApiProperty({
    description: 'Teléfono del contacto de emergencia',
    example: '+1-809-555-9876',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'El teléfono de emergencia debe ser una cadena de texto' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Formato de teléfono de emergencia inválido (ej: +1-809-555-1234)'
  })
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Certificaciones del empleado',
    example: ['airport_operations', 'security_clearance', 'hazmat_handling'],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Las certificaciones deben ser un array' })
  @IsString({ each: true, message: 'Cada certificación debe ser una cadena de texto' })
  @MaxLength(50, { each: true, message: 'Cada certificación no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z_]+$/, { each: true, message: 'Las certificaciones solo pueden contener letras y guiones bajos' })
  certifications?: string[];

  @ApiProperty({
    description: 'Habilidades especiales del empleado',
    example: ['forklift_operation', 'multilingual', 'leadership'],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Las habilidades deben ser un array' })
  @IsString({ each: true, message: 'Cada habilidad debe ser una cadena de texto' })
  @MaxLength(50, { each: true, message: 'Cada habilidad no puede exceder 50 caracteres' })
  @Matches(/^[a-zA-Z_]+$/, { each: true, message: 'Las habilidades solo pueden contener letras y guiones bajos' })
  skills?: string[];

  @ApiProperty({
    description: 'Categorías en las que puede trabajar el empleado',
    enum: EmployeeCategory,
    isArray: true,
    example: [EmployeeCategory.BAGGAGE, EmployeeCategory.RAMP],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Las categorías deben ser un array' })
  @IsEnum(EmployeeCategory, { each: true, message: 'Categoría de empleado inválida' })
  categories?: EmployeeCategory[];

  @ApiProperty({
    description: 'Categoría única (será convertida a categories array)',
    enum: EmployeeCategory,
    example: EmployeeCategory.BAGGAGE,
    required: false
  })
  @IsOptional()
  @IsEnum(EmployeeCategory, { message: 'Categoría de empleado inválida' })
  category?: EmployeeCategory;

  @ApiProperty({
    description: 'Turnos disponibles para el empleado',
    enum: ShiftType,
    isArray: true,
    example: [ShiftType.MORNING, ShiftType.AFTERNOON],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Los turnos disponibles deben ser un array' })
  @IsEnum(ShiftType, { each: true, message: 'Tipo de turno inválido' })
  availableShifts?: ShiftType[];

  @ApiProperty({
    description: 'Máximo de horas semanales',
    example: 40,
    minimum: 1,
    maximum: 60,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las horas semanales máximas deben ser un número' })
  @Min(1, { message: 'Las horas semanales máximas deben ser al menos 1' })
  @Max(60, { message: 'Las horas semanales máximas no pueden exceder 60' })
  maxWeeklyHours?: number;

  @ApiProperty({
    description: 'Máximo de horas diarias',
    example: 8,
    minimum: 1,
    maximum: 16,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las horas diarias máximas deben ser un número' })
  @Min(1, { message: 'Las horas diarias máximas deben ser al menos 1' })
  @Max(16, { message: 'Las horas diarias máximas no pueden exceder 16' })
  maxDailyHours?: number;

  @ApiProperty({
    description: 'Si el empleado está disponible para asignaciones',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'La disponibilidad debe ser true o false' })
  isAvailable?: boolean;

  @ApiProperty({ 
    description: 'ID de la estación donde trabaja el empleado',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID de la estación debe ser un número' })
  @Min(1, { message: 'El ID de la estación debe ser mayor a 0' })
  stationId?: number;

  @ApiProperty({
    description: 'Email corporativo del usuario',
    example: 'juan.perez@aeo.com',
    format: 'email',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Formato de email inválido'
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiProperty({
    description: 'Contraseña segura (mín. 8 caracteres, mayúscula, minúscula, número y carácter especial)',
    example: 'MiPassword123!',
    minLength: 8,
    maxLength: 128,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)' 
  })
  password?: string;

  @ApiProperty({ 
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.EMPLOYEE,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role?: UserRole;
}
