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

      // Crear notificación para el empleado asignado
      // Ajusta el sender según tu lógica de negocio, aquí se deja como el mismo usuario asignado
      const user = await this.assignmentRepository.manager.findOne(User, { where: { id: createAssignmentDto.userId } });
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${createAssignmentDto.userId} no encontrado`);
      }
      await this.notificationService.create(
        'Nueva asignación',
        'Tienes una nueva asignación programada.',
        NotificationType.ASSIGNMENT,
        user, // sender (puedes cambiar esto por el usuario que corresponda)
        user, // recipient (User entity o al menos objeto con id)
        undefined, // priority (opcional, usa el valor por defecto)
        { assignmentId: savedAssignment.id }
      );

      // Emitir notificación en tiempo real (WebSocket)
      this.notificationGateway.emitToUser(
        createAssignmentDto.userId,
        'new-assignment',
        { assignmentId: savedAssignment.id }
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
