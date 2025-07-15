import { Controller, Post, Body, UseGuards, Request, UnauthorizedException, Get, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../common/enums/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto, description: 'Credenciales de acceso' })
  @ApiResponse({ status: 201, description: 'Login exitoso, token JWT retornado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
  @ApiResponse({ status: 429, description: 'Límite de intentos excedido' })
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        this.logger.warn(`Login failed for email: ${loginDto.email} - Invalid credentials`);
        throw new UnauthorizedException('Credenciales incorrectas');
      }
      
      const result = await this.authService.login(user);
      this.logger.log(`Login successful for email: ${loginDto.email}`);
      
      return result;
    } catch (error) {
      this.logger.error(`Login error for email: ${loginDto.email} - ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.PRESIDENT)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario',
    description: 'Solo supervisores, gerentes y presidentes pueden registrar nuevos usuarios'
  })
  @ApiBody({ type: CreateUserDto, description: 'Datos del nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o faltantes' })
  @ApiResponse({ status: 401, description: 'Token JWT requerido' })
  @ApiResponse({ status: 403, description: 'Sin permisos para registrar usuarios' })
  @ApiResponse({ status: 409, description: 'Email ya existe en el sistema' })
  async register(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check - verificar estado del servidor' })
  @ApiResponse({ status: 200, description: 'Servidor funcionando correctamente' })
  async health() {
    try {
      // Verificar conexión a la base de datos
      const userCount = await this.authService.getUserCount();
      
      return { 
        status: 'ok', 
        message: 'Backend AEO funcionando correctamente',
        database: 'connected',
        userCount: userCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'error',
        message: 'Error en la conexión a la base de datos',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('create-test-users')
  @ApiOperation({ summary: 'Crear usuarios de prueba (solo para desarrollo)' })
  @ApiResponse({ status: 201, description: 'Usuarios de prueba creados' })
  async createTestUsers() {
    try {
      this.logger.log('Creating test users...');
      
      // Crear usuarios de prueba básicos
      const testUsers = [
        {
          name: 'Admin User',
          email: 'admin@aereo.com',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'defaultpass',
          role: UserRole.MANAGER,
        },
        {
          name: 'Manager User', 
          email: 'manager@aereo.com',
          password: process.env.DEFAULT_MANAGER_PASSWORD || 'defaultpass',
          role: UserRole.SUPERVISOR,
        },
        {
          name: 'Employee User',
          email: 'employee@aereo.com',
          password: 'employee123',
          role: UserRole.EMPLOYEE,
        },
      ];

      const createdUsers: any[] = [];
      for (const userData of testUsers) {
        try {
          const created = await this.authService.register(userData);
          createdUsers.push({ email: userData.email, id: created.id });
          this.logger.log(`Test user created: ${userData.email}`);
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('ya está registrado')) {
            this.logger.log(`Test user already exists: ${userData.email}`);
            createdUsers.push({ email: userData.email, status: 'already exists' });
          } else {
            this.logger.error(`Error creating test user ${userData.email}: ${error.message}`);
            createdUsers.push({ email: userData.email, error: error.message });
          }
        }
      }

      return {
        message: 'Test users creation completed',
        users: createdUsers
      };
    } catch (error) {
      this.logger.error(`Error in createTestUsers: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('debug-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug - Verificar token JWT' })
  @ApiResponse({ status: 200, description: 'Token válido, información del usuario' })
  @ApiResponse({ status: 401, description: 'Token inválido o faltante' })
  async debugToken(@Request() req) {
    this.logger.log('Debug token endpoint accessed');
    return {
      message: 'Token válido',
      user: req.user,
      timestamp: new Date().toISOString()
    };
  }

  @Get('debug-roles')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug - Verificar roles' })
  @ApiResponse({ status: 200, description: 'Roles válidos' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async debugRoles(@Request() req) {
    this.logger.log('Debug roles endpoint accessed');
    return {
      message: 'Roles válidos',
      user: req.user,
      timestamp: new Date().toISOString()
    };
  }
}
