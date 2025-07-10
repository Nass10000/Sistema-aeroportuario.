import { DataSource } from 'typeorm';
import { Station } from '../src/station/station.entity';
import { User } from '../src/user/user.entity';
import { Assignment } from '../src/assignment/assignment.entity';
import { Operation } from '../src/operation/operation.entity';
import { Notification } from '../src/notification/notification.entity';
import { Punch } from '../src/punch/punch.entity';
import { StationType } from '../src/station/station.entity';
import { UserRole, EmployeeCategory } from '../src/common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

// Configuración de conexión a la base de datos
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'Nadar90100', 
  database: process.env.DB_DATABASE || 'aeo_db',
  entities: [Station, User, Assignment, Operation, Notification, Punch],
  synchronize: false,
  logging: true,
});

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('📡 Conexión a la base de datos establecida');

    const stationRepository = AppDataSource.getRepository(Station);
    const userRepository = AppDataSource.getRepository(User);

    // 1. Insertar estaciones
    console.log('🏢 Insertando estaciones...');
    
    const stations = [
      // Estaciones de Terminal
      { id: 1, name: 'Terminal A - Puerta 1', location: 'Terminal A, Ala Norte', type: StationType.TERMINAL, description: 'Puerta de embarque para vuelos domésticos', minimumStaff: 3, maximumStaff: 8, code: 'TA-G1' },
      { id: 2, name: 'Terminal A - Puerta 2', location: 'Terminal A, Ala Norte', type: StationType.TERMINAL, description: 'Puerta de embarque para vuelos domésticos', minimumStaff: 3, maximumStaff: 8, code: 'TA-G2' },
      { id: 3, name: 'Terminal A - Puerta 3', location: 'Terminal A, Ala Sur', type: StationType.TERMINAL, description: 'Puerta de embarque para vuelos internacionales', minimumStaff: 4, maximumStaff: 10, code: 'TA-G3' },
      { id: 4, name: 'Terminal A - Puerta 4', location: 'Terminal A, Ala Sur', type: StationType.TERMINAL, description: 'Puerta de embarque para vuelos internacionales', minimumStaff: 4, maximumStaff: 10, code: 'TA-G4' },
      { id: 5, name: 'Terminal B - Puerta 1', location: 'Terminal B, Ala Este', type: StationType.TERMINAL, description: 'Puerta principal para vuelos de carga', minimumStaff: 3, maximumStaff: 7, code: 'TB-G1' },

      // Estaciones de Plataforma
      { id: 6, name: 'Plataforma 1', location: 'Área de Tarmac Norte', type: StationType.PLATFORM, description: 'Plataforma de operaciones aéreas', minimumStaff: 5, maximumStaff: 12, code: 'PLAT-1' },
      { id: 7, name: 'Plataforma 2', location: 'Área de Tarmac Sur', type: StationType.PLATFORM, description: 'Plataforma de operaciones aéreas', minimumStaff: 5, maximumStaff: 12, code: 'PLAT-2' },
      { id: 8, name: 'Plataforma 3', location: 'Área de Tarmac Este', type: StationType.PLATFORM, description: 'Plataforma para aeronaves pesadas', minimumStaff: 6, maximumStaff: 15, code: 'PLAT-3' },

      // Estaciones de Carga
      { id: 9, name: 'Terminal de Carga A', location: 'Zona de Carga Norte', type: StationType.CARGO, description: 'Procesamiento de carga aérea nacional', minimumStaff: 4, maximumStaff: 10, code: 'CARGO-A' },
      { id: 10, name: 'Terminal de Carga B', location: 'Zona de Carga Sur', type: StationType.CARGO, description: 'Procesamiento de carga aérea internacional', minimumStaff: 5, maximumStaff: 12, code: 'CARGO-B' },
      { id: 11, name: 'Depósito de Carga', location: 'Zona de Almacenamiento', type: StationType.CARGO, description: 'Almacenamiento temporal de mercancías', minimumStaff: 3, maximumStaff: 8, code: 'DEPOT-1' },

      // Estaciones de Mantenimiento
      { id: 12, name: 'Hangar de Mantenimiento 1', location: 'Área Técnica Norte', type: StationType.MAINTENANCE, description: 'Mantenimiento preventivo de aeronaves', minimumStaff: 6, maximumStaff: 15, code: 'MAINT-1' },
      { id: 13, name: 'Hangar de Mantenimiento 2', location: 'Área Técnica Sur', type: StationType.MAINTENANCE, description: 'Reparaciones mayores de aeronaves', minimumStaff: 8, maximumStaff: 20, code: 'MAINT-2' },
      { id: 14, name: 'Taller de Componentes', location: 'Área Técnica Este', type: StationType.MAINTENANCE, description: 'Reparación de componentes electrónicos', minimumStaff: 4, maximumStaff: 10, code: 'COMP-1' },

      // Estaciones de Combustible
      { id: 15, name: 'Estación de Combustible 1', location: 'Área de Servicios Norte', type: StationType.FUEL, description: 'Suministro de combustible para aeronaves', minimumStaff: 3, maximumStaff: 8, code: 'FUEL-1' },
      { id: 16, name: 'Estación de Combustible 2', location: 'Área de Servicios Sur', type: StationType.FUEL, description: 'Suministro de combustible para aeronaves', minimumStaff: 3, maximumStaff: 8, code: 'FUEL-2' },

      // Estaciones de Seguridad
      { id: 17, name: 'Checkpoint de Seguridad A', location: 'Terminal A, Entrada Principal', type: StationType.SECURITY, description: 'Control de seguridad de pasajeros', minimumStaff: 6, maximumStaff: 15, code: 'SEC-A' },
      { id: 18, name: 'Checkpoint de Seguridad B', location: 'Terminal B, Entrada Principal', type: StationType.SECURITY, description: 'Control de seguridad de pasajeros', minimumStaff: 6, maximumStaff: 15, code: 'SEC-B' },
      { id: 19, name: 'Control de Equipajes', location: 'Área de Equipajes', type: StationType.SECURITY, description: 'Inspección de equipajes de bodega', minimumStaff: 4, maximumStaff: 10, code: 'BAG-1' },
      { id: 20, name: 'Torre de Control', location: 'Torre de Control Principal', type: StationType.SECURITY, description: 'Control de tráfico aéreo', minimumStaff: 2, maximumStaff: 5, code: 'TOWER-1' }
    ];

    for (const stationData of stations) {
      const existingStation = await stationRepository.findOne({ where: { id: stationData.id } });
      if (!existingStation) {
        const station = stationRepository.create({
          ...stationData,
          isActive: true,
          requiredCertifications: []
        });
        await stationRepository.save(station);
        console.log(`✅ Estación creada: ${stationData.name}`);
      } else {
        console.log(`⚠️ Estación ya existe: ${stationData.name}`);
      }
    }

    // 2. Insertar usuarios
    console.log('👥 Insertando usuarios...');

    const password = await bcrypt.hash('password123', 10);

    const users = [
      // Administradores (2)
      { id: 1, name: 'Carlos Rodríguez', email: 'carlos.admin@aeo1.com', role: UserRole.ADMIN },
      { id: 2, name: 'Ana Martínez', email: 'ana.admin@aeo1.com', role: UserRole.ADMIN },

      // Presidentes/Ejecutivos (1)
      { id: 3, name: 'Roberto Pérez', email: 'roberto.president@aeo1.com', role: UserRole.PRESIDENT },

      // Gerentes por estación (6)
      { id: 4, name: 'Luis García', email: 'luis.manager@aeo1.com', role: UserRole.MANAGER, stationId: 1, supervisorId: 2 },
      { id: 5, name: 'Carmen López', email: 'carmen.manager@aeo1.com', role: UserRole.MANAGER, stationId: 6, supervisorId: 1 },
      { id: 6, name: 'Fernando Silva', email: 'fernando.manager@aeo1.com', role: UserRole.MANAGER, stationId: 9, supervisorId: 1 },
      { id: 7, name: 'Mónica Jiménez', email: 'monica.manager@aeo1.com', role: UserRole.MANAGER, stationId: 12, supervisorId: 1 },
      { id: 8, name: 'Diego Morales', email: 'diego.manager@aeo1.com', role: UserRole.MANAGER, stationId: 15, supervisorId: 2 },
      { id: 9, name: 'Patricia Herrera', email: 'patricia.manager@aeo1.com', role: UserRole.MANAGER, stationId: 17, supervisorId: 1 },

      // Supervisores (5)
      { id: 10, name: 'Mario Vásquez', email: 'mario.supervisor@aeo1.com', role: UserRole.SUPERVISOR, stationId: 2, supervisorId: 4 },
      { id: 11, name: 'Sofía Ramírez', email: 'sofia.supervisor@aeo1.com', role: UserRole.SUPERVISOR, stationId: 7, supervisorId: 5 },
      { id: 12, name: 'Alejandro Cruz', email: 'alejandro.supervisor@aeo1.com', role: UserRole.SUPERVISOR, stationId: 10, supervisorId: 6 },
      { id: 13, name: 'Isabella Torres', email: 'isabella.supervisor@aeo1.com', role: UserRole.SUPERVISOR, stationId: 13, supervisorId: 7 },
      { id: 14, name: 'Rafael Mendoza', email: 'rafael.supervisor@aeo1.com', role: UserRole.SUPERVISOR, stationId: 18, supervisorId: 9 },

      // Empleados (6)
      { id: 15, name: 'Juan Pablo Castro', email: 'juan.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 3, supervisorId: 10 },
      { id: 16, name: 'Gabriela Núñez', email: 'gabriela.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 8, supervisorId: 11 },
      { id: 17, name: 'Andrés Santana', email: 'andres.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 11, supervisorId: 12 },
      { id: 18, name: 'Valeria Soto', email: 'valeria.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 14, supervisorId: 13 },
      { id: 19, name: 'Ricardo Peña', email: 'ricardo.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 16, supervisorId: 8 },
      { id: 20, name: 'Lucía Moreno', email: 'lucia.employee@aeo1.com', role: UserRole.EMPLOYEE, stationId: 19, supervisorId: 14 }
    ];

    for (const userData of users) {
      const existingUser = await userRepository.findOne({ where: { id: userData.id } });
      if (!existingUser) {
        const user = userRepository.create({
          ...userData,
          password,
          phone: `+1-809-555-${userData.id.toString().padStart(4, '0')}`,
          address: `Dirección de ${userData.name}`,
          isActive: true,
          isAvailable: true,
          maxWeeklyHours: userData.role === UserRole.EMPLOYEE ? 40 : userData.role === UserRole.SUPERVISOR ? 44 : 48,
          maxDailyHours: userData.role === UserRole.EMPLOYEE ? 8 : userData.role === UserRole.SUPERVISOR ? 9 : 10,
          certifications: [],
          skills: [],
          categories: [],
          availableShifts: ['morning', 'afternoon', 'night']
        });
        await userRepository.save(user);
        console.log(`✅ Usuario creado: ${userData.name} (${userData.role})`);
      } else {
        console.log(`⚠️ Usuario ya existe: ${userData.name}`);
      }
    }

    console.log('✅ Base de datos poblada exitosamente');

    // Mostrar resumen
    const stationCount = await stationRepository.count();
    const userCount = await userRepository.count();
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Estaciones: ${stationCount}`);
    console.log(`   - Usuarios: ${userCount}`);
    
    console.log(`\n🔑 Credenciales de acceso:`);
    console.log(`   - Admin: carlos.admin@aeo1.com / password123`);
    console.log(`   - Admin: ana.admin@aeo1.com / password123`);
    console.log(`   - President: roberto.president@aeo1.com / password123`);

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedDatabase();
