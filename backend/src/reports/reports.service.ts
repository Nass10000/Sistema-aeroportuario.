import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Assignment, AssignmentStatus } from '../assignment/assignment.entity';
import { Operation, OperationStatus } from '../operation/operation.entity';
import { Station } from '../station/station.entity';
import { User } from '../user/user.entity';
import { Punch } from '../punch/punch.entity';

export interface AttendanceReport {
  employeeId: number;
  employeeName: string;
  totalAssignments: number;
  completedAssignments: number;
  absentAssignments: number;
  attendanceRate: number;
  totalHours: number;
  averageHoursPerDay: number;
}

export interface OvertimeReport {
  employeeId: number;
  employeeName: string;
  totalOvertimeHours: number;
  overtimeCost: number;
  overtimeAssignments: number;
}

export interface StationCoverageReport {
  stationId: number;
  stationName: string;
  requiredStaff: number;
  currentStaff: number;
  coveragePercentage: number;
  isUnderstaffed: boolean;
}

@Injectable()
export class ReportsService {
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

  async getAttendanceReport(
    startDate: string,
    endDate: string,
    stationId?: number
  ): Promise<any> {
    try {
      // Optimización: Limitar resultados y mejorar performance
      const query = this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.user', 'user')
        .leftJoin('assignment.operation', 'operation')
        .leftJoin('operation.station', 'station')
        .select([
          'user.id as employeeId',
          'user.name as employeeName',
          'station.name as stationName',
          'COUNT(*) as totalAssignments',
          'COUNT(CASE WHEN assignment.status = :completed THEN 1 END) as completedAssignments',
          'COUNT(CASE WHEN assignment.status = :absent THEN 1 END) as absentAssignments'
        ])
        .where('assignment.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .setParameter('completed', AssignmentStatus.COMPLETED)
        .setParameter('absent', AssignmentStatus.ABSENT)
        .groupBy('user.id, user.name, station.name')
        .limit(100); // Limitar resultados para evitar timeout

      if (stationId) {
        query.andWhere('station.id = :stationId', { stationId });
      }

      const results = await query.getRawMany();

      // 2. Obtener punches solo de los empleados encontrados
      const userIds = results.map(r => r.employeeId);
      let punchesByUser: Record<string, any[]> = {};
      if (userIds.length > 0) {
        const punches = await this.punchRepository
          .createQueryBuilder('punch')
          .leftJoin('punch.user', 'user')
          .where('user.id IN (:...userIds)', { userIds })
          .andWhere('punch.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
          .orderBy('punch.timestamp', 'ASC')
          .limit(500) // Limitar punches también
          .getMany();
        punchesByUser = punches.reduce((acc, punch) => {
          const uid = punch.user.id;
          if (!acc[uid]) acc[uid] = [];
          acc[uid].push(punch);
          return acc;
        }, {} as Record<string, any[]>);
      }

      // 3. Construir detalles para el frontend
      const details = results.map(result => {
        const punches = punchesByUser[result.employeeId] || [];
        const checkIn = punches.find(p => p.type === 'in');
        const checkOut = [...punches].reverse().find(p => p.type === 'out');
        let status = 'Ausente';
        if (parseInt(result.completedAssignments) > 0 || checkIn) {
          status = 'Presente';
        }
        return {
          name: result.employeeName,
          station: result.stationName || 'N/A',
          status,
          checkIn: checkIn ? new Date(checkIn.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: checkOut ? new Date(checkOut.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-',
        };
      });

      // 4. Calcular resumen
      const totalEmployees = results.length;
      const presentToday = details.filter(d => d.status === 'Presente').length;
      const absentToday = details.filter(d => d.status === 'Ausente').length;
      const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

      return {
        summary: {
          totalEmployees,
          presentToday,
          absentToday,
          attendanceRate,
        },
        details,
      };
    } catch (error) {
      console.error('Error generating attendance report:', error);
      return {
        summary: { totalEmployees: 0, presentToday: 0, absentToday: 0, attendanceRate: 0 },
        details: [],
      };
    }
  }

  async getOvertimeReport(
    startDate: string,
    endDate: string,
    stationId?: number
  ): Promise<OvertimeReport[]> {
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.user', 'user')
      .leftJoin('assignment.operation', 'operation')
      .leftJoin('operation.station', 'station')
      .select([
        'user.id as employeeId',
        'user.name as employeeName',
        'SUM(assignment.overtimeHours) as totalOvertimeHours',
        'SUM(assignment.overtimeHours * assignment.cost) as overtimeCost',
        'COUNT(*) as overtimeAssignments'
      ])
      .where('assignment.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('assignment.overtimeHours > 0')
      .groupBy('user.id, user.name');

    if (stationId) {
      query.andWhere('station.id = :stationId', { stationId });
    }

    const results = await query.getRawMany();

    return results.map(result => ({
      employeeId: parseInt(result.employeeId),
      employeeName: result.employeeName,
      totalOvertimeHours: parseFloat(result.totalOvertimeHours) || 0,
      overtimeCost: parseFloat(result.overtimeCost) || 0,
      overtimeAssignments: parseInt(result.overtimeAssignments)
    }));
  }

  async getStationCoverageReport(): Promise<StationCoverageReport[]> {
    const results = await this.stationRepository
      .createQueryBuilder('station')
      .leftJoin('station.operations', 'operation')
      .leftJoin('operation.assignments', 'assignment')
      .select([
        'station.id as stationId',
        'station.name as stationName',
        'station.minimumStaff as requiredStaff',
        'COUNT(DISTINCT assignment.userId) as currentStaff'
      ])
      .where('station.isActive = true')
      .andWhere('assignment.status IN (:...statuses)', { 
        statuses: [AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED, AssignmentStatus.IN_PROGRESS] 
      })
      .groupBy('station.id, station.name, station.minimumStaff')
      .getRawMany();

    return results.map(result => {
      const currentStaff = parseInt(result.currentStaff) || 0;
      const requiredStaff = parseInt(result.requiredStaff);
      const coveragePercentage = requiredStaff > 0 ? (currentStaff / requiredStaff) * 100 : 0;

      return {
        stationId: parseInt(result.stationId),
        stationName: result.stationName,
        requiredStaff,
        currentStaff,
        coveragePercentage,
        isUnderstaffed: currentStaff < requiredStaff
      };
    });
  }

  async getWeeklyScheduleReport(weekStartDate: string, stationId?: number) {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.user', 'user')
      .leftJoinAndSelect('assignment.operation', 'operation')
      .leftJoinAndSelect('operation.station', 'station')
      .where('assignment.startTime BETWEEN :startDate AND :endDate', {
        startDate: weekStartDate,
        endDate: weekEndDate.toISOString()
      })
      .orderBy('assignment.startTime', 'ASC');

    if (stationId) {
      query.andWhere('station.id = :stationId', { stationId });
    }

    return query.getMany();
  }

  async getEmployeeScheduleReport(employeeId: number, startDate: string, endDate: string) {
    return this.assignmentRepository.find({
      where: {
        user: { id: employeeId },
        startTime: Between(new Date(startDate), new Date(endDate))
      },
      relations: ['operation', 'operation.station'],
      order: { startTime: 'ASC' }
    });
  }

  async getCostAnalysisReport(startDate: string, endDate: string, stationId?: number) {
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.operation', 'operation')
      .leftJoin('operation.station', 'station')
      .select([
        'station.name as stationName',
        'SUM(assignment.cost) as totalCost',
        'SUM(assignment.overtimeHours * assignment.cost) as overtimeCost',
        'COUNT(*) as totalAssignments',
        'AVG(assignment.cost) as averageCost'
      ])
      .where('assignment.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('station.id, station.name');

    if (stationId) {
      query.andWhere('station.id = :stationId', { stationId });
    }

    return query.getRawMany();
  }

  async exportToCSV(data: any[], filename: string): Promise<string> {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  async getOperationalMetrics(startDate: string, endDate: string) {
    const [
      totalOperations,
      completedOperations,
      cancelledOperations,
      totalFlights,
      totalPassengers,
      averageStaffPerOperation
    ] = await Promise.all([
      this.operationRepository.count({
        where: { scheduledTime: Between(new Date(startDate), new Date(endDate)) }
      }),
      this.operationRepository.count({
        where: { 
          scheduledTime: Between(new Date(startDate), new Date(endDate)),
          status: OperationStatus.COMPLETED
        }
      }),
      this.operationRepository.count({
        where: { 
          scheduledTime: Between(new Date(startDate), new Date(endDate)),
          status: OperationStatus.CANCELLED
        }
      }),
      this.operationRepository
        .createQueryBuilder('operation')
        .select('COUNT(DISTINCT operation.flightNumber)')
        .where('operation.scheduledTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
      this.operationRepository
        .createQueryBuilder('operation')
        .select('SUM(operation.passengerCount)')
        .where('operation.scheduledTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
      this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.operation', 'operation')
        .select('AVG(subquery.assignmentCount)')
        .from(subQuery => {
          return subQuery
            .select('operation.id, COUNT(assignment.id) as assignmentCount')
            .from('assignments', 'assignment')
            .leftJoin('assignment.operation', 'operation')
            .where('assignment.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .groupBy('operation.id');
        }, 'subquery')
        .getRawOne()
    ]);

    return {
      totalOperations,
      completedOperations,
      cancelledOperations,
      operationCompletionRate: totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0,
      totalFlights: parseInt(totalFlights?.count || '0'),
      totalPassengers: parseInt(totalPassengers?.sum || '0'),
      averageStaffPerOperation: parseFloat(averageStaffPerOperation?.avg || '0')
    };
  }
}
