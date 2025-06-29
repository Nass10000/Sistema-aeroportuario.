import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
