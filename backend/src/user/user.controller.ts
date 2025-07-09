import { Controller, Get, Post, Put, Body, Param, Delete, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { AssignStationDto } from '../dto/assign-station.dto';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN) // Solo MANAGER puede crear usuarios en su estación y ADMIN para sistema
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiBody({ type: CreateUserDto, description: 'Datos del usuario a crear' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN) // Todos los roles de gestión pueden ver usuarios
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: [User] })
  findAll(@Request() req) {
    return this.userService.findAll(req.user);
  }

  @Get(':id')
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.EMPLOYEE, UserRole.ADMIN) // Todos pueden ver información de usuarios
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Solo ADMIN puede eliminar usuarios (por seguridad del sistema)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Post('init-test-data')
  @Roles(UserRole.ADMIN) // Solo ADMIN puede inicializar datos de prueba
  @ApiOperation({ summary: 'Inicializar datos de prueba (solo para desarrollo)' })
  @ApiResponse({ status: 201, description: 'Datos de prueba inicializados' })
  async initTestData() {
    await this.userService.initializeTestUsers();
    return { 
      message: 'Datos de prueba inicializados correctamente',
      testUsers: [
        'admin@aereo.com / admin123',
        'manager@aereo.com / manager123', 
        'employee@aereo.com / employee123'
      ]
    };
  }

  @Post(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiBody({ type: CreateUserDto, description: 'Datos del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: User })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: any, @Request() req) {
    try {
      console.log('🔵 UserController: actualizando usuario', id, 'con datos:', updateUserDto);
      console.log('🔵 UserController: usuario actual:', req.user);
      return await this.userService.update(id, updateUserDto, req.user);
    } catch (error) {
      console.error('❌ UserController: error en update:', error);
      throw error;
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar usuario (método PUT)' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiBody({ type: CreateUserDto, description: 'Datos del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: User })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updatePut(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: any, @Request() req) {
    try {
      console.log('🔵 UserController PUT: actualizando usuario', id, 'con datos:', updateUserDto);
      console.log('🔵 UserController PUT: usuario actual:', req.user);
      return await this.userService.update(id, updateUserDto, req.user);
    } catch (error) {
      console.error('❌ UserController PUT: error en update:', error);
      throw error;
    }
  }

  // Endpoint temporal para testing sin autenticación
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint sin autenticación' })
  async test() {
    return { message: 'Servidor funcionando correctamente', timestamp: new Date() };
  }

  // Nuevos endpoints para gestión de estaciones
  @Post(':id/assign-station')
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Solo ADMIN puede asignar cualquier estación, MANAGER solo en su área
  @ApiOperation({ summary: 'Asignar estación a usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiBody({ type: AssignStationDto, description: 'Datos de asignación de estación' })
  @ApiResponse({ status: 200, description: 'Estación asignada exitosamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para asignar esta estación' })
  @ApiResponse({ status: 404, description: 'Usuario o estación no encontrada' })
  async assignStation(@Param('id', ParseIntPipe) id: number, @Body() assignStationDto: AssignStationDto, @Request() req) {
    return this.userService.assignStation(id, assignStationDto.stationId, req.user);
  }

  @Delete(':id/station')
  @Roles(UserRole.ADMIN, UserRole.MANAGER) // Solo ADMIN y MANAGER pueden remover asignaciones
  @ApiOperation({ summary: 'Remover asignación de estación' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiResponse({ status: 200, description: 'Asignación de estación removida exitosamente', type: User })
  @ApiResponse({ status: 403, description: 'No tienes permisos para remover esta asignación' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async removeStationAssignment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.userService.removeStationAssignment(id, req.user);
  }
}
// Endpoint adicional fuera de la clase con guards para testing
@Controller('auth-test')
@ApiTags('Auth Test')
export class AuthTestController {
  @Get()
  @ApiOperation({ summary: 'Test endpoint sin guards' })
  testWithoutAuth() {
    return { message: 'Endpoint sin autenticación funcionando', timestamp: new Date() };
  }
}
