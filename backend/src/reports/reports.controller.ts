import { Controller, Get, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums/roles.enum';
import { createEmptyReportResponse, createEmptyOvertimeResponse, createEmptyCoverageResponse } from './reports.utils';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('attendance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  @ApiResponse({ status: 200, description: 'Reporte de asistencia generado exitosamente' })
  async getAttendanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('stationId') stationId?: string,
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    try {
      const data = await this.reportsService.getAttendanceReport(
        startDate,
        endDate,
        stationId ? +stationId : undefined
      );

      if (format === 'csv' && res) {
        // Para CSV, usar solo los detalles del reporte (que es un array)
        const csvData = Array.isArray(data) ? data : data.details || [];
        const csv = await this.reportsService.exportToCSV(csvData, 'attendance-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
        return res.send(csv);
      }

      return data;
    } catch (error) {
      console.error('Controller error in getAttendanceReport:', error);
      // Always return 200 with empty response structure
      const emptyResponse = createEmptyReportResponse('Error interno del servidor. Por favor, intente nuevamente.');
      
      if (format === 'csv' && res) {
        const csv = await this.reportsService.exportToCSV([], 'attendance-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
        return res.send(csv);
      }
      
      return emptyResponse;
    }
  }

  @Get('overtime')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  @ApiResponse({ status: 200, description: 'Reporte de horas extra generado exitosamente' })
  async getOvertimeReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('stationId') stationId?: string,
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    try {
      const data = await this.reportsService.getOvertimeReport(
        startDate,
        endDate,
        stationId ? +stationId : undefined
      );

      if (format === 'csv' && res) {
        // Para CSV, usar solo los detalles del reporte (que es un array)
        const csvData = Array.isArray(data) ? data : data.details || [];
        const csv = await this.reportsService.exportToCSV(csvData, 'overtime-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=overtime-report.csv');
        return res.send(csv);
      }

      return data;
    } catch (error) {
      console.error('Controller error in getOvertimeReport:', error);
      // Always return 200 with empty response structure
      const emptyResponse = createEmptyOvertimeResponse('Error interno del servidor. Por favor, intente nuevamente.');
      
      if (format === 'csv' && res) {
        const csv = await this.reportsService.exportToCSV([], 'overtime-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=overtime-report.csv');
        return res.send(csv);
      }
      
      return emptyResponse;
    }
  }

  @Get('coverage')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  @ApiResponse({ status: 200, description: 'Reporte de cobertura de estaciones generado exitosamente' })
  async getStationCoverageReport(
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    try {
      const data = await this.reportsService.getStationCoverageReport();

      if (format === 'csv' && res) {
        const csv = await this.reportsService.exportToCSV(data, 'coverage-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=coverage-report.csv');
        return res.send(csv);
      }

      return data;
    } catch (error) {
      console.error('Controller error in getStationCoverageReport:', error);
      // Always return 200 with empty array
      const emptyResponse = createEmptyCoverageResponse('Error interno del servidor. Por favor, intente nuevamente.');
      
      if (format === 'csv' && res) {
        const csv = await this.reportsService.exportToCSV([], 'coverage-report');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=coverage-report.csv');
        return res.send(csv);
      }
      
      return emptyResponse;
    }
  }

  @Get('weekly-schedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  async getWeeklyScheduleReport(
    @Query('weekStartDate') weekStartDate: string,
    @Query('stationId') stationId?: string,
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    const data = await this.reportsService.getWeeklyScheduleReport(
      weekStartDate,
      stationId ? +stationId : undefined
    );

    if (format === 'csv' && res) {
      const csv = await this.reportsService.exportToCSV(data, 'weekly-schedule');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=weekly-schedule.csv');
      return res.send(csv);
    }

    return data;
  }

  @Get('employee-schedule')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT, UserRole.EMPLOYEE) // Empleados pueden ver su propio horario, supervisores y gerentes pueden ver de su equipo
  async getEmployeeScheduleReport(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    const data = await this.reportsService.getEmployeeScheduleReport(
      +employeeId,
      startDate,
      endDate
    );

    if (format === 'csv' && res) {
      const csv = await this.reportsService.exportToCSV(data, 'employee-schedule');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employee-schedule.csv');
      return res.send(csv);
    }

    return data;
  }

  @Get('cost-analysis')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PRESIDENT)
  async getCostAnalysisReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('stationId') stationId?: string,
    @Query('format') format: string = 'json',
    @Res() res?: Response
  ) {
    const data = await this.reportsService.getCostAnalysisReport(
      startDate,
      endDate,
      stationId ? +stationId : undefined
    );

    if (format === 'csv' && res) {
      // Para CSV, usar solo los detalles del reporte (que es un array)
      const csvData = Array.isArray(data) ? data : data.details || [];
      const csv = await this.reportsService.exportToCSV(csvData, 'cost-analysis');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cost-analysis.csv');
      return res.send(csv);
    }

    return data;
  }

  @Get('operational-metrics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PRESIDENT)
  async getOperationalMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getOperationalMetrics(startDate, endDate);
  }
}
