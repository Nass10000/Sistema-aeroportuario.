/**
 * Enumeraciones para roles y categorías del sistema AEO
 */

/**
 * Roles de usuarios en el sistema
 */
export enum UserRole {
  EMPLOYEE = 'employee',           // Empleado básico - asignado a aeropuerto y vuelos específicos
  SUPERVISOR = 'supervisor',       // Supervisor - solo ve y gestiona su equipo de trabajo
  MANAGER = 'manager',            // Gerente - acceso únicamente a su estación/aeropuerto
  PRESIDENT = 'president',        // Presidente - solo VE y supervisa todas las estaciones (sin modificar)
  ADMIN = 'admin',               // Administrador del sistema (rol técnico)
}

/**
 * Categorías de empleados por área de trabajo
 */
export enum EmployeeCategory {
  BAGGAGE = 'baggage',           // Manejo de equipaje
  FUEL = 'fuel',                 // Combustible
  RAMP = 'ramp',                 // Rampa (ground handling)
  CARGO = 'cargo',               // Carga
  CLEANING = 'cleaning',         // Limpieza
  SECURITY = 'security',         // Seguridad
  MAINTENANCE = 'maintenance',   // Mantenimiento
  OPERATIONS = 'operations',     // Operaciones
  CUSTOMER_SERVICE = 'customer_service', // Atención al cliente
  CATERING = 'catering',         // Catering
  PUSHBACK = 'pushback',         // Pushback/remolque
}

/**
 * Tipos de turnos de trabajo
 */
export enum ShiftType {
  MORNING = 'morning',           // Turno matutino (6:00-14:00)
  AFTERNOON = 'afternoon',       // Turno vespertino (14:00-22:00)
  NIGHT = 'night',               // Turno nocturno (22:00-6:00)
  DAWN = 'dawn',                 // Turno madrugada (0:00-8:00)
  SPLIT = 'split',               // Turno dividido
  ROTATING = 'rotating',         // Turno rotativo
}

/**
 * Tipos de notificaciones
 */
export enum NotificationType {
  ASSIGNMENT = 'ASSIGNMENT',           // Nueva asignación
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE', // Cambio de horario
  OPERATIONAL_ALERT = 'OPERATIONAL_ALERT', // Alerta operacional
  STAFF_SHORTAGE = 'STAFF_SHORTAGE',   // Falta de personal
  OVERTIME_ALERT = 'OVERTIME_ALERT',   // Alerta de tiempo extra
  SYSTEM = 'SYSTEM',                   // Sistema
  ALERT = 'ALERT',                     // Alerta
  REMINDER = 'REMINDER',               // Recordatorio
  EMERGENCY = 'EMERGENCY',             // Emergencia
  MAINTENANCE = 'MAINTENANCE',         // Mantenimiento
  OPERATION = 'OPERATION',             // Operación
}

/**
 * Prioridades de notificaciones
 */
export enum NotificationPriority {
  LOW = 'LOW',                   // Baja prioridad
  MEDIUM = 'MEDIUM',             // Prioridad media
  HIGH = 'HIGH',                 // Alta prioridad
  URGENT = 'URGENT',             // Urgente
  CRITICAL = 'CRITICAL',         // Crítico
}

/**
 * Estados de asignaciones
 */
export enum AssignmentStatus {
  ASSIGNED = 'assigned',         // Asignado
  IN_PROGRESS = 'in_progress',   // En progreso
  COMPLETED = 'completed',       // Completado
  CANCELLED = 'cancelled',       // Cancelado
  DELAYED = 'delayed',           // Retrasado
  PENDING = 'pending',           // Pendiente
}

/**
 * Estados de operaciones
 */
export enum OperationStatus {
  SCHEDULED = 'scheduled',       // Programado
  BOARDING = 'boarding',         // Abordando
  DEPARTED = 'departed',         // Despegado
  ARRIVED = 'arrived',           // Llegado
  DELAYED = 'delayed',           // Retrasado
  CANCELLED = 'cancelled',       // Cancelado
  DIVERTED = 'diverted',         // Desviado
  MAINTENANCE = 'maintenance',   // En mantenimiento
}

/**
 * Tipos de operaciones
 */
export enum OperationType {
  ARRIVAL = 'arrival',           // Llegada
  DEPARTURE = 'departure',       // Salida
  TRANSIT = 'transit',           // Tránsito
  CARGO = 'cargo',               // Carga
  MAINTENANCE = 'maintenance',   // Mantenimiento
  POSITIONING = 'positioning',   // Posicionamiento
}

/**
 * Estados de marcado (punch)
 */
export enum PunchStatus {
  IN = 'in',                     // Entrada
  OUT = 'out',                   // Salida
  BREAK_START = 'break_start',   // Inicio de descanso
  BREAK_END = 'break_end',       // Fin de descanso
  LUNCH_START = 'lunch_start',   // Inicio de almuerzo
  LUNCH_END = 'lunch_end',       // Fin de almuerzo
}

/**
 * Permisos del sistema
 */
export enum Permission {
  // Usuarios
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  
  // Operaciones
  CREATE_OPERATION = 'create_operation',
  READ_OPERATION = 'read_operation',
  UPDATE_OPERATION = 'update_operation',
  DELETE_OPERATION = 'delete_operation',
  
  // Asignaciones
  CREATE_ASSIGNMENT = 'create_assignment',
  READ_ASSIGNMENT = 'read_assignment',
  UPDATE_ASSIGNMENT = 'update_assignment',
  DELETE_ASSIGNMENT = 'delete_assignment',
  
  // Notificaciones
  CREATE_NOTIFICATION = 'create_notification',
  READ_NOTIFICATION = 'read_notification',
  UPDATE_NOTIFICATION = 'update_notification',
  DELETE_NOTIFICATION = 'delete_notification',
  
  // Reportes
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Dashboard
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_ADMIN_DASHBOARD = 'view_admin_dashboard',
  
  // Sistema
  SYSTEM_ADMIN = 'system_admin',
  BACKUP_SYSTEM = 'backup_system',
}

/**
 * Mapeo de roles a permisos
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.EMPLOYEE]: [
    Permission.READ_USER,           // Solo puede ver información básica de usuarios
    Permission.READ_OPERATION,      // Ve las operaciones asignadas
    Permission.READ_ASSIGNMENT,     // Ve sus propias asignaciones
    Permission.READ_NOTIFICATION,   // Ve sus notificaciones
    Permission.VIEW_DASHBOARD,      // Dashboard básico de empleado
  ],
  [UserRole.SUPERVISOR]: [
    Permission.READ_USER,           // Ve información de su equipo
    Permission.UPDATE_USER,         // Puede actualizar info de su equipo
    Permission.READ_OPERATION,      // Ve operaciones de su área
    Permission.UPDATE_OPERATION,    // Puede modificar operaciones de su área
    Permission.CREATE_ASSIGNMENT,   // Puede asignar a su equipo
    Permission.READ_ASSIGNMENT,     // Ve asignaciones de su equipo
    Permission.UPDATE_ASSIGNMENT,   // Puede modificar asignaciones de su equipo
    Permission.CREATE_NOTIFICATION, // Puede enviar notificaciones a su equipo
    Permission.READ_NOTIFICATION,
    Permission.UPDATE_NOTIFICATION,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS,        // Ve reportes de su área
  ],
  [UserRole.MANAGER]: [
    Permission.CREATE_USER,         // Puede crear usuarios en su estación
    Permission.READ_USER,           // Ve todos los usuarios de su estación
    Permission.UPDATE_USER,         // Puede actualizar usuarios de su estación
    Permission.CREATE_OPERATION,    // Puede crear operaciones en su estación
    Permission.READ_OPERATION,      // Ve todas las operaciones de su estación
    Permission.UPDATE_OPERATION,    // Puede modificar operaciones de su estación
    Permission.DELETE_OPERATION,    // Puede eliminar operaciones de su estación
    Permission.CREATE_ASSIGNMENT,   // Puede crear asignaciones en su estación
    Permission.READ_ASSIGNMENT,     // Ve todas las asignaciones de su estación
    Permission.UPDATE_ASSIGNMENT,   // Puede modificar asignaciones de su estación
    Permission.DELETE_ASSIGNMENT,   // Puede eliminar asignaciones de su estación
    Permission.CREATE_NOTIFICATION, // Puede enviar notificaciones en su estación
    Permission.READ_NOTIFICATION,
    Permission.UPDATE_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ADMIN_DASHBOARD, // Dashboard de gerente
    Permission.VIEW_REPORTS,        // Ve reportes completos de su estación
    Permission.EXPORT_REPORTS,      // Puede exportar reportes de su estación
  ],
  [UserRole.PRESIDENT]: [
    // SOLO PERMISOS DE LECTURA - No puede modificar nada
    Permission.READ_USER,           // Ve información de todos los usuarios
    Permission.READ_OPERATION,      // Ve todas las operaciones de todas las estaciones
    Permission.READ_ASSIGNMENT,     // Ve todas las asignaciones
    Permission.READ_NOTIFICATION,   // Ve todas las notificaciones
    Permission.VIEW_DASHBOARD,      // Dashboard ejecutivo
    Permission.VIEW_ADMIN_DASHBOARD, // Dashboard completo (solo vista)
    Permission.VIEW_REPORTS,        // Ve todos los reportes
    Permission.EXPORT_REPORTS,      // Puede exportar reportes para análisis
    // NO tiene permisos de CREATE, UPDATE o DELETE
  ],
  [UserRole.ADMIN]: [
    // ADMINISTRADOR TÉCNICO - Acceso completo para mantenimiento del sistema
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.CREATE_OPERATION,
    Permission.READ_OPERATION,
    Permission.UPDATE_OPERATION,
    Permission.DELETE_OPERATION,
    Permission.CREATE_ASSIGNMENT,
    Permission.READ_ASSIGNMENT,
    Permission.UPDATE_ASSIGNMENT,
    Permission.DELETE_ASSIGNMENT,
    Permission.CREATE_NOTIFICATION,
    Permission.READ_NOTIFICATION,
    Permission.UPDATE_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.SYSTEM_ADMIN,
    Permission.BACKUP_SYSTEM,
  ],
};

/**
 * Función para verificar si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Función para obtener todos los permisos de un rol
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Función para verificar si un rol puede acceder a una funcionalidad
 */
export function canAccess(role: UserRole, requiredPermissions: Permission[]): boolean {
  const rolePermissions = getRolePermissions(role);
  return requiredPermissions.every(permission => rolePermissions.includes(permission));
}
