import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Assignment, AssignmentStatus } from '../assignment/assignment.entity';
import { Operation, OperationStatus } from '../operation/operation.entity';
import { Station } from '../station/station.entity';
import { User } from '../user/user.entity';
import { UserRole } from '../common/enums/roles.enum';
import { Punch, PunchType } from '../punch/punch.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Punch)
    private punchRepository: Repository<Punch>,
  ) {}

  async getAdminDashboard(startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);

    const [
      totalStations,
      totalEmployees,
      activeOperations,
      totalAssignments,
      staffShortageAlerts,
      attendanceStats,
      coverageByStation
    ] = await Promise.all([
      this.stationRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: UserRole.EMPLOYEE, isActive: true } }),
      this.operationRepository.count({
        where: { status: OperationStatus.IN_PROGRESS }
      }),
      this.assignmentRepository.count({
        where: dateFilter ? { startTime: dateFilter } : {}
      }),
      this.getStaffShortageAlerts(),
      this.getAttendanceStats(dateFilter),
      this.getCoverageByStation()
    ]);

    return {
      summary: {
        totalStations,
        totalEmployees,
        activeOperations,
        totalAssignments
      },
      alerts: staffShortageAlerts,
      attendance: attendanceStats,
      coverage: coverageByStation
    };
  }

  async getManagerDashboard(managerId: number, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);
    
    // Obtener estaciones que maneja este manager
    const managedStations = await this.stationRepository.find({
      where: { manager: { id: managerId } },
      relations: ['operations']
    });

    const stationIds = managedStations.map(s => s.id);

    const [
      totalOperations,
      totalAssignments,
      staffingAlerts,
      attendanceStats
    ] = await Promise.all([
      this.operationRepository.count({
        where: { station: { id: stationIds.length > 0 ? stationIds[0] : -1 } }
      }),
      this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.operation', 'operation')
        .where('operation.stationId IN (:...stationIds)', { stationIds })
        .getCount(),
      this.getStaffShortageAlertsByStations(stationIds),
      this.getAttendanceStatsByStations(stationIds, dateFilter)
    ]);

    return {
      stations: managedStations,
      summary: {
        totalOperations,
        totalAssignments,
        managedStations: managedStations.length
      },
      alerts: staffingAlerts,
      attendance: attendanceStats
    };
  }

  async getEmployeeDashboard(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayAssignments,
      upcomingAssignments,
      weeklyHours,
      recentPunches
    ] = await Promise.all([
      this.assignmentRepository.find({
        where: {
          user: { id: userId },
          startTime: Between(startOfDay, endOfDay)
        },
        relations: ['operation', 'operation.station']
      }),
      this.assignmentRepository.find({
        where: {
          user: { id: userId },
          startTime: Between(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        },
        relations: ['operation', 'operation.station'],
        order: { startTime: 'ASC' },
        take: 5
      }),
      this.calculateWeeklyHours(userId),
      this.punchRepository.find({
        where: { user: { id: userId } },
        order: { timestamp: 'DESC' },
        take: 10
      })
    ]);

    return {
      today: todayAssignments,
      upcoming: upcomingAssignments,
      weeklyHours,
      recentPunches
    };
  }

  async getStationDashboard(stationId: number, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);

    const [
      station,
      operations,
      assignments,
      staffing,
      coverage
    ] = await Promise.all([
      this.stationRepository.findOne({
        where: { id: stationId },
        relations: ['manager']
      }),
      this.operationRepository.find({
        where: {
          station: { id: stationId },
          ...(dateFilter && { scheduledTime: dateFilter })
        },
        relations: ['assignments']
      }),
      this.assignmentRepository.find({
        where: {
          operation: { station: { id: stationId } },
          ...(dateFilter && { startTime: dateFilter })
        },
        relations: ['user', 'operation']
      }),
      this.getStationStaffing(stationId),
      this.getStationCoverage(stationId)
    ]);

    return {
      station,
      operations,
      assignments,
      staffing,
      coverage
    };
  }

  async getAlerts(userId: number, userRole: UserRole) {
    const alerts: any[] = [];

    // Alertas de personal faltante
    if (userRole !== UserRole.EMPLOYEE) {
      const staffShortage = await this.getStaffShortageAlerts();
      alerts.push(...staffShortage);
    }

    // Alertas de horas extra
    const overtimeAlerts = await this.getOvertimeAlerts(userId, userRole);
    alerts.push(...overtimeAlerts);

    // Alertas de confirmación pendiente
    if (userRole === UserRole.EMPLOYEE) {
      const pendingConfirmations = await this.getPendingConfirmations(userId);
      alerts.push(...pendingConfirmations);
    }

    return alerts;
  }

  async getAttendanceAnalytics(stationId?: number, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);
    
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.user', 'user')
      .leftJoin('assignment.operation', 'operation')
      .leftJoin('operation.station', 'station')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN assignment.status = :completed THEN 1 END) as completed',
        'COUNT(CASE WHEN assignment.status = :absent THEN 1 END) as absent',
        'AVG(CASE WHEN assignment.actualEndTime IS NOT NULL AND assignment.actualStartTime IS NOT NULL THEN EXTRACT(EPOCH FROM (assignment.actualEndTime - assignment.actualStartTime))/3600 END) as avgHours'
      ])
      .setParameter('completed', AssignmentStatus.COMPLETED)
      .setParameter('absent', AssignmentStatus.ABSENT);

    if (stationId) {
      query.where('station.id = :stationId', { stationId });
    }

    if (startDate && endDate) {
      query.andWhere('assignment.startTime BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate)
      });
    }

    return query.getRawOne();
  }

  async getOvertimeAnalytics(stationId?: number, startDate?: string, endDate?: string) {
    const dateFilter = this.getDateFilter(startDate, endDate);
    
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.user', 'user')
      .leftJoin('assignment.operation', 'operation')
      .leftJoin('operation.station', 'station')
      .select([
        'user.id',
        'user.name',
        'SUM(assignment.overtimeHours) as totalOvertime',
        'COUNT(*) as totalAssignments'
      ])
      .where('assignment.overtimeHours > 0')
      .groupBy('user.id, user.name');

    if (stationId) {
      query.andWhere('station.id = :stationId', { stationId });
    }

    if (dateFilter) {
      // Extract start and end from the Between arguments
      const [start, end] = (dateFilter as any)._value;
      query.andWhere('assignment.startTime BETWEEN :start AND :end', {
        start,
        end
      });
    }

    return query.getRawMany();
  }

  async getCoverageAnalytics() {
    return this.stationRepository
      .createQueryBuilder('station')
      .leftJoin('station.operations', 'operation')
      .leftJoin('operation.assignments', 'assignment')
      .select([
        'station.id',
        'station.name',
        'station.minimumStaff',
        'COUNT(DISTINCT assignment.id) as currentAssignments',
        'CASE WHEN COUNT(DISTINCT assignment.id) >= station.minimumStaff THEN true ELSE false END as isCovered'
      ])
      .where('station.isActive = true')
      .groupBy('station.id, station.name, station.minimumStaff')
      .getRawMany();
  }

  // Métodos auxiliares privados
  private getDateFilter(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) return null;
    
    return Between(new Date(startDate), new Date(endDate));
  }

  private async getStaffShortageAlerts() {
    // Implementar lógica para detectar escasez de personal
    return [];
  }

  private async getAttendanceStats(dateFilter: any) {
    // Implementar estadísticas de asistencia
    return {};
  }

  private async getCoverageByStation() {
    // Implementar cobertura por estación
    return [];
  }

  private async getStaffShortageAlertsByStations(stationIds: number[]) {
    // Implementar alertas por estaciones específicas
    return [];
  }

  private async getAttendanceStatsByStations(stationIds: number[], dateFilter: any) {
    // Implementar estadísticas por estaciones
    return {};
  }

  private async calculateWeeklyHours(userId: number) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const assignments = await this.assignmentRepository.find({
      where: {
        user: { id: userId },
        startTime: Between(startOfWeek, endOfWeek),
        status: AssignmentStatus.COMPLETED
      }
    });

    return assignments.reduce((total, assignment) => {
      if (assignment.actualStartTime && assignment.actualEndTime) {
        const hours = (assignment.actualEndTime.getTime() - assignment.actualStartTime.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  }

  private async getStationStaffing(stationId: number) {
    // Implementar staffing por estación
    return {};
  }

  private async getStationCoverage(stationId: number) {
    // Implementar cobertura por estación
    return {};
  }

  private async getOvertimeAlerts(userId: number, userRole: UserRole) {
    // Implementar alertas de horas extra
    return [];
  }

  private async getPendingConfirmations(userId: number) {
    return this.assignmentRepository.find({
      where: {
        user: { id: userId },
        status: AssignmentStatus.SCHEDULED
      },
      relations: ['operation']
    });
  }
}
