import { io, Socket } from 'socket.io-client';
import { authService } from './api';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No auth token found, cannot connect to WebSocket');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    this.socket = io(`${API_URL}/notifications`, {
      auth: {
        token: token
      },
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('notification', (data) => {
      console.log('🔔 New notification received:', data);
      this.handleNotification(data);
    });

    this.socket.on('assignmentNotification', (data) => {
      console.log('📋 Assignment notification received:', data);
      this.handleAssignmentNotification(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket manually disconnected');
    }
  }

  private handleNotification(data: any) {
    // Mostrar notificación del navegador si está permitido
    if (Notification.permission === 'granted') {
      new Notification(data.title || 'Nueva notificación', {
        body: data.message || data.content,
        icon: '/vite.svg'
      });
    }

    // Disparar evento personalizado para que los componentes puedan escuchar
    window.dispatchEvent(new CustomEvent('newNotification', { detail: data }));
  }

  private handleAssignmentNotification(data: any) {
    // Manejar notificaciones específicas de asignaciones
    if (Notification.permission === 'granted') {
      new Notification('Nueva Asignación', {
        body: `Se te ha asignado una nueva operación: ${data.operationName || data.flightNumber}`,
        icon: '/vite.svg'
      });
    }

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('newAssignmentNotification', { detail: data }));
  }

  // Método para solicitar permisos de notificación
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission:', permission);
        return permission;
      }
      return Notification.permission;
    }
    return 'denied';
  }

  // Método para emitir eventos al servidor
  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
    }
  }

  // Método para suscribirse a eventos específicos
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Método para desuscribirse de eventos
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  get connected() {
    return this.isConnected;
  }
}

// Crear una instancia singleton
export const websocketService = new WebSocketService();

// Conectar automáticamente si hay un usuario autenticado
if (authService.isAuthenticated()) {
  websocketService.connect();
  websocketService.requestNotificationPermission();
}

export default websocketService;
