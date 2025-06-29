import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
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
return await this.assignmentRepository.save(assignment);

      
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
