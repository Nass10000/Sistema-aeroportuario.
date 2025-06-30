import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../common/enums/roles.enum';
import { User } from '../user/user.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    try {
      // Validar que las fechas sean lógicas
      const startDate = new Date(createAssignmentDto.startTime);
      const endDate = new Date(createAssignmentDto.endTime);
      
      if (startDate >= endDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      if (startDate < new Date()) {
        throw new BadRequestException('La fecha de inicio no puede ser en el pasado');
      }
      
      // Verificar conflictos de horarios para el usuario
      const conflictingAssignment = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.userId = :userId', { userId: createAssignmentDto.userId })
        .andWhere('assignment.startTime < :endTime', { endTime: createAssignmentDto.endTime })
        .andWhere('assignment.endTime > :startTime', { startTime: createAssignmentDto.startTime })
        .getOne();
      
      if (conflictingAssignment) {
        throw new ConflictException('El usuario ya tiene una asignación en ese horario');
      }
      
      const assignment = this.assignmentRepository.create({
        ...createAssignmentDto,
        user: { id: createAssignmentDto.userId },
        operation: { id: createAssignmentDto.operationId },
      });
      const savedAssignment = await this.assignmentRepository.save(assignment);

      // Obtener la asignación completa con relaciones para crear notificación detallada
      const completeAssignment = await this.assignmentRepository.findOne({
        where: { id: savedAssignment.id },
        relations: ['operation', 'user']
      });

      if (!completeAssignment) {
        throw new NotFoundException(`Asignación creada no encontrada`);
      }

      // Formatear fechas para la notificación
      const assignmentStartDate = new Date(completeAssignment.startTime);
      const assignmentEndDate = new Date(completeAssignment.endTime);
      const formatDate = (date: Date) => {
        return date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Crear mensaje detallado de la notificación
      const notificationTitle = 'Nueva Asignación de Trabajo';
      const notificationMessage = `Se te ha asignado la función de ${completeAssignment.function} para el vuelo ${completeAssignment.operation.flightNumber} (${completeAssignment.operation.origin} → ${completeAssignment.operation.destination}). Horario: ${formatDate(assignmentStartDate)} a ${formatDate(assignmentEndDate)}.`;

      // Crear notificación para el empleado asignado
      await this.notificationService.create(
        notificationTitle,
        notificationMessage,
        NotificationType.ASSIGNMENT,
        completeAssignment.user, // sender - por ahora el mismo usuario
        completeAssignment.user, // recipient
        undefined, // priority (opcional, usa el valor por defecto)
        { 
          assignmentId: savedAssignment.id,
          flightNumber: completeAssignment.operation.flightNumber,
          origin: completeAssignment.operation.origin,
          destination: completeAssignment.operation.destination,
          function: completeAssignment.function,
          startTime: completeAssignment.startTime,
          endTime: completeAssignment.endTime
        }
      );

      // Emitir notificación en tiempo real (WebSocket) con información adicional
      this.notificationGateway.emitToUser(
        createAssignmentDto.userId,
        'new-assignment',
        { 
          assignmentId: savedAssignment.id,
          title: notificationTitle,
          message: notificationMessage,
          assignment: completeAssignment,
          metadata: {
            assignmentId: savedAssignment.id,
            flightNumber: completeAssignment.operation.flightNumber,
            origin: completeAssignment.operation.origin,
            destination: completeAssignment.operation.destination,
            function: completeAssignment.function,
            startTime: completeAssignment.startTime,
            endTime: completeAssignment.endTime
          }
        }
      );

      return savedAssignment;
      
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la asignación: ' + error.message);
    }
  }

  async findAll(): Promise<Assignment[]> {
    return this.assignmentRepository.find({ 
      relations: ['operation', 'user'],
      order: { startTime: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Assignment> {
    const assignment = await this.assignmentRepository.findOne({ 
      where: { id }, 
      relations: ['operation', 'user'] 
    });
    
    if (!assignment) {
      throw new NotFoundException(`Asignación con ID ${id} no encontrada`);
    }
    
    return assignment;
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    const assignment = await this.findOne(id);
    
    try {
      // Validar fechas si se están actualizando
      if (updateAssignmentDto.startTime && updateAssignmentDto.endTime) {
        const startDate = new Date(updateAssignmentDto.startTime);
        const endDate = new Date(updateAssignmentDto.endTime);
        
        if (startDate >= endDate) {
          throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
        }
      }
      
      await this.assignmentRepository.update(id, updateAssignmentDto);
      return this.findOne(id);
      
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la asignación: ' + error.message);
    }
  }

  async remove(id: number): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepository.remove(assignment);
  }
}
