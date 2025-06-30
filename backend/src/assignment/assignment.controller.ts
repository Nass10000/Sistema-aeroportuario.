import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { Assignment } from './assignment.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva asignación' })
  @ApiBody({ type: CreateAssignmentDto, description: 'Datos de la asignación a crear' })
  @ApiResponse({ status: 201, description: 'Asignación creada exitosamente', type: Assignment })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 404, description: 'Usuario u operación no encontrados' })
  @ApiResponse({ status: 409, description: 'Conflicto de horarios' })
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentService.create(createAssignmentDto);
  }

  @Get()
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN) // Quitado UserRole.EMPLOYEE
  @ApiOperation({ summary: 'Obtener todas las asignaciones' })
  @ApiResponse({ status: 200, description: 'Lista de asignaciones', type: [Assignment] })
  async findAll() {
    const assignments = await this.assignmentService.findAll();
    console.log('👀 assignments con relaciones:', JSON.stringify(assignments, null, 2));
    return assignments.map(assignment => ({
      ...assignment,
      userId: assignment.user?.id,
      operationId: assignment.operation?.id,
    }));
  }

  @Get(':id')
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN) // Quitado UserRole.EMPLOYEE
  @ApiOperation({ summary: 'Obtener asignación por ID' })
  @ApiParam({ name: 'id', description: 'ID de la asignación', type: 'number' })
  @ApiResponse({ status: 200, description: 'Asignación encontrada', type: Assignment })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar asignación' })
  @ApiParam({ name: 'id', description: 'ID de la asignación a actualizar', type: 'number' })
  @ApiBody({ type: UpdateAssignmentDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Asignación actualizada exitosamente', type: Assignment })
  @ApiResponse({ status: 400, description: 'ID o datos inválidos' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar asignación' })
  @ApiParam({ name: 'id', description: 'ID de la asignación a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Asignación eliminada exitosamente' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.remove(id);
  }
}
