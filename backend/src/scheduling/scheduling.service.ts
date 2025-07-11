import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Assignment, AssignmentStatus } from '../assignment/assignment.entity';
import { User } from '../user/user.entity';
import { Station } from '../station/station.entity';
import { ShiftType, UserRole } from '../common/enums/roles.enum';
import { Operation } from '../operation/operation.entity';
import { NotificationService } from '../notification/notification.service';

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface StaffAvailabilityCheck {
  userId: number;
  isAvailable: boolean;
  conflictingAssignments: Assignment[];
  reasonsUnavailable: string[];
}

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    private notificationService: NotificationService,
  ) {}

  async validateAssignment(
    userId: number,
    operationId: number,
    startTime: Date,
    endTime: Date
  ): Promise<ScheduleValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar que el usuario existe y está activo
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true }
      });

      if (!user) {
        errors.push('Usuario no encontrado o inactivo');
        return { isValid: false, errors, warnings };
      }

      // Validar que la operación existe
      const operation = await this.operationRepository.findOne({
        where: { id: operationId },
        relations: ['station']
      });

      if (!operation) {
        errors.push('Operación no encontrada');
        return { isValid: false, errors, warnings };
      }

      // Validar horarios
      if (startTime >= endTime) {
        errors.push('La hora de inicio debe ser anterior a la hora de fin');
      }

      // Validar duración máxima diaria (usar valores por defecto si no existen)
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const maxDailyHours = user.maxDailyHours || 8;
      if (duration > maxDailyHours) {
        errors.push(`La duración excede las horas máximas diarias (${maxDailyHours}h)`);
      }

      // Verificar superposición de turnos
      const overlappingAssignments = await this.checkOverlappingAssignments(
        userId,
        startTime,
        endTime
      );

      if (overlappingAssignments.length > 0) {
        errors.push('El empleado ya tiene asignaciones en ese horario');
      }

      // Verificar horas semanales
      const weeklyHours = await this.calculateWeeklyHours(userId, startTime);
      const maxWeeklyHours = user.maxWeeklyHours || 40;
      if (weeklyHours + duration > maxWeeklyHours) {
        warnings.push(`La asignación superará las horas semanales máximas (${maxWeeklyHours}h)`);
      }

      // Verificar disponibilidad de turno si existe
      try {
        const shiftType = this.getShiftType(startTime);
        if (user.availableShifts && !user.availableShifts.includes(shiftType)) {
          warnings.push(`El empleado no está disponible para turnos ${shiftType}`);
        }
      } catch (error) {
        console.warn('⚠️ Error checking shift availability:', error.message);
      }

      // Verificar certificaciones requeridas si existen
      try {
        if (operation.station?.requiredCertifications?.length > 0) {
          const userCertifications = user.certifications || [];
          const missingCertifications = operation.station.requiredCertifications.filter(
            cert => !userCertifications.includes(cert)
          );
          
          if (missingCertifications.length > 0) {
            errors.push(`El empleado no tiene las certificaciones requeridas: ${missingCertifications.join(', ')}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error checking certifications:', error.message);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('❌ Error in validateAssignment:', error);
      return {
        isValid: false,
        errors: ['Error interno del servidor al validar la asignación'],
        warnings: []
      };
    }
  }

  async checkStaffAvailability(
    userIds: number[],
    startTime: Date,
    endTime: Date
  ): Promise<StaffAvailabilityCheck[]> {
    const results: StaffAvailabilityCheck[] = [];

    for (const userId of userIds) {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true, isAvailable: true }
      });

      if (!user) {
        results.push({
          userId,
          isAvailable: false,
          conflictingAssignments: [],
          reasonsUnavailable: ['Usuario no encontrado o inactivo']
        });
        continue;
      }

      const conflictingAssignments = await this.checkOverlappingAssignments(
        userId,
        startTime,
        endTime
      );

      const reasonsUnavailable: string[] = [];

      if (conflictingAssignments.length > 0) {
        reasonsUnavailable.push('Tiene asignaciones en conflicto');
      }

      // Verificar disponibilidad de turno
      const shiftType = this.getShiftType(startTime);
      if (!user.availableShifts?.includes(shiftType)) {
        reasonsUnavailable.push(`No disponible para turno ${shiftType}`);
      }

      // Verificar horas semanales
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const weeklyHours = await this.calculateWeeklyHours(userId, startTime);
      
      if (weeklyHours + duration > (user.maxWeeklyHours || 40)) {
        reasonsUnavailable.push('Excedería horas semanales máximas');
      }

      results.push({
        userId,
        isAvailable: reasonsUnavailable.length === 0,
        conflictingAssignments,
        reasonsUnavailable
      });
    }

    return results;
  }

  async findAvailableStaff(
    operationId: number,
    requiredSkills: string[] = [],
    excludeUserIds: number[] = []
  ): Promise<User[]> {
    try {
      const operation = await this.operationRepository.findOne({
        where: { id: operationId },
        relations: ['station']
      });

      if (!operation) {
        throw new BadRequestException('Operación no encontrada');
      }

      const query = this.userRepository
        .createQueryBuilder('user')
        .where('user.isActive = true')
        .andWhere('user.isAvailable = true')
        .andWhere('user.role = :role', { role: 'employee' });

      if (excludeUserIds.length > 0) {
        query.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds: excludeUserIds });
      }

      // Filtrar por habilidades requeridas si existen
      if (requiredSkills.length > 0) {
        // Verificar si la columna skills existe
        try {
          query.andWhere('user.skills && :skills', { skills: requiredSkills });
        } catch (error) {
          console.warn('⚠️ Skills column not found, skipping skills filter');
        }
      }

      // Filtrar por certificaciones requeridas de la estación si existen
      if (operation.station?.requiredCertifications?.length > 0) {
        try {
          query.andWhere('user.certifications && :certifications', {
            certifications: operation.station.requiredCertifications
          });
        } catch (error) {
          console.warn('⚠️ Certifications column not found, skipping certifications filter');
        }
      }

      const users = await query.getMany();

      // Filtrar por disponibilidad de horario si existe
      if (operation.scheduledTime) {
        const shiftType = this.getShiftType(operation.scheduledTime);
        const availableUsers = users.filter(user => 
          user.availableShifts?.includes(shiftType) ?? true // Si no tiene availableShifts, asumimos disponible
        );

        // Verificar conflictos de horario si hay duración estimada
        if (operation.estimatedDuration) {
          const endTime = new Date(operation.scheduledTime);
          endTime.setHours(endTime.getHours() + operation.estimatedDuration);

          const finalUsers: User[] = [];
          for (const user of availableUsers) {
            const conflicts = await this.checkOverlappingAssignments(
              user.id,
              operation.scheduledTime,
              endTime
            );
            
            if (conflicts.length === 0) {
              finalUsers.push(user);
            }
          }

          return finalUsers;
        }

        return availableUsers;
      }

      return users;
    } catch (error) {
      console.error('❌ Error in findAvailableStaff:', error);
      throw new BadRequestException('Error al buscar personal disponible: ' + error.message);
    }
  }

  async createReplacement(
    originalAssignmentId: number,
    replacementUserId: number,
    reason: string,
    requestedBy: User
  ): Promise<Assignment> {
    const originalAssignment = await this.assignmentRepository.findOne({
      where: { id: originalAssignmentId },
      relations: ['user', 'operation']
    });

    if (!originalAssignment) {
      throw new BadRequestException('Asignación original no encontrada');
    }

    // Validar que el reemplazo esté disponible
    const validation = await this.validateAssignment(
      replacementUserId,
      originalAssignment.operation.id,
      originalAssignment.startTime,
      originalAssignment.endTime
    );

    if (!validation.isValid) {
      throw new BadRequestException(`No se puede crear el reemplazo: ${validation.errors.join(', ')}`);
    }

    // Marcar la asignación original como cancelada
    originalAssignment.status = AssignmentStatus.CANCELLED;
    originalAssignment.notes = `Reemplazado por usuario ${replacementUserId}. Razón: ${reason}`;
    await this.assignmentRepository.save(originalAssignment);

    // Crear nueva asignación de reemplazo
    const replacementAssignment = this.assignmentRepository.create({
      operation: originalAssignment.operation,
      user: { id: replacementUserId },
      function: originalAssignment.function,
      startTime: originalAssignment.startTime,
      endTime: originalAssignment.endTime,
      cost: originalAssignment.cost,
      isReplacement: true,
      replacementFor: originalAssignment.user,
      notes: `Reemplazo para ${originalAssignment.user.name}. Razón: ${reason}`
    });

    const savedReplacement = await this.assignmentRepository.save(replacementAssignment);

    // Notificar a los involucrados
    await this.notificationService.notifyNewAssignment(savedReplacement, requestedBy);
    
    return savedReplacement;
  }

  async getOptimalStaffing(operationId: number): Promise<{
    minimumStaff: number;
    recommendedStaff: number;
    availableStaff: User[];
    skillsNeeded: string[];
  }> {
    const operation = await this.operationRepository.findOne({
      where: { id: operationId },
      relations: ['station']
    });

    if (!operation) {
      throw new BadRequestException('Operación no encontrada');
    }

    // Calcular personal recomendado basado en número de pasajeros
    const baseStaff = Math.ceil(operation.passengerCount / 50); // 1 persona por cada 50 pasajeros
    const minimumStaff = Math.max(operation.station.minimumStaff, baseStaff);
    const recommendedStaff = Math.ceil(minimumStaff * 1.2); // 20% extra para contingencias

    // Determinar habilidades necesarias según el tipo de operación
    const skillsNeeded = this.getRequiredSkillsForOperation(operation);

    // Buscar personal disponible
    const availableStaff = await this.findAvailableStaff(operationId, skillsNeeded);

    return {
      minimumStaff,
      recommendedStaff,
      availableStaff,
      skillsNeeded
    };
  }

  // Método mejorado para optimización de personal
  async optimizeStaffingForOperation(operationId: number): Promise<{
    recommendedAssignments: any[];
    minimumStaffMet: boolean;
    optimizationSuggestions: string[];
    staffAvailability: any;
  }> {
    const operation = await this.operationRepository.findOne({
      where: { id: operationId },
      relations: ['station']
    });

    if (!operation) {
      throw new BadRequestException('Operación no encontrada');
    }

    if (!operation.station) {
      throw new BadRequestException('La operación no tiene una estación asignada');
    }

    // Calcular personal mínimo requerido basado en la operación
    const baseStaff = this.calculateBaseStaffRequirement(operation);
    const minimumStaff = Math.max(operation.station.minimumStaff || 0, baseStaff);

    // Obtener personal disponible
    const availableStaff = await this.userRepository.find({
      where: {
        stationId: operation.station.id,
        isActive: true,
        isAvailable: true
      }
    });

    // Verificar si hay suficiente personal
    const minimumStaffMet = availableStaff.length >= minimumStaff;
    
    const optimizationSuggestions: string[] = [];
    
    if (!minimumStaffMet) {
      const shortage = minimumStaff - availableStaff.length;
      optimizationSuggestions.push(`Faltan ${shortage} empleados para cumplir el mínimo requerido`);
      optimizationSuggestions.push('Considera las siguientes opciones:');
      optimizationSuggestions.push('• Contratar personal temporal o de refuerzo');
      optimizationSuggestions.push('• Reasignar personal de otras estaciones temporalmente');
      optimizationSuggestions.push('• Reprogramar la operación para cuando haya más personal disponible');
      optimizationSuggestions.push('• Revisar si algún empleado puede trabajar horas extra');
    }

    // Generar recomendaciones de asignación basadas en habilidades y experiencia
    const recommendedAssignments = this.generateStaffRecommendations(availableStaff, operation);

    return {
      recommendedAssignments,
      minimumStaffMet,
      optimizationSuggestions,
      staffAvailability: {
        available: availableStaff.length,
        required: minimumStaff,
        shortage: Math.max(0, minimumStaff - availableStaff.length)
      }
    };
  }

  private calculateBaseStaffRequirement(operation: Operation): number {
    // Lógica base para calcular personal requerido según tipo de operación
    let baseStaff = 2; // Mínimo por defecto

    // Ajustar según el tipo de vuelo
    if (operation.flightType === 'INTERNATIONAL') {
      baseStaff += 2; // Vuelos internacionales requieren más personal
    }

    // Ajustar según número de pasajeros
    if (operation.passengerCount) {
      if (operation.passengerCount > 200) {
        baseStaff += 2;
      } else if (operation.passengerCount > 100) {
        baseStaff += 1;
      }
    }

    return baseStaff;
  }

  private generateStaffRecommendations(availableStaff: User[], operation: Operation): any[] {
    return availableStaff.map(staff => ({
      userId: staff.id,
      name: staff.name,
      role: staff.role,
      skills: staff.skills || [],
      certifications: staff.certifications || [],
      recommendationScore: this.calculateRecommendationScore(staff, operation),
      recommendedPosition: this.getRecommendedPosition(staff, operation)
    })).sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  private calculateRecommendationScore(staff: User, operation: Operation): number {
    let score = 0;

    // Puntuación base por rol
    switch (staff.role) {
      case UserRole.SUPERVISOR:
        score += 10;
        break;
      case UserRole.EMPLOYEE:
        score += 5;
        break;
    }

    // Bonificación por certificaciones relevantes
    if (staff.certifications?.length > 0) {
      score += staff.certifications.length * 2;
    }

    // Bonificación por habilidades
    if (staff.skills?.length > 0) {
      score += staff.skills.length;
    }

    return score;
  }

  private getRecommendedPosition(staff: User, operation: Operation): string {
    if (staff.role === UserRole.SUPERVISOR) {
      return 'Líder de operación';
    }
    
    if (staff.skills?.includes('equipaje')) {
      return 'Manejo de equipaje';
    }
    
    if (staff.skills?.includes('pasajeros')) {
      return 'Atención a pasajeros';
    }
    
    return 'Soporte general';
  }

  /**
   * Obtiene la disponibilidad real del personal basada en operaciones actuales y estado de empleados
   */
  async getRealStaffAvailability(operationId?: number, date?: string): Promise<any> {
    try {
      const now = new Date();
      const targetDate = date ? new Date(date) : now;
      
      // Obtener todos los usuarios activos
      const allUsers = await this.userRepository.find({
        where: { 
          isActive: true,
          role: In([UserRole.EMPLOYEE, UserRole.SUPERVISOR, UserRole.MANAGER])
        }
      });

      // Obtener todas las estaciones para mapear nombres
      const allStations = await this.stationRepository.find();
      const stationMap = new Map(allStations.map(station => [station.id, station.name]));

      // Obtener todas las operaciones activas para hoy
      const todayStart = new Date(targetDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(targetDate);
      todayEnd.setHours(23, 59, 59, 999);

      const activeOperations = await this.operationRepository.find({
        where: {
          scheduledTime: Between(todayStart, todayEnd),
          status: In(['SCHEDULED', 'IN_PROGRESS'])
        }
      });

      // Obtener asignaciones activas
      const activeAssignments = await this.assignmentRepository.find({
        where: {
          startTime: LessThanOrEqual(now),
          endTime: MoreThanOrEqual(now),
          status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED, AssignmentStatus.IN_PROGRESS])
        },
        relations: ['user', 'operation']
      });

      // Calcular disponibilidad para cada usuario
      const availabilityData = await Promise.all(allUsers.map(async (user) => {
        const userAssignments = activeAssignments.filter(a => a.user.id === user.id);
        const isCurrentlyWorking = userAssignments.length > 0;
        
        // Calcular horas trabajadas esta semana
        const weekStart = new Date(targetDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weeklyAssignments = await this.assignmentRepository.find({
          where: {
            user: { id: user.id },
            startTime: Between(weekStart, weekEnd),
            status: In([AssignmentStatus.CONFIRMED, AssignmentStatus.IN_PROGRESS, AssignmentStatus.COMPLETED])
          }
        });

        const weeklyHours = weeklyAssignments.reduce((total, assignment) => {
          const duration = (assignment.endTime.getTime() - assignment.startTime.getTime()) / (1000 * 60 * 60);
          return total + duration;
        }, 0);

        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          stationId: user.stationId,
          stationName: user.stationId ? (stationMap.get(user.stationId) || 'Estación desconocida') : 'Sin estación',
          isAvailable: user.isAvailable && !isCurrentlyWorking && weeklyHours < (user.maxWeeklyHours || 40),
          isCurrentlyWorking,
          currentAssignments: userAssignments.map(a => ({
            operationId: a.operation.id,
            operationType: a.operation.type,
            startTime: a.startTime,
            endTime: a.endTime
          })),
          weeklyHours,
          maxWeeklyHours: user.maxWeeklyHours || 40,
          skills: user.skills || [],
          certifications: user.certifications || [],
          availability: user.isAvailable && !isCurrentlyWorking && weeklyHours < (user.maxWeeklyHours || 40) ? 'available' : 
                      isCurrentlyWorking ? 'working' : 'unavailable'
        };
      }));

      // Contar disponibilidad por estado
      const availableCount = availabilityData.filter(u => u.availability === 'available').length;
      const workingCount = availabilityData.filter(u => u.availability === 'working').length;
      const unavailableCount = availabilityData.filter(u => u.availability === 'unavailable').length;

      return {
        totalStaff: allUsers.length,
        availableStaff: availableCount,
        workingStaff: workingCount,
        unavailableStaff: unavailableCount,
        activeOperations: activeOperations.length,
        staffDetails: availabilityData,
        optimizationSuggestions: this.generateOptimizationSuggestions(availabilityData, activeOperations)
      };

    } catch (error) {
      console.error('❌ Error getting real staff availability:', error);
      throw new Error('Error al obtener disponibilidad real del personal');
    }
  }

  /**
   * Genera sugerencias de optimización basadas en disponibilidad actual
   */
  private generateOptimizationSuggestions(staffData: any[], operations: any[]): any[] {
    const suggestions: any[] = [];
    
    const availableStaff = staffData.filter(s => s.availability === 'available');
    const workingStaff = staffData.filter(s => s.availability === 'working');
    
    if (availableStaff.length > operations.length * 2) {
      suggestions.push({
        type: 'efficiency',
        message: `Hay ${availableStaff.length} empleados disponibles pero solo ${operations.length} operaciones activas. Considere redistribuir turnos.`,
        priority: 'medium'
      });
    }

    if (workingStaff.length > availableStaff.length * 2) {
      suggestions.push({
        type: 'workload',
        message: 'Alta carga de trabajo actual. Considere activar personal de reserva.',
        priority: 'high'
      });
    }

    // Verificar disponibilidad por estación
    const stationStats = staffData.reduce((acc, staff) => {
      const stationId = staff.stationId || 'unassigned';
      if (!acc[stationId]) {
        acc[stationId] = { available: 0, working: 0, total: 0 };
      }
      acc[stationId].total++;
      if (staff.availability === 'available') acc[stationId].available++;
      if (staff.availability === 'working') acc[stationId].working++;
      return acc;
    }, {});

    Object.entries(stationStats).forEach(([stationId, stats]: [string, any]) => {
      if (stats.available === 0 && stats.working > 0) {
        suggestions.push({
          type: 'station_coverage',
          message: `Estación ${stationId}: Sin personal de respaldo disponible`,
          priority: 'high'
        });
      }
    });

    return suggestions;
  }

  // Métodos privados auxiliares
  private async checkOverlappingAssignments(
    userId: number,
    startTime: Date,
    endTime: Date
  ): Promise<Assignment[]> {
    return this.assignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.userId = :userId', { userId })
      .andWhere('assignment.status IN (:...statuses)', {
        statuses: [AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED, AssignmentStatus.IN_PROGRESS]
      })
      .andWhere(
        '(assignment.startTime < :endTime AND assignment.endTime > :startTime)',
        { startTime, endTime }
      )
      .getMany();
  }

  private async calculateWeeklyHours(userId: number, referenceDate: Date): Promise<number> {
    const startOfWeek = new Date(referenceDate);
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
      const duration = (assignment.endTime.getTime() - assignment.startTime.getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
  }

  private getShiftType(date: Date): ShiftType {
    const hour = date.getHours();
    
    if (hour >= 6 && hour < 14) return ShiftType.MORNING;
    if (hour >= 14 && hour < 22) return ShiftType.AFTERNOON;
    if (hour >= 22 || hour < 2) return ShiftType.NIGHT;
    return ShiftType.DAWN;
  }

  private getRequiredSkillsForOperation(operation: Operation): string[] {
    const skills: string[] = [];
    
    // Basado en el tipo de vuelo
    if (operation.flightType === 'INTERNATIONAL') {
      skills.push('customs_handling', 'international_procedures');
    }
    
    // Basado en el número de pasajeros
    if (operation.passengerCount > 200) {
      skills.push('large_aircraft_handling', 'crowd_management');
    }
    
    // Basado en el tipo de operación
    if (operation.type === 'DEPARTURE') {
      skills.push('departure_procedures', 'baggage_loading');
    } else {
      skills.push('arrival_procedures', 'baggage_unloading');
    }
    
    return skills;
  }
}
