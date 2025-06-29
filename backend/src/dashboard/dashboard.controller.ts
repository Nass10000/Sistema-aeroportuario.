import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums/roles.enum';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PRESIDENT, UserRole.MANAGER)
  async getAdminDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getAdminDashboard(startDate, endDate);
  }

  @Get('manager')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  async getManagerDashboard(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getManagerDashboard(req.user.userId, startDate, endDate);
  }

  @Get('employee')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN) // Empleados y roles superiores
  async getEmployeeDashboard(@Request() req) {
    return this.dashboardService.getEmployeeDashboard(req.user.userId);
  }

  @Get('station/:stationId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.PRESIDENT)
  async getStationDashboard(
    @Param('stationId') stationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getStationDashboard(+stationId, startDate, endDate);
  }

  @Get('alerts')
  async getAlerts(@Request() req) {
    return this.dashboardService.getAlerts(req.user.userId, req.user.role);
  }

  @Get('analytics/attendance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async getAttendanceAnalytics(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getAttendanceAnalytics(
      stationId ? +stationId : undefined,
      startDate,
      endDate
    );
  }

  @Get('analytics/overtime')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async getOvertimeAnalytics(
    @Query('stationId') stationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.dashboardService.getOvertimeAnalytics(
      stationId ? +stationId : undefined,
      startDate,
      endDate
    );
  }

  @Get('analytics/coverage')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async getCoverageAnalytics() {
    return this.dashboardService.getCoverageAnalytics();
  }
}
