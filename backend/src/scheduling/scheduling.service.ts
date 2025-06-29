import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Assignment, AssignmentStatus } from '../assignment/assignment.entity';
import { User } from '../user/user.entity';
import { ShiftType } from '../common/enums/roles.enum';
import { Operation } from '../operation/operation.entity';
import { NotificationService } from '../notification/notification.service';

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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

    // Validar duración máxima diaria
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (duration > user.maxDailyHours) {
      errors.push(`La duración excede las horas máximas diarias (${user.maxDailyHours}h)`);
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
    if (weeklyHours + duration > user.maxWeeklyHours) {
      warnings.push(`La asignación superará las horas semanales máximas (${user.maxWeeklyHours}h)`);
    }

    // Verificar disponibilidad de turno
    const shiftType = this.getShiftType(startTime);
    if (!user.availableShifts?.includes(shiftType)) {
      warnings.push(`El empleado no está disponible para turnos ${shiftType}`);
    }

    // Verificar certificaciones requeridas
    if (operation.station.requiredCertifications.length > 0) {
      const missingCertifications = operation.station.requiredCertifications.filter(
        cert => !(user.certifications || []).includes(cert)
      );
      
      if (missingCertifications.length > 0) {
        errors.push(`El empleado no tiene las certificaciones requeridas: ${missingCertifications.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
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

    // Filtrar por habilidades requeridas
    if (requiredSkills.length > 0) {
      query.andWhere('user.skills && :skills', { skills: requiredSkills });
    }

    // Filtrar por certificaciones requeridas de la estación
    if (operation.station.requiredCertifications.length > 0) {
      query.andWhere('user.certifications && :certifications', {
        certifications: operation.station.requiredCertifications
      });
    }

    const users = await query.getMany();

    // Filtrar por disponibilidad de horario
    const shiftType = this.getShiftType(operation.scheduledTime);
    const availableUsers = users.filter(user => 
      user.availableShifts?.includes(shiftType) || false
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
