import { 
  IsNotEmpty, 
  IsEnum, 
  IsString, 
  IsOptional,
  MaxLength,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PunchType {
  IN = 'in',
  OUT = 'out'
}

export class CreatePunchDto {
  @ApiProperty({
    description: 'Tipo de marcaje de tiempo',
    enum: PunchType,
    example: PunchType.IN
  })
  @IsNotEmpty({ message: 'El tipo de marcaje es obligatorio' })
  @IsEnum(PunchType, { message: 'Tipo de marcaje inválido' })
  type: PunchType;

  @ApiProperty({
    description: 'Comentario opcional sobre el marcaje',
    example: 'Llegada temprana por operación especial',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El comentario no puede exceder 255 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ0-9\s\.\,\;\:\-\(\)\[\]]+$/, {
    message: 'El comentario contiene caracteres no válidos'
  })
  @Transform(({ value }) => value?.trim())
  comment?: string;
}
