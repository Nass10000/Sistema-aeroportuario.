import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Assignment, AssignmentStatus } from '../assignment/assignment.entity';
import { Operation, OperationStatus } from '../operation/operation.entity';
import { Station } from '../station/station.entity';
import { User } from '../user/user.entity';
import { Punch } from '../punch/punch.entity';
import { 
  validateReportParameters, 
  createEmptyReportResponse, 
  createEmptyOvertimeResponse, 
  createEmptyCoverageResponse,
  createErrorReportResponse,
  StandardReportResponse 
} from './reports.utils';

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
  ): Promise<StandardReportResponse> {
    try {
      console.log('📊 Generating attendance report with params:', { startDate, endDate, stationId });

      // Validate required parameters
      const validation = validateReportParameters(startDate, endDate);
      if (!validation.isValid) {
        return createEmptyReportResponse(validation.message);
      }

      // Obtener todos los usuarios EXCEPTO presidente - incluir admin, manager, supervisor, employee
      // Los administradores y presidentes pueden ver todos los empleados
      let usersQuery = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.role',
          'user.stationId',
          'user.maxDailyHours',
          'user.isActive'
        ])
        .where('user.role IN (:...roles)', { roles: ['employee', 'supervisor', 'manager', 'admin'] })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (stationId) {
        usersQuery = usersQuery.andWhere('user.stationId = :stationId', { stationId });
      }

      const users = await usersQuery.getMany();
      console.log('👥 Found users:', users.length);

      // Obtener nombres de estaciones
      const stations = await this.stationRepository
        .createQueryBuilder('station')
        .select(['station.id', 'station.name'])
        .getMany();
      
      const stationMap = stations.reduce((acc, station) => {
        acc[station.id] = station.name;
        return acc;
      }, {} as Record<number, string>);

      // Obtener asignaciones para el rango de fechas
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      console.log('📅 Date range:', { startDateObj, endDateObj });

      let assignmentsQuery = this.assignmentRepository
        .createQueryBuilder('assignment')
        .select([
          'assignment.userId as userId',
          'COUNT(*) as totalAssignments'
        ])
        .where('assignment.startTime >= :startDate', { startDate: startDateObj })
        .andWhere('assignment.startTime <= :endDate', { endDate: endDateObj })
        .andWhere('assignment.userId IS NOT NULL')
        .groupBy('assignment.userId');

      const assignments = await assignmentsQuery.getRawMany();
      console.log('📋 Found assignments:', assignments.length, assignments);

      // Obtener punches para el rango de fechas
      let punchesQuery = this.punchRepository
        .createQueryBuilder('punch')
        .select([
          'punch.userId as userId',
          'punch.type as type',
          'punch.timestamp as timestamp'
        ])
        .where('punch.timestamp >= :startDate', { startDate: startDateObj })
        .andWhere('punch.timestamp <= :endDate', { endDate: endDateObj })
        .orderBy('punch.timestamp', 'ASC');

      const punches = await punchesQuery.getRawMany();
      console.log('⏰ Found punches:', punches.length, punches);

      // Crear mapas para eficiencia
      const assignmentsByUser = assignments.reduce((acc, assignment) => {
        const userId = assignment.userId || assignment.userid;
        const totalAssignments = assignment.totalAssignments || assignment.totalassignments;
        
        console.log('📋 Processing assignment:', { userId, totalAssignments, rawAssignment: assignment });
        
        if (userId) {
          const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
          acc[userIdNum] = parseInt(totalAssignments);
          console.log(`✅ Added assignment for user ${userIdNum}: ${totalAssignments} assignments`);
        }
        return acc;
      }, {} as Record<number, number>);

      const punchesByUser = punches.reduce((acc, punch) => {
        console.log('🔍 Processing punch - raw data:', punch);
        
        // Convertir userId a número si es string
        const userId = punch.userId || punch.userid;
        const punchType = punch.type;
        const timestamp = punch.timestamp;
        
        console.log('🔍 Extracted values:', { userId, punchType, timestamp });
        
        // Validar que el punch tenga datos válidos
        if (!userId || !punchType || !timestamp) {
          console.warn('⚠️ Skipping invalid punch - missing data:', { userId, punchType, timestamp, punch });
          return acc;
        }
        
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        
        // Validar que userId sea un número válido
        if (isNaN(userIdNum)) {
          console.warn('⚠️ Skipping punch - invalid userId:', userId);
          return acc;
        }
        
        // Inicializar el objeto si no existe
        if (!acc[userIdNum]) {
          acc[userIdNum] = { in: [], out: [] };
        }
        
        // Validar que el tipo sea válido antes de hacer push
        if (punchType === 'in' || punchType === 'out') {
          acc[userIdNum][punchType].push(timestamp);
          console.log(`✅ Added punch for user ${userIdNum}: ${punchType} at ${timestamp}`);
        } else {
          console.warn('⚠️ Invalid punch type:', punchType, 'Expected "in" or "out", got:', punchType);
        }
        
        return acc;
      }, {} as Record<number, { in: string[], out: string[] }>);

      // Construir detalles para el frontend con cálculos de horas y pagos
      const details = users.map(user => {
        const totalAssignments = assignmentsByUser[user.id] || 0;
        const userPunches = punchesByUser[user.id];
        
        // Calcular horas trabajadas y horas extra
        let totalHours = 0;
        let overtimeHours = 0;
        let regularHours = 0;
        const maxDailyHours = user.maxDailyHours || 8; // Default 8 horas
        
        if (userPunches?.in?.length > 0 && userPunches?.out?.length > 0) {
          // Calcular horas por cada día
          const inTimes = userPunches.in.map(t => new Date(t));
          const outTimes = userPunches.out.map(t => new Date(t));
          
          // Agrupar por día y calcular horas diarias
          const dailyHours = new Map<string, number>();
          
          inTimes.forEach((inTime, index) => {
            if (outTimes[index]) {
              const dateKey = inTime.toISOString().split('T')[0];
              const hoursWorked = (outTimes[index].getTime() - inTime.getTime()) / (1000 * 60 * 60);
              
              if (hoursWorked > 0 && hoursWorked <= 24) { // Validar horas razonables
                dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hoursWorked);
              }
            }
          });
          
          // Calcular total y horas extra
          dailyHours.forEach(hours => {
            totalHours += hours;
            if (hours > maxDailyHours) {
              overtimeHours += hours - maxDailyHours;
              regularHours += maxDailyHours;
            } else {
              regularHours += hours;
            }
          });
        }
        
        // Calcular pagos (ejemplo: $15/hora regular, $22.5/hora extra - 1.5x)
        const regularRate = 15; // USD por hora regular
        const overtimeRate = regularRate * 1.5; // 1.5x para horas extra
        const regularPay = regularHours * regularRate;
        const overtimePay = overtimeHours * overtimeRate;
        const totalPay = regularPay + overtimePay;
        
        // Formatear horas de entrada y salida
        const checkIn = userPunches?.in?.[0] ? new Date(userPunches.in[0]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
        const checkOut = userPunches?.out?.slice(-1)[0] ? new Date(userPunches.out.slice(-1)[0]).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
        
        // Un usuario está "presente" si tiene asignaciones O punches en el rango de fechas
        let status = 'Ausente';
        if (totalAssignments > 0 || userPunches?.in?.length > 0) {
          status = 'Presente';
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          station: user.stationId ? (stationMap[user.stationId] || `Estación ${user.stationId}`) : 'Sin asignar',
          status,
          checkIn,
          checkOut,
          totalAssignments,
          totalHours: Math.round(totalHours * 100) / 100, // Redondear a 2 decimales
          regularHours: Math.round(regularHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          regularPay: Math.round(regularPay * 100) / 100,
          overtimePay: Math.round(overtimePay * 100) / 100,
          totalPay: Math.round(totalPay * 100) / 100,
          hourlyRate: regularRate,
          overtimeRate: overtimeRate
        };
      });

      // Si no hay usuarios, devolver estructura vacía pero válida
      if (details.length === 0) {
        return {
          summary: {
            totalEmployees: 0,
            presentToday: 0,
            absentToday: 0,
            attendanceRate: 0,
          },
          details: [],
          message: 'No se encontraron usuarios en el sistema'
        };
      }

      // Calcular resumen
      const totalEmployees = details.length;
      const presentToday = details.filter(d => d.status === 'Presente').length;
      const absentToday = details.filter(d => d.status === 'Ausente').length;
      const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

      const result = {
        summary: {
          totalEmployees,
          presentToday,
          absentToday,
          attendanceRate,
        },
        details,
      };

      console.log('📊 Attendance report generated:', result);
      return result;

    } catch (error) {
      console.error('❌ Error generating attendance report:', error);
      return createErrorReportResponse(
        `Error interno al generar el reporte de asistencia: ${error.message}`,
        'attendance'
      ) as StandardReportResponse;
    }
  }

  async getOvertimeReport(
    startDate: string,
    endDate: string,
    stationId?: number
  ): Promise<StandardReportResponse> {
    try {
      console.log('📊 Generating overtime report with params:', { startDate, endDate, stationId });

      // Validate required parameters
      const validation = validateReportParameters(startDate, endDate);
      if (!validation.isValid) {
        return createEmptyOvertimeResponse(validation.message);
      }

      // Obtener todos los usuarios activos EXCEPTO presidente
      let usersQuery = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.role',
          'user.stationId',
          'user.maxDailyHours'
        ])
        .where('user.role IN (:...roles)', { roles: ['employee', 'supervisor', 'manager', 'admin'] })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (stationId) {
        usersQuery = usersQuery.andWhere('user.stationId = :stationId', { stationId });
      }

      const users = await usersQuery.getMany();
      console.log('👥 Found users for overtime report:', users.length);

      // Obtener punches para el rango de fechas
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      let punchesQuery = this.punchRepository
        .createQueryBuilder('punch')
        .leftJoinAndSelect('punch.user', 'user')
        .where('punch.timestamp >= :startDate', { startDate: startDateObj })
        .andWhere('punch.timestamp <= :endDate', { endDate: endDateObj })
        .andWhere('user.role IN (:...roles)', { roles: ['employee', 'supervisor', 'manager', 'admin'] })
        .orderBy('punch.timestamp', 'ASC');

      if (stationId) {
        punchesQuery = punchesQuery.andWhere('user.stationId = :stationId', { stationId });
      }

      const punches = await punchesQuery.getMany();
      console.log('⏰ Found punches for overtime:', punches.length);

      // Procesar punches por usuario
      const punchesByUser = punches.reduce((acc, punch) => {
        const userId = punch.user.id;
        if (!acc[userId]) {
          acc[userId] = { in: [], out: [] };
        }
        acc[userId][punch.type].push(punch.timestamp);
        return acc;
      }, {} as Record<number, { in: Date[], out: Date[] }>);

      // Calcular horas extra por usuario
      const overtimeDetails = users.map(user => {
        const userPunches = punchesByUser[user.id];
        const maxDailyHours = user.maxDailyHours || 8;
        
        let totalHours = 0;
        let overtimeHours = 0;
        let regularHours = 0;
        let daysWithOvertime = 0;
        
        if (userPunches?.in?.length > 0 && userPunches?.out?.length > 0) {
          // Agrupar por día
          const dailyHours = new Map<string, number>();
          
          userPunches.in.forEach((inTime, index) => {
            if (userPunches.out[index]) {
              const dateKey = inTime.toISOString().split('T')[0];
              const hoursWorked = (userPunches.out[index].getTime() - inTime.getTime()) / (1000 * 60 * 60);
              
              if (hoursWorked > 0 && hoursWorked <= 24) {
                dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hoursWorked);
              }
            }
          });
          
          // Calcular horas extra por día
          dailyHours.forEach(hours => {
            totalHours += hours;
            if (hours > maxDailyHours) {
              const dailyOvertime = hours - maxDailyHours;
              overtimeHours += dailyOvertime;
              regularHours += maxDailyHours;
              daysWithOvertime++;
            } else {
              regularHours += hours;
            }
          });
        }
        
        // Calcular pagos
        const regularRate = 15; // USD por hora
        const overtimeRate = regularRate * 1.5;
        const overtimePay = overtimeHours * overtimeRate;
        
        return {
          employeeId: user.id,
          employeeName: user.name,
          role: user.role,
          station: user.stationId,
          totalHours: Math.round(totalHours * 100) / 100,
          regularHours: Math.round(regularHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          overtimePay: Math.round(overtimePay * 100) / 100,
          daysWithOvertime,
          hourlyRate: regularRate,
          overtimeRate
        };
      }).filter(user => user.overtimeHours > 0); // Solo mostrar usuarios con horas extra

      // Calcular resumen
      const totalOvertimeHours = overtimeDetails.reduce((sum, user) => sum + user.overtimeHours, 0);
      const totalOvertimePay = overtimeDetails.reduce((sum, user) => sum + user.overtimePay, 0);
      const employeesWithOvertime = overtimeDetails.length;
      const averageOvertimeHours = employeesWithOvertime > 0 ? totalOvertimeHours / employeesWithOvertime : 0;

      const result = {
        summary: {
          totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
          totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
          employeesWithOvertime,
          averageOvertimeHours: Math.round(averageOvertimeHours * 100) / 100,
          totalEmployeesAnalyzed: users.length
        },
        details: overtimeDetails
      };

      console.log('📊 Overtime report generated:', result);
      return result;

    } catch (error) {
      console.error('❌ Error generating overtime report:', error);
      return createErrorReportResponse(
        `Error interno al generar el reporte de horas extra: ${error.message}`,
        'overtime'
      ) as StandardReportResponse;
    }
  }

  async getStationCoverageReport(): Promise<StationCoverageReport[]> {
    try {
      console.log('📊 Generating station coverage report');
      
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

      // If no stations found, return empty array with message
      if (!results || results.length === 0) {
        console.log('⚠️ No stations found for coverage report');
        return createEmptyCoverageResponse('No se encontraron estaciones activas con asignaciones');
      }

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
    } catch (error) {
      console.error('❌ Error generating station coverage report:', error);
      return createEmptyCoverageResponse(`Error interno al generar el reporte de cobertura: ${error.message}`);
    }
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
    try {
      console.log('💰 Generating cost analysis report with params:', { startDate, endDate, stationId });

      // Obtener todos los usuarios activos EXCEPTO presidente
      let usersQuery = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.role',
          'user.stationId',
          'user.maxDailyHours'
        ])
        .where('user.role IN (:...roles)', { roles: ['employee', 'supervisor', 'manager', 'admin'] })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (stationId) {
        usersQuery = usersQuery.andWhere('user.stationId = :stationId', { stationId });
      }

      const users = await usersQuery.getMany();

      // Obtener punches para calcular horas trabajadas
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      let punchesQuery = this.punchRepository
        .createQueryBuilder('punch')
        .leftJoinAndSelect('punch.user', 'user')
        .where('punch.timestamp >= :startDate', { startDate: startDateObj })
        .andWhere('punch.timestamp <= :endDate', { endDate: endDateObj })
        .andWhere('user.role IN (:...roles)', { roles: ['employee', 'supervisor', 'manager', 'admin'] })
        .orderBy('punch.timestamp', 'ASC');

      if (stationId) {
        punchesQuery = punchesQuery.andWhere('user.stationId = :stationId', { stationId });
      }

      const punches = await punchesQuery.getMany();

      // Obtener información de estaciones
      const stations = await this.stationRepository
        .createQueryBuilder('station')
        .select(['station.id', 'station.name'])
        .getMany();
        
      const stationMap = stations.reduce((acc, station) => {
        acc[station.id] = station.name;
        return acc;
      }, {} as Record<number, string>);

      // Procesar punches por usuario
      const punchesByUser = punches.reduce((acc, punch) => {
        const userId = punch.user.id;
        if (!acc[userId]) {
          acc[userId] = { in: [], out: [] };
        }
        acc[userId][punch.type].push(punch.timestamp);
        return acc;
      }, {} as Record<number, { in: Date[], out: Date[] }>);

      // Definir tarifas por rol
      const hourlyRates = {
        employee: 15,     // $15/hora
        supervisor: 20,   // $20/hora  
        manager: 25,      // $25/hora
        admin: 30         // $30/hora
      };

      // Calcular costos por usuario
      const costDetails = users.map(user => {
        const userPunches = punchesByUser[user.id];
        const maxDailyHours = user.maxDailyHours || 8;
        const hourlyRate = hourlyRates[user.role as keyof typeof hourlyRates] || 15;
        const overtimeRate = hourlyRate * 1.5;
        
        let totalHours = 0;
        let overtimeHours = 0;
        let regularHours = 0;
        
        if (userPunches?.in?.length > 0 && userPunches?.out?.length > 0) {
          const dailyHours = new Map<string, number>();
          
          userPunches.in.forEach((inTime, index) => {
            if (userPunches.out[index]) {
              const dateKey = inTime.toISOString().split('T')[0];
              const hoursWorked = (userPunches.out[index].getTime() - inTime.getTime()) / (1000 * 60 * 60);
              
              if (hoursWorked > 0 && hoursWorked <= 24) {
                dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hoursWorked);
              }
            }
          });
          
          dailyHours.forEach(hours => {
            totalHours += hours;
            if (hours > maxDailyHours) {
              overtimeHours += hours - maxDailyHours;
              regularHours += maxDailyHours;
            } else {
              regularHours += hours;
            }
          });
        }
        
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * overtimeRate;
        const totalPay = regularPay + overtimePay;
        
        return {
          employeeId: user.id,
          employeeName: user.name,
          role: user.role,
          station: user.stationId ? (stationMap[user.stationId] || `Estación ${user.stationId}`) : 'Sin asignar',
          stationId: user.stationId,
          totalHours: Math.round(totalHours * 100) / 100,
          regularHours: Math.round(regularHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          hourlyRate,
          overtimeRate,
          regularPay: Math.round(regularPay * 100) / 100,
          overtimePay: Math.round(overtimePay * 100) / 100,
          totalPay: Math.round(totalPay * 100) / 100
        };
      });

      // Agrupar por estación para resumen
      const stationSummary = costDetails.reduce((acc, user) => {
        const stationKey = user.stationId || 0;
        const stationName = user.station;
        
        if (!acc[stationKey]) {
          acc[stationKey] = {
            stationId: stationKey,
            stationName,
            employeeCount: 0,
            totalHours: 0,
            totalRegularPay: 0,
            totalOvertimePay: 0,
            totalCost: 0
          };
        }
        
        acc[stationKey].employeeCount++;
        acc[stationKey].totalHours += user.totalHours;
        acc[stationKey].totalRegularPay += user.regularPay;
        acc[stationKey].totalOvertimePay += user.overtimePay;
        acc[stationKey].totalCost += user.totalPay;
        
        return acc;
      }, {} as Record<number, any>);

      // Calcular totales generales
      const totalCost = costDetails.reduce((sum, user) => sum + user.totalPay, 0);
      const totalRegularPay = costDetails.reduce((sum, user) => sum + user.regularPay, 0);
      const totalOvertimePay = costDetails.reduce((sum, user) => sum + user.overtimePay, 0);
      const totalHours = costDetails.reduce((sum, user) => sum + user.totalHours, 0);

      const result = {
        summary: {
          totalEmployees: costDetails.length,
          totalHours: Math.round(totalHours * 100) / 100,
          totalRegularPay: Math.round(totalRegularPay * 100) / 100,
          totalOvertimePay: Math.round(totalOvertimePay * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          averageCostPerEmployee: costDetails.length > 0 ? Math.round((totalCost / costDetails.length) * 100) / 100 : 0
        },
        byStation: Object.values(stationSummary),
        details: costDetails.filter(user => user.totalPay > 0) // Solo mostrar usuarios con pago
      };

      console.log('💰 Cost analysis report generated:', result);
      return result;

    } catch (error) {
      console.error('❌ Error generating cost analysis report:', error);
      return {
        summary: { 
          totalEmployees: 0, 
          totalHours: 0, 
          totalRegularPay: 0, 
          totalOvertimePay: 0, 
          totalCost: 0, 
          averageCostPerEmployee: 0 
        },
        byStation: [],
        details: [],
        error: error.message
      };
    }
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
