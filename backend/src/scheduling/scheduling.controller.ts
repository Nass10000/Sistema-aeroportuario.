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
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async validateAssignment(@Body() body: {
    userId: number;
    operationId: number;
    startTime: string;
    endTime: string;
  }) {
    return this.schedulingService.validateAssignment(
      body.userId,
      body.operationId,
      new Date(body.startTime),
      new Date(body.endTime)
    );
  }

  @Post('check-availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
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

  @Get('available-staff/:operationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async findAvailableStaff(
    @Param('operationId') operationId: string,
    @Query('skills') skills?: string,
    @Query('excludeIds') excludeIds?: string
  ) {
    const requiredSkills = skills ? skills.split(',') : [];
    const excludeUserIds = excludeIds ? excludeIds.split(',').map(id => +id) : [];
    
    return this.schedulingService.findAvailableStaff(
      +operationId,
      requiredSkills,
      excludeUserIds
    );
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
}
