import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from './station.entity';
import { CreateStationDto } from '../dto/create-station.dto';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async create(createStationDto: CreateStationDto): Promise<Station> {
    // Verificar si el nombre ya existe
    const existingByName = await this.stationRepository.findOneBy({ 
      name: createStationDto.name 
    });
    
    if (existingByName) {
      throw new ConflictException('Ya existe una estación con ese nombre');
    }

    // Verificar si el código ya existe (si se proporciona)
    if (createStationDto.code) {
      const existingByCode = await this.stationRepository.findOneBy({ 
        code: createStationDto.code 
      });
      
      if (existingByCode) {
        throw new ConflictException('Ya existe una estación con ese código');
      }
    }

    // Validar que el personal mínimo no sea mayor al máximo
    if (createStationDto.minimumStaff > createStationDto.maximumStaff) {
      throw new BadRequestException('El personal mínimo no puede ser mayor al personal máximo');
    }

    try {
      const station = this.stationRepository.create(createStationDto);
      return await this.stationRepository.save(station);
    } catch (error) {
      throw new BadRequestException('Error al crear la estación: ' + error.message);
    }
  }

  async findAll(): Promise<Station[]> {
    return await this.stationRepository.find();
  }

  async findOne(id: number): Promise<Station> {
    const station = await this.stationRepository.findOneBy({ id });
    if (!station) {
      throw new NotFoundException(`Estación con ID ${id} no encontrada`);
    }
    return station;
  }

  async remove(id: number): Promise<void> {
    const station = await this.findOne(id); // Esto ya lanza NotFoundException si no existe
    await this.stationRepository.delete(id);
  }
}
