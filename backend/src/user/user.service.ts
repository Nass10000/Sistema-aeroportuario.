import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOneBy({ 
      email: createUserDto.email 
    });
    
    if (existingUser) {
      throw new ConflictException('El email ya está registrado en el sistema');
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
      if (error instanceof ConflictException) {
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
}
