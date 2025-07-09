import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OperationService } from './operation.service';
import { CreateOperationDto } from '../dto/create-operation.dto';
import { Operation } from './operation.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Operations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('operations')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN) // Managers, supervisores y admins pueden crear operaciones
  @ApiOperation({ summary: 'Crear nueva operación' })
  @ApiBody({ type: CreateOperationDto, description: 'Datos de la operación a crear' })
  @ApiResponse({ status: 201, description: 'Operación creada exitosamente', type: Operation })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Estación no encontrada' })
  create(@Body() createOperationDto: CreateOperationDto) {
    return this.operationService.create(createOperationDto);
  }

  @Get()
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.ADMIN) // Todos pueden ver operaciones
  @ApiOperation({ summary: 'Obtener todas las operaciones' })
  @ApiResponse({ status: 200, description: 'Lista de operaciones', type: [Operation] })
  findAll() {
    return this.operationService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.ADMIN) // Todos pueden ver una operación específica
  @ApiOperation({ summary: 'Obtener operación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la operación', type: 'number' })
  @ApiResponse({ status: 200, description: 'Operación encontrada', type: Operation })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Solo ADMIN y MANAGER pueden eliminar operaciones
  @ApiOperation({ summary: 'Eliminar operación' })
  @ApiParam({ name: 'id', description: 'ID de la operación a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Operación eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar operaciones' })
  @ApiResponse({ status: 404, description: 'Operación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.operationService.remove(id);
  }
}
