import { 
  IsNotEmpty, 
  IsEmail, 
  IsString,
  MaxLength,
  MinLength,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@aeo.com',
    format: 'email'
  })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiPassword123!',
    minLength: 1,
    maxLength: 128
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(1, { message: 'La contraseña no puede estar vacía' })
  @MaxLength(128, { message: 'La contraseña no puede exceder 128 caracteres' })
  password: string;
}
