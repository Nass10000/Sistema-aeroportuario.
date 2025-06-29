import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StationService } from './station.service';
import { CreateStationDto } from '../dto/create-station.dto';
import { Station } from './station.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Stations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('stations')
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  @Roles(UserRole.ADMIN) // Solo ADMIN puede crear nuevas estaciones (configuración del sistema)
  @ApiOperation({ summary: 'Crear nueva estación' })
  @ApiBody({ type: CreateStationDto, description: 'Datos de la estación a crear' })
  @ApiResponse({ status: 201, description: 'Estación creada exitosamente', type: Station })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Nombre o código ya existe' })
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationService.create(createStationDto);
  }

  @Get()
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todas las estaciones' })
  @ApiResponse({ status: 200, description: 'Lista de estaciones', type: [Station] })
  findAll() {
    return this.stationService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.ADMIN) // Todos pueden ver una estación específica
  @ApiOperation({ summary: 'Obtener estación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la estación', type: 'number' })
  @ApiResponse({ status: 200, description: 'Estación encontrada', type: Station })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stationService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Solo ADMIN puede eliminar estaciones
  @ApiOperation({ summary: 'Eliminar estación' })
  @ApiParam({ name: 'id', description: 'ID de la estación a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Estación eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stationService.remove(id);
  }
}
