import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { PunchService } from './punch.service';
import { CreatePunchDto } from '../dto/create-punch.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('punch')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('punch')
export class PunchController {
  constructor(private readonly punchService: PunchService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.SUPERVISOR) // Solo empleados y sus supervisores pueden hacer marcajes
  @ApiOperation({ 
    summary: 'Registrar marcaje de tiempo',
    description: 'Permite a un usuario registrar entrada o salida con validaciones de seguridad'
  })
  @ApiResponse({ status: 201, description: 'Marcaje registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 401, description: 'Token JWT requerido' })
  @ApiResponse({ status: 429, description: 'Límite de solicitudes excedido' })
  async punch(@Request() req, @Body() createPunchDto: CreatePunchDto) {
    return this.punchService.punch(req.user, createPunchDto.type, createPunchDto.comment);
  }

  @Get('me')
  @Roles(UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN) // Solo empleados pueden ver sus propios marcajes
  @ApiOperation({ 
    summary: 'Obtener mis marcajes',
    description: 'Obtiene el historial de marcajes del usuario autenticado'
  })
  @ApiResponse({ status: 200, description: 'Lista de marcajes obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'Token JWT requerido' })
  async myPunches(@Request() req) {
   return this.punchService.findByUser(req.user.id || req.user.userId);


  }
}
