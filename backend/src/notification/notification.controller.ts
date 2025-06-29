import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/roles.enum';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('unread') unreadOnly: string = 'false'
  ) {
    return this.notificationService.findByUser(
      req.user.userId,
      unreadOnly === 'true'
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva notificación (solo supervisores)' })
  @ApiResponse({ status: 201, description: 'Notificación creada exitosamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo supervisores' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async createNotification(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    return this.notificationService.createFromDto(createNotificationDto, req.user);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(+id, req.user.userId);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }
}
