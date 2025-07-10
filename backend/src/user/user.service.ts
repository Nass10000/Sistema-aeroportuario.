import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Station } from '../station/station.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../common/enums/roles.enum';
import { AssignmentStatus } from '../assignment/assignment.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOneBy({ 
      email: createUserDto.email 
    });
    
    if (existingUser) {
      throw new ConflictException('El email ya está registrado en el sistema');
    }

    // Validar que los empleados, supervisores y managers tengan estación asignada
    // Solo presidentes y administradores pueden no tener estación (admin maneja todo el sistema)
    if (createUserDto.role !== UserRole.PRESIDENT && 
        createUserDto.role !== UserRole.ADMIN && 
        !createUserDto.stationId) {
      throw new BadRequestException('Los empleados, supervisores y managers deben tener una estación asignada');
    }

    try {
      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
      
      // Crear el usuario con la contraseña encriptada
      const userData = {
        ...createUserDto,
        password: hashedPassword,
      };
      
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      
      // Remover la contraseña de la respuesta
      const { password, ...userResponse } = savedUser;
      return userResponse as User;
      
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear el usuario: ' + error.message);
    }
  }

  async findAll(currentUser?: any): Promise<User[]> {
    if (!currentUser) {
      return this.userRepository.find();
    }

    // El PRESIDENT puede ver todos los usuarios
    if (currentUser.role === UserRole.PRESIDENT) {
      return this.userRepository.find();
    }

    // El MANAGER solo puede ver usuarios de su estación
    if (currentUser.role === UserRole.MANAGER) {
      return this.userRepository.find({
        where: { stationId: currentUser.stationId }
      });
    }

    // El SUPERVISOR solo puede ver su equipo
    if (currentUser.role === UserRole.SUPERVISOR) {
      return this.userRepository.find({
        where: { 
          supervisorId: currentUser.userId,
          role: UserRole.EMPLOYEE 
        }
      });
    }

    // Los EMPLOYEE solo pueden ver su propia información
    if (currentUser.role === UserRole.EMPLOYEE) {
      return this.userRepository.find({
        where: { id: currentUser.userId }
      });
    }

    // ADMIN puede ver todos los usuarios
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string) {
    try {
      this.logger.log(`Searching for user with email: ${email}`);
      const user = await this.userRepository.findOneBy({ email });
      
      if (user) {
        this.logger.log(`User found with email: ${email}, id: ${user.id}, role: ${user.role}`);
      } else {
        this.logger.warn(`No user found with email: ${email}`);
      }
      
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  async count(): Promise<number> {
    try {
      return await this.userRepository.count();
    } catch (error) {
      this.logger.error(`Error counting users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async initializeTestUsers(): Promise<void> {
    // Verificar si ya existen usuarios de prueba
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      return; // Ya hay usuarios, no crear más
    }

    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@aereo.com',
        password: 'Admin123!',
        role: UserRole.MANAGER,
      },
      {
        name: 'Manager User',
        email: 'manager@aereo.com',
        password: 'Manager123!',
        role: UserRole.SUPERVISOR,
      },
      {
        name: 'Employee User',
        email: 'employee@aereo.com',
        password: 'Employee123!',
        role: UserRole.EMPLOYEE,
      },
    ];

    for (const userData of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = this.userRepository.create({
          ...userData,
          password: hashedPassword,
        });
        await this.userRepository.save(user);
        console.log(`✅ Usuario de prueba creado: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️  Error creando usuario ${userData.email}:`, error.message);
      }
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any): Promise<User> {
    console.log('🔵 UserService: actualizando usuario', id, 'con datos:', updateUserDto);
    console.log('🔵 UserService: usuario actual:', {
      id: currentUser?.id || currentUser?.userId,
      role: currentUser?.role,
      email: currentUser?.email,
      stationId: currentUser?.stationId
    });

    // Verificar si el usuario existe
    const existingUser = await this.userRepository.findOneBy({ id });
    if (!existingUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    console.log('🔵 UserService: usuario existente:', {
      id: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
      stationId: existingUser.stationId
    });

    // Restricciones por rol
    if (currentUser) {
      console.log('🔵 UserService: validando permisos para rol:', currentUser.role);

      // ADMIN: puede editar cualquier usuario excepto PRESIDENT
      if (currentUser.role === UserRole.ADMIN) {
        console.log('🔵 UserService: usuario es ADMIN, verificando restricciones');
        if (existingUser.role === UserRole.PRESIDENT) {
          throw new ConflictException('Los administradores no pueden editar información del Presidente');
        }
        if (updateUserDto.role === UserRole.PRESIDENT) {
          throw new ConflictException('Los administradores no pueden asignar el rol de Presidente');
        }
      }

      // MANAGER: puede editar empleados y supervisores de su estación y cambiar roles
      if (currentUser.role === UserRole.MANAGER) {
        console.log('🔵 UserService: usuario es MANAGER, verificando restricciones');
        
        // Verificar que el usuario a editar pertenece a su estación o no tiene estación (para poder asignarle una)
        if (existingUser.stationId && existingUser.stationId !== currentUser.stationId) {
          throw new ConflictException(`Los gerentes solo pueden editar usuarios de su estación. Usuario objetivo tiene estación ${existingUser.stationId}, manager tiene estación ${currentUser.stationId}`);
        }
        
        // Verificar que solo edita empleados y supervisores
        if (existingUser.role !== UserRole.EMPLOYEE && existingUser.role !== UserRole.SUPERVISOR) {
          throw new ConflictException(`Los gerentes solo pueden editar empleados y supervisores. El usuario objetivo tiene rol: ${existingUser.role}`);
        }
        
        // Manager puede cambiar roles pero no a niveles superiores
        if (updateUserDto.role && [UserRole.MANAGER, UserRole.ADMIN, UserRole.PRESIDENT].includes(updateUserDto.role)) {
          throw new ConflictException(`Los gerentes no pueden asignar roles de gerente, administrador o presidente. Rol solicitado: ${updateUserDto.role}`);
        }
      }

      // PRESIDENT: solo puede visualizar (no editar)
      if (currentUser.role === UserRole.PRESIDENT) {
        throw new ConflictException('El Presidente solo tiene permisos de visualización');
      }
    }

    // Validar que empleados, supervisores y managers tengan estación asignada
    if (updateUserDto.role && 
        updateUserDto.role !== UserRole.PRESIDENT && 
        updateUserDto.role !== UserRole.ADMIN && 
        !updateUserDto.stationId && 
        !existingUser.stationId) {
      throw new BadRequestException('Los empleados, supervisores y gerentes deben tener una estación asignada');
    }

    // Si se envía stationId en la actualización, está bien (aunque el usuario existente no la tenga)
    if (updateUserDto.stationId) {
      console.log('🔵 UserService: asignando estación', updateUserDto.stationId, 'al usuario');
    }

    // Validar email único
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findOneBy({
        email: updateUserDto.email,
      });
      if (userWithEmail) {
        throw new ConflictException('El email ya está registrado por otro usuario');
      }
    }

    try {
      // Encriptar contraseña si se proporciona
      const updateData = { ...updateUserDto };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }

      // Convertir category a categories si se envía
      if (updateData.category) {
        updateData.categories = [updateData.category];
        delete updateData.category;
        console.log('🔵 UserService: convirtiendo category a categories:', updateData.categories);
      }

      // Validar que categories sea un array si se envía
      if (updateData.categories && !Array.isArray(updateData.categories)) {
        updateData.categories = [updateData.categories];
        console.log('🔵 UserService: convirtiendo categories a array:', updateData.categories);
      }

      console.log('🔵 UserService: datos finales a actualizar:', updateData);

      // Actualizar el usuario
      await this.userRepository.update(id, updateData);

      // Obtener el usuario actualizado
      const updatedUser = await this.userRepository.findOneBy({ id });

      if (!updatedUser) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
      }

      console.log('✅ UserService: usuario actualizado exitosamente');
      // Remover la contraseña de la respuesta
      const { password, ...userResponse } = updatedUser;
      return userResponse as User;
    } catch (error) {
      console.error('❌ UserService: error al actualizar usuario:', error);
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el usuario: ' + error.message);
    }
  }

  // Nuevos métodos para gestión de asignación de estaciones
  async assignStation(userId: number, stationId: number, currentUser: any): Promise<User> {
    this.logger.log(`🔧 Iniciando asignación de estación: userId=${userId}, stationId=${stationId}, currentUser=${currentUser.email}`);
    
    // Verificar que el usuario existe
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      this.logger.error(`❌ Usuario con ID ${userId} no encontrado`);
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    this.logger.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);

    // Verificar que la estación existe
    const station = await this.stationRepository.findOne({
      where: { id: stationId },
      relations: ['manager']
    });
    if (!station) {
      this.logger.error(`❌ Estación con ID ${stationId} no encontrada`);
      throw new NotFoundException(`Estación con ID ${stationId} no encontrada`);
    }
    this.logger.log(`✅ Estación encontrada: ${station.name}`);

    // Verificar permisos basados en roles
    try {
      await this.validateStationAssignmentPermissions(currentUser, user, station);
      this.logger.log(`✅ Permisos validados correctamente`);
    } catch (error) {
      this.logger.error(`❌ Error de permisos: ${error.message}`);
      throw error;
    }

    // Verificar disponibilidad de personal mínimo antes de la asignación
    try {
      await this.checkMinimumStaffRequirement(stationId, userId);
      this.logger.log(`✅ Requisitos de personal mínimo validados`);
    } catch (error) {
      this.logger.error(`❌ Error en requisitos de personal: ${error.message}`);
      throw error;
    }

    try {
      // Asignar la estación
      await this.userRepository.update(userId, { stationId });
      this.logger.log(`✅ Usuario actualizado en base de datos`);

      // Obtener el usuario actualizado
      const updatedUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['managedStations']
      });

      if (!updatedUser) {
        this.logger.error(`❌ Usuario no encontrado después de la actualización`);
        throw new NotFoundException('Usuario no encontrado después de la actualización');
      }

      this.logger.log(`✅ Estación ${stationId} asignada al usuario ${userId} por ${currentUser.email}`);
      
      // Remover la contraseña de la respuesta
      const { password, ...userResponse } = updatedUser;
      return userResponse as User;
    } catch (error) {
      this.logger.error(`❌ Error al asignar estación: ${error.message}`);
      throw new BadRequestException('Error al asignar la estación: ' + error.message);
    }
  }

  async removeStationAssignment(userId: number, currentUser: any): Promise<User> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Solo ADMIN puede remover asignaciones
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden remover asignaciones de estación');
    }

    // Verificar que no se quede sin personal mínimo
    if (user.stationId) {
      await this.checkMinimumStaffRequirement(user.stationId, userId, true);
    }

    try {
      // Remover la asignación de estación
      await this.userRepository.update(userId, { stationId: undefined });

      // Obtener el usuario actualizado
      const updatedUser = await this.userRepository.findOneBy({ id: userId });

      if (!updatedUser) {
        throw new NotFoundException('Usuario no encontrado después de la actualización');
      }

      this.logger.log(`Asignación de estación removida del usuario ${userId} por ${currentUser.email}`);
      
      // Remover la contraseña de la respuesta
      const { password, ...userResponse } = updatedUser;
      return userResponse as User;
    } catch (error) {
      this.logger.error(`Error al remover asignación de estación: ${error.message}`);
      throw new BadRequestException('Error al remover la asignación de estación: ' + error.message);
    }
  }

  private async validateStationAssignmentPermissions(currentUser: any, targetUser: User, station: Station): Promise<void> {
    // Solo ADMIN puede asignar estaciones
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden asignar estaciones');
    }
  }

  private async checkMinimumStaffRequirement(stationId: number, userId: number, isRemoving: boolean = false): Promise<void> {
    // Obtener la estación con configuración de personal mínimo
    const station = await this.stationRepository.findOneBy({ id: stationId });
    if (!station || !station.minimumStaff) {
      return; // Si no hay configuración, no validar
    }

    // Contar personal actual asignado a la estación
    let currentStaffCount: number;
    
    if (isRemoving) {
      // Excluir el usuario que se va a remover del conteo
      currentStaffCount = await this.userRepository
        .createQueryBuilder('user')
        .where('user.stationId = :stationId', { stationId })
        .andWhere('user.isActive = :isActive', { isActive: true })
        .andWhere('user.id != :userId', { userId })
        .getCount();
    } else {
      currentStaffCount = await this.userRepository.count({
        where: { 
          stationId: stationId,
          isActive: true
        }
      });
    }

    const effectiveStaffCount = isRemoving ? currentStaffCount : currentStaffCount + 1;

    if (isRemoving && effectiveStaffCount < station.minimumStaff) {
      throw new BadRequestException(
        `No se puede remover la asignación. La estación requiere un mínimo de ${station.minimumStaff} empleados y solo quedarían ${effectiveStaffCount}`
      );
    }

    this.logger.log(`Estación ${stationId}: Personal actual: ${currentStaffCount}, Mínimo requerido: ${station.minimumStaff}`);
  }

  // Método para verificar disponibilidad de personal para operaciones
  async checkStaffAvailabilityForOperation(stationId: number, requiredStaff: number, operationDate: Date): Promise<{
    hasEnoughStaff: boolean;
    availableStaff: number;
    suggestions: string[];
  }> {
    try {
      // Verificar que la estación existe
      const station = await this.stationRepository.findOneBy({ id: stationId });
      if (!station) {
        throw new NotFoundException(`Estación con ID ${stationId} no encontrada`);
      }

      // Obtener todo el personal asignado a la estación
      const stationStaff = await this.userRepository.find({
        where: {
          stationId: stationId,
          isActive: true
        },
        relations: ['assignments']
      });

      this.logger.log(`Verificando disponibilidad para estación ${stationId} en fecha ${operationDate.toISOString()}`);
      this.logger.log(`Personal total en estación: ${stationStaff.length}`);

      // Definir el rango de tiempo para la operación (asumiendo un turno de 8 horas)
      const startOfDay = new Date(operationDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(operationDate);
      endOfDay.setHours(23, 59, 59, 999);

      let availableStaff = 0;
      const unavailableReasons: string[] = [];

      for (const staff of stationStaff) {
        // Verificar disponibilidad general
        if (!staff.isAvailable) {
          unavailableReasons.push(`${staff.name}: No disponible (marcado como no disponible)`);
          continue;
        }

        // Verificar asignaciones conflictivas en el día
        const conflictingAssignments = staff.assignments?.filter(assignment => {
          const assignmentStart = new Date(assignment.startTime);
          const assignmentEnd = new Date(assignment.endTime);
          
          return (
            assignment.status !== AssignmentStatus.CANCELLED &&
            assignment.status !== AssignmentStatus.COMPLETED &&
            assignmentStart <= endOfDay &&
            assignmentEnd >= startOfDay
          );
        }) || [];

        if (conflictingAssignments.length > 0) {
          unavailableReasons.push(`${staff.name}: Ya tiene ${conflictingAssignments.length} asignaciones ese día`);
          continue;
        }

        // Verificar horas semanales (simplificado: asumiendo que no está en el límite)
        const maxWeeklyHours = staff.maxWeeklyHours || 40;
        const maxDailyHours = staff.maxDailyHours || 8;

        // Si llega aquí, está disponible
        availableStaff++;
      }

      const hasEnoughStaff = availableStaff >= requiredStaff;
      const suggestions: string[] = [];

      this.logger.log(`Personal disponible: ${availableStaff}/${stationStaff.length}, Requerido: ${requiredStaff}`);

      if (!hasEnoughStaff) {
        const shortage = requiredStaff - availableStaff;
        suggestions.push(`Se necesitan ${shortage} empleados adicionales para esta operación`);
        
        if (unavailableReasons.length > 0) {
          suggestions.push(`Personal no disponible: ${unavailableReasons.slice(0, 3).join(', ')}${unavailableReasons.length > 3 ? '...' : ''}`);
        }

        suggestions.push('Considera reasignar personal de otras estaciones');
        suggestions.push('Evalúa reprogramar la operación para otro momento');
        suggestions.push(`La estación requiere mínimo ${station.minimumStaff} personal permanente`);
      } else {
        suggestions.push(`Personal suficiente disponible (${availableStaff} de ${requiredStaff} requeridos)`);
        if (availableStaff > requiredStaff) {
          suggestions.push(`Hay ${availableStaff - requiredStaff} empleados adicionales disponibles para flexibilidad`);
        }
      }

      return {
        hasEnoughStaff,
        availableStaff,
        suggestions
      };
    } catch (error) {
      this.logger.error(`Error al verificar disponibilidad de personal: ${error.message}`);
      return {
        hasEnoughStaff: false,
        availableStaff: 0,
        suggestions: [`Error al verificar disponibilidad: ${error.message}`]
      };
    }
  }
}
