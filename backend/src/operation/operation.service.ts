import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Operation } from './operation.entity';
import { Station } from '../station/station.entity';
import { CreateOperationDto } from '../dto/create-operation.dto';

@Injectable()
export class OperationService {
  constructor(
    @InjectRepository(Operation)
    private operationRepository: Repository<Operation>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async create(createOperationDto: CreateOperationDto): Promise<Operation> {
    // Verificar que la estación existe
    const station = await this.stationRepository.findOneBy({ 
      id: createOperationDto.stationId 
    });
    
    if (!station) {
      throw new NotFoundException(`Estación con ID ${createOperationDto.stationId} no encontrada`);
    }

    // Validar que la fecha programada no sea en el pasado
    const scheduledTime = new Date(createOperationDto.scheduledTime);
    const now = new Date();
    
    if (scheduledTime < now) {
      throw new BadRequestException('La fecha programada no puede ser en el pasado');
    }

    // Verificar si ya existe una operación con el mismo número de vuelo en la misma fecha
    const existingOperation = await this.operationRepository.findOne({
      where: {
        flightNumber: createOperationDto.flightNumber,
        scheduledTime: scheduledTime,
      }
    });

    if (existingOperation) {
      throw new BadRequestException('Ya existe una operación con ese número de vuelo en la fecha especificada');
    }

    try {
      // Crear la operación usando any para evitar problemas de tipos por ahora
      const operationData: any = {
        name: createOperationDto.name,
        flightNumber: createOperationDto.flightNumber,
        origin: createOperationDto.origin,
        destination: createOperationDto.destination,
        scheduledTime,
        passengerCount: createOperationDto.passengerCount,
        type: createOperationDto.type,
        flightType: createOperationDto.flightType,
        status: createOperationDto.status,
        station,
      };
      
      return await this.operationRepository.save(operationData);
    } catch (error) {
      throw new BadRequestException('Error al crear la operación: ' + error.message);
    }
  }

  async findAll(): Promise<Operation[]> {
    return await this.operationRepository.find({ 
      relations: ['station', 'assignments'] 
    });
  }

  async findOne(id: number): Promise<Operation> {
    const operation = await this.operationRepository.findOne({ 
      where: { id }, 
      relations: ['station', 'assignments'] 
    });
    
    if (!operation) {
      throw new NotFoundException(`Operación con ID ${id} no encontrada`);
    }
    
    return operation;
  }

  async remove(id: number): Promise<void> {
    const operation = await this.findOne(id); // Esto ya lanza NotFoundException si no existe
    await this.operationRepository.delete(id);
  }
}
