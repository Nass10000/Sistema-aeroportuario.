import { Controller, Post, Get, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('scheduling')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('validate-assignment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN)
  async validateAssignment(@Body() body: {
    userId: number;
    operationId: number;
    startTime: string;
    endTime: string;
  }) {
    try {
      console.log('🔵 SchedulingController: validando asignación:', body);
      return await this.schedulingService.validateAssignment(
        body.userId,
        body.operationId,
        new Date(body.startTime),
        new Date(body.endTime)
      );
    } catch (error) {
      console.error('❌ SchedulingController: error en validateAssignment:', error);
      throw error;
    }
  }

  @Post('check-availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT, UserRole.ADMIN)
  async checkStaffAvailability(@Body() body: {
    userIds: number[];
    startTime: string;
    endTime: string;
  }) {
    return this.schedulingService.checkStaffAvailability(
      body.userIds,
      new Date(body.startTime),
      new Date(body.endTime)
    );
  }

  @Get('debug/user-info')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN, UserRole.PRESIDENT)
  async debugUserInfo(@Request() req) {
    return {
      user: req.user,
      timestamp: new Date(),
      hasPermission: {
        scheduling: [UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN].includes(req.user.role),
        availableStaff: [UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN].includes(req.user.role)
      }
    };
  }

  @Get('available-staff/:operationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN)
  async findAvailableStaff(
    @Param('operationId') operationId: string,
    @Request() req,
    @Query('skills') skills?: string,
    @Query('excludeIds') excludeIds?: string
  ) {
    try {
      console.log('🔵 SchedulingController: usuario actual:', req.user);
      console.log('🔵 SchedulingController: buscando personal disponible para operación', operationId);
      
      const requiredSkills = skills ? skills.split(',') : [];
      const excludeUserIds = excludeIds ? excludeIds.split(',').map(id => +id) : [];
      
      return await this.schedulingService.findAvailableStaff(
        +operationId,
        requiredSkills,
        excludeUserIds
      );
    } catch (error) {
      console.error('❌ SchedulingController: error en findAvailableStaff:', error);
      throw error;
    }
  }

  @Post('create-replacement')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async createReplacement(
    @Body() body: {
      originalAssignmentId: number;
      replacementUserId: number;
      reason: string;
    },
    @Request() req
  ) {
    return this.schedulingService.createReplacement(
      body.originalAssignmentId,
      body.replacementUserId,
      body.reason,
      req.user
    );
  }

  @Get('optimal-staffing/:operationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async getOptimalStaffing(@Param('operationId') operationId: string) {
    return this.schedulingService.getOptimalStaffing(+operationId);
  }

  @Get('optimize-staffing/:operationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN)
  async optimizeStaffing(@Param('operationId') operationId: number) {
    try {
      console.log('🔵 SchedulingController: optimizando personal para operación:', operationId);
      return await this.schedulingService.optimizeStaffingForOperation(operationId);
    } catch (error) {
      console.error('❌ SchedulingController: error en optimizeStaffing:', error);
      throw error;
    }
  }
}
