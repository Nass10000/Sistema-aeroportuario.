import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

// Configuración base
const API_BASE_URL = 'http://localhost:3001';

// ⚡ CACHE BUSTER - Updated for INSTANT responses (NO TIMEOUTS)
const API_VERSION = '2025-07-01-INSTANT-v1';
console.log(`🚀 API Service loaded - Version: ${API_VERSION} - TIMEOUTS ELIMINADOS COMPLETAMENTE`);

// SIN TIMEOUTS - Respuestas instantáneas
console.log(`⚡ MODO INSTANTÁNEO - Sin timeouts, respuestas inmediatas del backend`);

// Tipos del backend - usando union types para compatibilidad
export type UserRole = 'employee' | 'supervisor' | 'manager' | 'president' | 'admin';

export type EmployeeCategory = 
  | 'baggage' 
  | 'fuel' 
  | 'ramp' 
  | 'cargo' 
  | 'cleaning' 
  | 'security' 
  | 'maintenance' 
  | 'operations' 
  | 'customer_service' 
  | 'catering' 
  | 'pushback';

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'dawn' | 'split' | 'rotating';

export type NotificationType = 
  | 'ASSIGNMENT'
  | 'SCHEDULE_CHANGE'
  | 'OPERATIONAL_ALERT'
  | 'STAFF_SHORTAGE'
  | 'OVERTIME_ALERT'
  | 'SYSTEM'
  | 'ALERT'
  | 'REMINDER'
  | 'EMERGENCY'
  | 'MAINTENANCE'
  | 'OPERATION';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type StationType = 'TERMINAL' | 'PLATFORM' | 'CARGO' | 'MAINTENANCE' | 'FUEL' | 'SECURITY';

export type OperationType = 'ARRIVAL' | 'DEPARTURE';

export type OperationStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type FlightType = 'DOMESTIC' | 'INTERNATIONAL';

export type AssignmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';

export type PunchType = 'in' | 'out';

// Tipos para el sistema que coinciden exactamente con el backend
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  photo?: string;
  phone?: string;
  address?: string;
  birthDate?: Date | string;
  emergencyContact?: string;
  emergencyPhone?: string;
  certifications?: string[];
  skills?: string[];
  categories?: EmployeeCategory[];
  availableShifts?: string[];
  maxWeeklyHours?: number;
  maxDailyHours?: number;
  isActive: boolean;
  isAvailable?: boolean;
  stationId?: number;
  supervisorId?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignments?: Assignment[];
  managedStations?: Station[];
}

export interface Station {
  id: number;
  name: string;
  location?: string;
  type: StationType;
  description?: string;
  minimumStaff: number;
  maximumStaff: number;
  isActive: boolean;
  requiredCertifications: string[];
  code?: string;
  manager?: User;
  operations?: Operation[];
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  stationId?: number;
}

export interface Operation {
  id: number;
  name: string;
  flightNumber: string;
  origin: string;
  destination: string;
  scheduledTime: Date | string;
  passengerCount: number;
  type: OperationType;
  status: OperationStatus;
  flightType: FlightType;
  estimatedDuration?: number;
  minimumStaffRequired?: number;
  station?: Station;
  assignments?: Assignment[];
}

export interface Assignment {
  id: number;
  operationId?: number;
  userId?: number;
  operation?: Operation;
  user?: User;
  function: string;
  startTime: Date | string;
  endTime: Date | string;
  cost: number;
  status: AssignmentStatus;
  notes?: string;
  actualStartTime?: Date | string;
  actualEndTime?: Date | string;
  overtimeHours?: number;
  isReplacement: boolean;
  replacementFor?: User;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipient?: User;
  sender?: User;
  isRead: boolean;
  data?: any;
  createdAt: Date | string;
  readAt?: Date | string;
}

export interface Punch {
  id: number;
  user?: User;
  type: PunchType;
  timestamp: Date | string;
  comment?: string;
}

// Nuevos tipos para gestión de estaciones
export interface AssignStationRequest {
  userId: number;
  stationId: number;
}

export interface StaffOptimizationResult {
  recommendedAssignments: StaffRecommendation[];
  minimumStaffMet: boolean;
  optimizationSuggestions: string[];
  staffAvailability: {
    available: number;
    required: number;
    shortage: number;
  };
}

export interface StaffRecommendation {
  userId: number;
  name: string;
  role: UserRole;
  skills: string[];
  certifications: string[];
  recommendationScore: number;
  recommendedPosition: string;
}

// Configuración de axios con timeout y retry - VERSIÓN ACTUALIZADA
class ApiService {
  private api: AxiosInstance;

  constructor() {
    console.log(`🔧 Creating ApiService with INSTANT responses - No timeouts!`);
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      // SIN TIMEOUT - Respuestas instantáneas
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ ApiService created successfully - Ready for INSTANT requests`);

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para manejo de respuestas
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si es error 401 (Unauthorized), limpiar token y redirigir
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const isLoginEndpoint = error.config?.url?.includes('/auth/login');
          const currentPath = window.location.pathname;
          
          // Solo redirigir si NO es el endpoint de login y NO estamos ya en login
          if (!isLoginEndpoint && !currentPath.includes('/login')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  // Método genérico simplificado sin retry
  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<T> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error: any) {
      // Manejo de errores directo sin reintentos
      this.handleApiError(error);
      throw error;
    }
  }

  // Manejo de errores más específico - SIN TIMEOUT
  private handleApiError(error: any): void {
    if (error.message?.includes('Network Error')) {
      console.error('🌐 Network error - Check your internet connection');
    } else if (error.response?.status === 500) {
      console.error('🚨 Internal server error - Please try again later');
    } else if (error.response?.status === 404) {
      console.error('📍 Resource not found - The requested endpoint does not exist');
    } else if (error.response?.status === 403) {
      console.error('🔒 Access forbidden - You don\'t have permission for this action');
    } else if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - Please log in again');
    } else {
      console.error('❌ API Error:', error.message || 'Unknown error occurred');
    }
  }

  // Métodos básicos HTTP
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.api.get<T>(url, config));
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.api.post<T>(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.api.put<T>(url, data, config));
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.api.delete<T>(url, config));
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.requestWithRetry(() => this.api.patch<T>(url, data, config));
  }

  // Método específico para reportes SIN TIMEOUT - Respuesta instantánea
  async getReport<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const timestamp = new Date().toISOString();
    const startTime = Date.now();  // Tiempo más preciso
    const token = localStorage.getItem('auth_token');
    
    console.log(`🔐 [REPORT-API] ${timestamp} - INICIANDO REQUEST DE REPORTE`);
    console.log(`⚡ [REPORT-API] SIN TIMEOUT - Respuesta instantánea`);
    console.log(`📡 [REPORT-API] URL: ${url}`);
    console.log(`🚀 [REPORT-API] Version: ${API_VERSION}`);
    console.log(`🔑 [REPORT-API] Token presente: ${!!token} (longitud: ${token?.length || 0})`);
    
    // CRÍTICO: Asegurar que el Authorization header esté presente - SIN TIMEOUT
    const extendedConfig = {
      ...config,
      // SIN TIMEOUT
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...config?.headers,
      }
    };
    
    console.log(`⚡ [REPORT-API] Config aplicado:`, { 
      hasAuthHeader: !!extendedConfig.headers?.Authorization,
      authHeaderPreview: extendedConfig.headers?.Authorization ? `Bearer ${token?.substring(0, 10)}...` : 'none'
    });
    
    if (!token) {
      console.error('❌ [REPORT-API] NO HAY TOKEN DE AUTENTICACIÓN!');
      throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    
    // LOGGING DETALLADO DE LA REQUEST
    console.log(`🚀 [REPORT-API] INICIANDO REQUEST...`);
    console.log(`📤 [REPORT-API] URL completa: ${API_BASE_URL}${url}`);
    console.log(`⏰ [REPORT-API] Timestamp de inicio: ${timestamp}`);
    
    try {
      console.log(`📤 [REPORT-API] ======================== ENVIANDO AXIOS REQUEST ========================`);
      console.log(`📤 [REPORT-API] Momento justo antes de axios.get: ${new Date().toISOString()}`);
      
      const response = await this.api.get<T>(url, extendedConfig);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [REPORT-API] ======================== RESPUESTA RECIBIDA! ========================`);
      console.log(`✅ [REPORT-API] Momento de recepción: ${new Date().toISOString()}`);
      console.log(`⏱️ [REPORT-API] Duración total: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`📊 [REPORT-API] Status: ${response.status} ${response.statusText || ''}`);
      console.log(`📦 [REPORT-API] Response headers:`, response.headers);
      console.log(`📋 [REPORT-API] Response data type:`, typeof response.data);
      console.log(`� [REPORT-API] Response data size:`, JSON.stringify(response.data || {}).length, 'caracteres');
      
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        console.log(`🔍 [REPORT-API] ======================== ANÁLISIS DE DATOS ========================`);
        console.log(`🔍 [REPORT-API] Keys en response.data:`, Object.keys(data));
        console.log(`📊 [REPORT-API] Summary presente:`, !!data.summary);
        console.log(`📊 [REPORT-API] Details presente:`, !!data.details);
        console.log(`📊 [REPORT-API] Details count:`, data.details?.length || 0);
        
        if (data.summary) {
          console.log(`📊 [REPORT-API] Summary completo:`, data.summary);
          console.log(`📊 [REPORT-API] Summary keys:`, Object.keys(data.summary));
        }
        
        if (data.details && Array.isArray(data.details)) {
          console.log(`👥 [REPORT-API] Details es array: true, longitud: ${data.details.length}`);
          if (data.details.length > 0) {
            console.log(`� [REPORT-API] Primer record:`, data.details[0]);
            console.log(`👥 [REPORT-API] Keys del primer record:`, Object.keys(data.details[0] || {}));
            if (data.details.length > 1) {
              console.log(`� [REPORT-API] Último record:`, data.details[data.details.length - 1]);
            }
          }
        } else {
          console.log(`❌ [REPORT-API] Details NO es array o está vacío:`, data.details);
        }
        
        // Verificar estructura específica esperada por el frontend
        const hasExpectedStructure = data.summary && data.details && Array.isArray(data.details);
        console.log(`✅ [REPORT-API] Estructura válida para el frontend:`, hasExpectedStructure);
        
      } else {
        console.warn(`⚠️ [REPORT-API] Datos no son objeto:`, response.data);
      }
      
      console.log(`🎯 [REPORT-API] ======================== RETORNANDO AL FRONTEND ========================`);
      console.log(`🎯 [REPORT-API] Datos a retornar:`, response.data);
      
      return response.data;
      
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ [REPORT-API] ======================== ERROR EN REQUEST ========================`);
      console.error(`❌ [REPORT-API] Momento del error: ${new Date().toISOString()}`);
      console.error(`❌ [REPORT-API] Duración antes del error: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.error(`🚨 [REPORT-API] Error completo:`, {
        errorType: error.constructor.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseHeaders: error.response?.headers,
        responseData: error.response?.data,
        url: url,
        timestamp: new Date().toISOString()
      });
      
      // Análisis específico del tipo de error - SIN TIMEOUT
      if (error.response) {
        console.error(`🔴 [REPORT-API] El servidor respondió con error ${error.response.status}`);
        console.error(`🔴 [REPORT-API] Datos del error:`, error.response.data);
      } else if (error.request) {
        console.error(`📡 [REPORT-API] Request enviado pero SIN RESPUESTA del servidor`);
        console.error(`📡 [REPORT-API] Request object:`, error.request);
      } else {
        console.error(`❌ [REPORT-API] Error en configuración de request:`, error.message);
      }
      
      // Re-throw el error para que sea manejado por el frontend
      throw error;
    }
  }
}

// Instancia global de API
const apiService = new ApiService();

// Servicio de Autenticación
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🔐 AuthService: Attempting login with:', { 
      email: credentials.email, 
      hasPassword: !!credentials.password 
    });

    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      console.log('✅ AuthService: Login response received:', { 
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        userData: response.user
      });

      const { access_token, user } = response;

      if (!access_token) {
        console.error('❌ AuthService: No access token in response!');
        throw new Error('No access token received');
      }
      if (!user) {
        console.error('❌ AuthService: No user data in response!');
        throw new Error('No user data received');
      }

      // Guardar el token y la información del usuario
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ VERIFICACIÓN CRÍTICA: Confirmar que el token se guardó correctamente
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      console.log('💾 AuthService: Data saved to localStorage:', {
        tokenSaved: !!savedToken,
        userSaved: !!savedUser,
        tokenLength: access_token.length,
        savedTokenLength: savedToken?.length || 0,
        tokensMatch: savedToken === access_token,
        tokenPreview: `${access_token.substring(0, 20)}...`,
        savedTokenPreview: savedToken ? `${savedToken.substring(0, 20)}...` : 'none'
      });

      if (savedToken !== access_token) {
        console.error('❌ AuthService: TOKEN MISMATCH! Token not saved correctly');
        throw new Error('Error saving authentication token');
      }

      console.log('✅ AuthService: Authentication token verified and saved successfully');

      // Conectar WebSocket inmediatamente después del login exitoso
      try {
        const { websocketService } = await import('./websocket');
        websocketService.connect();
        websocketService.requestNotificationPermission();
      } catch (error) {
        // Ignorar errores de WebSocket si no está disponible
        console.log('WebSocket not available:', error);
      }

      return response;
    } catch (error: any) {
      console.error('❌ AuthService: Login failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  async register(userData: any): Promise<User> {
    try {
      const response = await apiService.post<User>('/auth/register', userData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al registrar usuario');
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

// Servicio de Reportes - VERSIÓN ACTUALIZADA CON TIMEOUT EXTENDIDO
export const reportsService = {
  async getAttendanceReport(params: ReportParams): Promise<any> {
    console.log('📊 Generando reporte de asistencia - SIN TIMEOUT');
    console.log('📊 Parámetros:', params);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);
      if (params.stationId) {
        queryParams.append('stationId', params.stationId.toString());
      }

      const url = `/reports/attendance?${queryParams.toString()}`;
      console.log('📊 URL:', url);

      // Llamada usando método público
      const response = await apiService.get(url) as any;
      console.log('📊 Respuesta recibida:', response);
      
      return response;
    } catch (error: any) {
      console.error('❌ Error:', error);
      
      if (error.response?.status === 500) {
        throw new Error('Error interno del servidor. Intente nuevamente.');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint no encontrado.');
      } else {
        throw new Error(error.response?.data?.message || 'Error al generar reporte');
      }
    }
  },

  async getOvertimeReport(params: ReportParams): Promise<any> {
    try {
      console.log('⏰ Fetching overtime report with params:', params);
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);
      if (params.stationId) {
        queryParams.append('stationId', params.stationId.toString());
      }

      const response = await apiService.getReport<any>(`/reports/overtime?${queryParams.toString()}`);
      console.log('⏰ Overtime report received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching overtime report:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        params
      });
      
      if (false) {
        throw new Error(`❌ ERROR RESPUESTA: Intente con un rango de fechas menor.`);
      } else if (error.response?.status === 500) {
        throw new Error('Error interno del servidor al generar el reporte de horas extra. Por favor, intente nuevamente.');
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener reporte de horas extra');
      }
    }
  },

  async getCoverageReport(): Promise<any> {
    try {
      console.log('📍 Fetching coverage report...');
      const response = await apiService.getReport<any>('/reports/coverage');
      console.log('📍 Coverage report received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching coverage report:', {
        message: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      if (false) {
        throw new Error('El reporte de cobertura está tardando mucho en generarse. Por favor, intente nuevamente.');
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener reporte de cobertura');
      }
    }
  },

  async getWeeklySchedule(params: ReportParams): Promise<any> {
    try {
      console.log('📅 Fetching weekly schedule with params:', params);
      const queryParams = new URLSearchParams();
      queryParams.append('weekStartDate', params.startDate);
      if (params.stationId) {
        queryParams.append('stationId', params.stationId.toString());
      }

      const response = await apiService.getReport<any>(`/reports/weekly-schedule?${queryParams.toString()}`);
      console.log('📅 Weekly schedule received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching weekly schedule:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        params
      });
      
      if (false) {
        throw new Error('El horario semanal está tardando mucho en generarse. Por favor, intente nuevamente.');
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener horario semanal');
      }
    }
  },

  async getEmployeeSchedule(params: ReportParams & { employeeId?: number }): Promise<any> {
    try {
      console.log('👤 Fetching employee schedule with params:', params);
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);
      if (params.employeeId) {
        queryParams.append('employeeId', params.employeeId.toString());
      }

      const response = await apiService.getReport<any>(`/reports/employee-schedule?${queryParams.toString()}`);
      console.log('👤 Employee schedule received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching employee schedule:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        params
      });
      
      if (false) {
        throw new Error(`❌ ERROR RESPUESTA: Intente con un rango de fechas menor.`);
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener horario del empleado');
      }
    }
  },

  async getCostAnalysis(params: ReportParams): Promise<any> {
    try {
      console.log('💰 Fetching cost analysis with params:', params);
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);
      if (params.stationId) {
        queryParams.append('stationId', params.stationId.toString());
      }

      const response = await apiService.getReport<any>(`/reports/cost-analysis?${queryParams.toString()}`);
      console.log('💰 Cost analysis received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching cost analysis:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        params
      });
      
      if (false) {
        throw new Error(`❌ ERROR RESPUESTA: Intente con un rango de fechas menor.`);
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener análisis de costos');
      }
    }
  },

  async getOperationalMetrics(params: ReportParams): Promise<any> {
    try {
      console.log('📊 Fetching operational metrics with params:', params);
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', params.startDate);
      queryParams.append('endDate', params.endDate);

      const response = await apiService.getReport<any>(`/reports/operational-metrics?${queryParams.toString()}`);
      console.log('📊 Operational metrics received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching operational metrics:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        params
      });
      
      if (false) {
        throw new Error(`❌ ERROR RESPUESTA: Intente con un rango de fechas menor.`);
      } else {
        throw new Error(error.response?.data?.message || 'Error al obtener métricas operacionales');
      }
    }
  }
};

// Servicio de Usuarios
export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<User[]>('/users');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
    }
  },

  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  },

  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiService.get<User>(`/users/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching user:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener usuario');
    }
  },

  async createUser(userData: any): Promise<User> {
    try {
      const response = await apiService.post<User>('/users', userData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      throw new Error(error.response?.data?.message || 'Error al crear usuario');
    }
  },

  async updateUser(id: number, userData: any): Promise<User> {
    try {
      const response = await apiService.put<User>(`/users/${id}`, userData);
      return response;
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await apiService.delete(`/users/${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  },

  // Nuevos métodos para gestión de estaciones
  async assignStation(userId: number, stationId: number): Promise<User> {
    try {
      console.log('🔧 Asignando estación:', { userId, stationId });
      const response = await apiService.post<User>(`/users/${userId}/assign-station`, {
        stationId
      });
      return response;
    } catch (error: any) {
      console.error('❌ Error assigning station:', error);
      throw new Error(error.response?.data?.message || 'Error al asignar estación');
    }
  },

  async removeStationAssignment(userId: number): Promise<User> {
    try {
      const response = await apiService.delete<User>(`/users/${userId}/station`);
      return response;
    } catch (error: any) {
      console.error('❌ Error removing station assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al remover asignación de estación');
    }
  },

  async checkStaffAvailability(stationId: number, requiredStaff: number, operationDate: string): Promise<{
    hasEnoughStaff: boolean;
    availableStaff: number;
    suggestions: string[];
  }> {
    try {
      const response = await apiService.get<{
        hasEnoughStaff: boolean;
        availableStaff: number;
        suggestions: string[];
      }>(`/users/staff-availability/${stationId}`, {
        params: { requiredStaff, operationDate }
      });
      return response;
    } catch (error: any) {
      console.error('❌ Error checking staff availability:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar disponibilidad de personal');
    }
  }
};

// Servicio de Estaciones
export const stationService = {
  async getAllStations(): Promise<Station[]> {
    try {
      const response = await apiService.get<Station[]>('/stations');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching stations:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estaciones');
    }
  },

  async getStations(): Promise<Station[]> {
    return this.getAllStations();
  },

  async getStationById(id: number): Promise<Station> {
    try {
      const response = await apiService.get<Station>(`/stations/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching station:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estación');
    }
  },

  async createStation(stationData: any): Promise<Station> {
    try {
      const response = await apiService.post<Station>('/stations', stationData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating station:', error);
      throw new Error(error.response?.data?.message || 'Error al crear estación');
    }
  },

  async updateStation(id: number, stationData: any): Promise<Station> {
    try {
      const response = await apiService.put<Station>(`/stations/${id}`, stationData);
      return response;
    } catch (error: any) {
      console.error('❌ Error updating station:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar estación');
    }
  },

  async deleteStation(id: number): Promise<void> {
    try {
      await apiService.delete(`/stations/${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting station:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar estación');
    }
  }
};

// Servicio de Punch (Registro de Entrada/Salida)
export const punchService = {
  async punch(punchData: { type: PunchType; comment?: string }): Promise<any> {
    try {
      const response = await apiService.post('/punch', punchData);
      return response;
    } catch (error: any) {
      console.error('❌ Error punching:', error);
      throw new Error(error.response?.data?.message || 'Error al registrar marcaje');
    }
  },

  async punchIn(comment?: string): Promise<any> {
    return this.punch({ type: 'in', comment });
  },

  async punchOut(comment?: string): Promise<any> {
    return this.punch({ type: 'out', comment });
  },

  async getMyPunches(): Promise<Punch[]> {
    try {
      const response = await apiService.get<Punch[]>('/punch/me');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching my punches:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener mis registros');
    }
  },

  // Métodos mantenidos para compatibilidad con versiones anteriores
  async getUserPunches(userId: number, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any[]>(`/punch/user/${userId}?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching user punches:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener registros');
    }
  }
};

// Servicio de Dashboard
export const dashboardService = {
  async getDashboardData(): Promise<any> {
    try {
      console.log('📊 Fetching dashboard data...');
      const response = await apiService.get<any>('/dashboard');
      console.log('📊 Dashboard data received:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener datos del dashboard');
    }
  },

  async getAdminDashboard(startDate?: string, endDate?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any>(`/dashboard/admin?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching admin dashboard:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard de admin');
    }
  },

  async getManagerDashboard(startDate?: string, endDate?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any>(`/dashboard/manager?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching manager dashboard:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard de manager');
    }
  },

  async getEmployeeDashboard(): Promise<any> {
    try {
      const response = await apiService.get<any>('/dashboard/employee');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching employee dashboard:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard de empleado');
    }
  },

  async getStationDashboard(stationId: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any>(`/dashboard/station/${stationId}?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching station dashboard:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard de estación');
    }
  },

  async getAlerts(): Promise<any> {
    try {
      const response = await apiService.get<any>('/dashboard/alerts');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching alerts:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener alertas');
    }
  },

  async getAttendanceAnalytics(stationId?: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (stationId) queryParams.append('stationId', stationId.toString());
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any>(`/dashboard/analytics/attendance?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching attendance analytics:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener análisis de asistencia');
    }
  },

  async getOvertimeAnalytics(stationId?: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (stationId) queryParams.append('stationId', stationId.toString());
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiService.get<any>(`/dashboard/analytics/overtime?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching overtime analytics:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener análisis de tiempo extra');
    }
  },

  async getCoverageAnalytics(): Promise<any> {
    try {
      const response = await apiService.get<any>('/dashboard/analytics/coverage');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching coverage analytics:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener análisis de cobertura');
    }
  }
};

// Servicio de Asignaciones
export const assignmentService = {
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const response = await apiService.get<Assignment[]>('/assignments');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching assignments:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener asignaciones');
    }
  },

  async getAssignments(): Promise<Assignment[]> {
    return this.getAllAssignments();
  },

  async getAssignmentById(id: number): Promise<Assignment> {
    try {
      const response = await apiService.get<Assignment>(`/assignments/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener asignación');
    }
  },

  async createAssignment(assignmentData: any): Promise<Assignment> {
    try {
      const response = await apiService.post<Assignment>('/assignments', assignmentData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al crear asignación');
    }
  },

  async updateAssignment(id: number, assignmentData: any): Promise<Assignment> {
    try {
      const response = await apiService.patch<Assignment>(`/assignments/${id}`, assignmentData);
      return response;
    } catch (error: any) {
      console.error('❌ Error updating assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar asignación');
    }
  },

  async deleteAssignment(id: number): Promise<void> {
    try {
      await apiService.delete(`/assignments/${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar asignación');
    }
  }
};

// Servicio de Notificaciones
export const notificationService = {
  async getAllNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      const queryParams = new URLSearchParams();
      if (unreadOnly) {
        queryParams.append('unread', 'true');
      }
      const response = await apiService.get<Notification[]>(`/notifications?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener notificaciones');
    }
  },

  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    return this.getAllNotifications(unreadOnly);
  },

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    try {
      const response = await apiService.post<Notification>('/notifications', notificationData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating notification:', error);
      throw new Error(error.response?.data?.message || 'Error al crear notificación');
    }
  },

  async markAsRead(id: number): Promise<void> {
    try {
      await apiService.patch(`/notifications/${id}/read`);
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'Error al marcar notificación como leída');
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiService.patch('/notifications/read-all');
    } catch (error: any) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || 'Error al marcar todas las notificaciones como leídas');
    }
  }
};

// Servicio de Operaciones
export const operationService = {
  async getAllOperations(): Promise<Operation[]> {
    try {
      const response = await apiService.get<Operation[]>('/operations');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching operations:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener operaciones');
    }
  },

  async getOperations(): Promise<Operation[]> {
    return this.getAllOperations();
  },

  async getOperationById(id: number): Promise<Operation> {
    try {
      const response = await apiService.get<Operation>(`/operations/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching operation:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener operación');
    }
  },

  async createOperation(operationData: any): Promise<Operation> {
    try {
      const response = await apiService.post<Operation>('/operations', operationData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating operation:', error);
      throw new Error(error.response?.data?.message || 'Error al crear operación');
    }
  },

  async updateOperation(id: number, operationData: any): Promise<Operation> {
    try {
      const response = await apiService.put<Operation>(`/operations/${id}`, operationData);
      return response;
    } catch (error: any) {
      console.error('❌ Error updating operation:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar operación');
    }
  },

  async deleteOperation(id: number): Promise<void> {
    try {
      await apiService.delete(`/operations/${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting operation:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar operación');
    }
  }
};

// Servicio de Programación
export const schedulingService = {
  async getSchedules(): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>('/scheduling');
      return response;
    } catch (error: any) {
      console.error('❌ Error fetching schedules:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener horarios');
    }
  },

  async createSchedule(scheduleData: any): Promise<any> {
    try {
      const response = await apiService.post<any>('/scheduling', scheduleData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating schedule:', error);
      throw new Error(error.response?.data?.message || 'Error al crear horario');
    }
  },

  async validateAssignment(assignmentData: any): Promise<any> {
    try {
      const response = await apiService.post<any>('/scheduling/validate-assignment', assignmentData);
      return response;
    } catch (error: any) {
      console.error('❌ Error validating assignment:', error);
      throw new Error(error.response?.data?.message || 'Error al validar asignación');
    }
  },

  async checkAvailability(params: any): Promise<any> {
    try {
      // Usar el nuevo endpoint para disponibilidad real
      const queryParams = new URLSearchParams();
      if (params.operationId) queryParams.append('operationId', params.operationId.toString());
      if (params.date) queryParams.append('date', params.date);
      
      const response = await apiService.get<any>(`/scheduling/real-availability?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error checking availability:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar disponibilidad');
    }
  },

  async checkStaffAvailability(userIds: number[], startTime: string, endTime: string): Promise<any> {
    try {
      const response = await apiService.post<any>('/scheduling/check-availability', {
        userIds,
        startTime,
        endTime
      });
      return response;
    } catch (error: any) {
      console.error('❌ Error checking staff availability:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar disponibilidad del personal');
    }
  },

  // Nuevo método para optimización de personal
  async optimizeStaffing(operationId: number): Promise<StaffOptimizationResult> {
    try {
      const response = await apiService.get<StaffOptimizationResult>(`/scheduling/optimize-staffing/${operationId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Error optimizing staffing:', error);
      throw new Error(error.response?.data?.message || 'Error al optimizar personal');
    }
  }
};

// Exportar instancia de API para uso directo si es necesario
export { apiService };

// Export default para compatibilidad
export default apiService;
