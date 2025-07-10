import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignStationDto {
  @ApiProperty({ description: 'ID de la estación a asignar', example: 1 })
  @IsNumber({}, { message: 'El ID de la estación debe ser un número' })
  @IsNotEmpty({ message: 'El ID de la estación es requerido' })
  stationId: number;
}
