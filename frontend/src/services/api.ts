import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔐 Token attached to request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });
  } else {
    console.log('❌ No token found for request:', config.url);
  }
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🚨 API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      const currentPath = window.location.pathname;
      
      console.log('🔒 401 Unauthorized:', {
        isLoginEndpoint,
        currentPath,
        errorMessage: error.response?.data?.message
      });
      
      // Solo redirigir al login si:
      // 1. NO es el endpoint de login
      // 2. NO estamos ya en la página de login
      // 3. El error indica que el token ha expirado o es inválido
      if (!isLoginEndpoint && !currentPath.includes('/login')) {
        // Solo redirigir si el mensaje indica problemas específicos del token
        const errorData = error.response?.data;
        const tokenExpired = errorData?.message?.toLowerCase().includes('jwt') ||
                           errorData?.message?.toLowerCase().includes('token') ||
                           errorData?.message?.toLowerCase().includes('expired') ||
                           errorData?.message?.toLowerCase().includes('malformed');
        
        if (tokenExpired) {
          console.log('Token expired or invalid, redirecting to login');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.replace('/');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Tipos de datos
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'supervisor' | 'employee' | 'president';
  stationId?: number;
  category?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}



// Servicios de API
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    console.log('🔐 AuthService: Attempting login with:', { 
      email: credentials.email, 
      hasPassword: !!credentials.password 
    });

    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ AuthService: Login response received:', { 
        hasAccessToken: !!response.data.access_token,
        hasUser: !!response.data.user,
        userData: response.data.user
      });

      const { access_token, user } = response.data;

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

      console.log('💾 AuthService: Data saved to localStorage:', {
        tokenSaved: !!localStorage.getItem('auth_token'),
        userSaved: !!localStorage.getItem('user'),
        tokenLength: access_token.length
      });

      // Conectar WebSocket después del login exitoso
      setTimeout(() => {
        import('./websocket').then(({ websocketService }) => {
          websocketService.connect();
          websocketService.requestNotificationPermission();
        });
      }, 100);

      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Login failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // Desconectar WebSocket al hacer logout
    import('./websocket').then(({ websocketService }) => {
      websocketService.disconnect();
    });
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

// Add Notification interface definition
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  recipientId?: number;
  userId?: number;
  isRead?: boolean;
  metadata?: {
    assignmentId?: number;
    flightNumber?: string;
    function?: string;
    startTime?: string;
    endTime?: string;
    origin?: string;
    destination?: string;
    [key: string]: any;
  };
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (userId: number, userData: Partial<User>): Promise<User> => {
    const response = await api.post(`/users/${userId}`, userData);
    return response.data;
  },
};

// Add Station interface definition
export interface Station {
  id: number;
  name: string;
  code?: string;
  terminal?: string;
  isActive?: boolean;
}

export const stationService = {
  getStations: async (): Promise<Station[]> => {
    const response = await api.get('/stations');
    return response.data;
  },

  createStation: async (stationData: Partial<Station>): Promise<Station> => {
    const response = await api.post('/stations', stationData);
    return response.data;
  },
};

export const dashboardService = {
  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  getManagerDashboard: async () => {
    const response = await api.get('/dashboard/manager');
    return response.data;
  },

  getEmployeeDashboard: async () => {
    const response = await api.get('/dashboard/employee');
    return response.data;
  },
};

// Add Operation type definition if not imported
export interface Operation {
  id: number;
  flightNumber: string;
  origin: string;
  destination: string;
  airline?: string;
  operationType?: 'arrival' | 'departure';
  scheduledTime?: string;
  status?: 'on-time' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived' | 'scheduled';
  gate?: string;
}

export const operationService = {
  getOperations: async (): Promise<Operation[]> => {
    const response = await api.get('/operations');
    return response.data;
  },

  createOperation: async (operationData: Partial<Operation>): Promise<Operation> => {
    const response = await api.post('/operations', operationData);
    return response.data;
  },

  updateOperation: async (id: number, operationData: Partial<Operation>): Promise<Operation> => {
    const response = await api.put(`/operations/${id}`, operationData);
    return response.data;
  },

  deleteOperation: async (id: number): Promise<void> => {
    await api.delete(`/operations/${id}`);
  },
};

// Add Assignment interface definition
export interface Assignment {
  id: number;
  userId: number;
  operationId: number;
  startTime: string;
  endTime: string;
  assignmentFunction: string;
  cost: number;
  user?: User;
  operation?: Operation;
}

export const assignmentService = {
  getAssignments: async (): Promise<Assignment[]> => {
    const response = await api.get('/assignments');
    return response.data;
  },

  createAssignment: async (assignmentData: any): Promise<Assignment> => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  updateAssignment: async (id: number, assignmentData: Partial<Assignment>): Promise<Assignment> => {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  deleteAssignment: async (id: number): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
};

// Add Punch interface definition
export interface Punch {
  id: number;
  userId: number;
  type: 'in' | 'out';
  timestamp: string;
  comment?: string;
  location?: string;
}

export const punchService = {
  getPunches: async (): Promise<Punch[]> => {
    const response = await api.get('/punch');
    return response.data;
  },

  getMyPunches: async (): Promise<Punch[]> => {
    const response = await api.get('/punch/me');
    return response.data;
  },

  createPunch: async (punchData: { type: 'in' | 'out'; comment?: string }): Promise<Punch> => {
    const response = await api.post('/punch', punchData);
    return response.data;
  },

  punchIn: async (comment?: string): Promise<Punch> => {
    const response = await api.post('/punch', { type: 'in', comment });
    return response.data;
  },

  punchOut: async (comment?: string): Promise<Punch> => {
    const response = await api.post('/punch', { type: 'out', comment });
    return response.data;
  },
};

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  createNotification: async (notificationData: Partial<Notification>): Promise<Notification> => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};

export const reportsService = {
  getAttendanceReport: async (params: any) => {
    const response = await api.get('/reports/attendance', { params });
    return response.data;
  },

  getOvertimeReport: async (params: any) => {
    const response = await api.get('/reports/overtime', { params });
    return response.data;
  },

  getCoverageReport: async () => {
    const response = await api.get('/reports/coverage');
    return response.data;
  },

  getWeeklySchedule: async (params: any) => {
    const response = await api.get('/reports/weekly-schedule', { params });
    return response.data;
  },

  getEmployeeSchedule: async (params: any) => {
    const response = await api.get('/reports/employee-schedule', { params });
    return response.data;
  },

  getCostAnalysis: async (params: any) => {
    const response = await api.get('/reports/cost-analysis', { params });
    return response.data;
  },

  getOperationalMetrics: async (params: any) => {
    const response = await api.get('/reports/operational-metrics', { params });
    return response.data;
  },
};

export const schedulingService = {
  validateAssignment: async (assignmentData: any) => {
    const response = await api.post('/scheduling/validate-assignment', assignmentData);
    return response.data;
  },

  checkAvailability: async (params: any) => {
    const response = await api.post('/scheduling/check-availability', params);
    return response.data;
  },

  getAvailableStaff: async (operationId: number, skills?: string[]) => {
    const response = await api.get(`/scheduling/available-staff/${operationId}`, { 
      params: { skills: skills?.join(',') } 
    });
    return response.data;
  },

  createReplacement: async (replacementData: any) => {
    const response = await api.post('/scheduling/create-replacement', replacementData);
    return response.data;
  },

  getOptimalStaffing: async (operationId: number) => {
    const response = await api.get(`/scheduling/optimal-staffing/${operationId}`);
    return response.data;
  },
};

export default api;
