import React, { useState, useEffect } from 'react';
import { notificationService, userService, type Notification, type User } from '../services/api';
import { websocketService } from '../services/websocket';
import MultiSelect from '../components/MultiSelect';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    recipientId: [] as any[],
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Verificar si el usuario actual es supervisor o superior
  const canCreateNotifications = () => {
    return currentUser && ['supervisor', 'manager', 'president', 'admin'].includes(currentUser.role);
  };

  useEffect(() => {
    fetchNotifications();
    loadCurrentUser();
    
    // Solo cargar usuarios si el usuario puede crear notificaciones
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (['supervisor', 'manager', 'president', 'admin'].includes(user.role)) {
        fetchUsers();
      }
    }
    
    // Conectar WebSocket si no está conectado
    if (!websocketService.connected) {
      websocketService.connect();
    }

    // Escuchar nuevas notificaciones
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
    };

    const handleNewAssignmentNotification = (event: CustomEvent) => {
      const assignmentData = event.detail;
      console.log('📋 Processing assignment notification:', assignmentData);
      
      // Crear una notificación de asignación en la lista con información detallada
      const notification: Notification = {
        id: assignmentData.assignmentId || Date.now(), // Usar el ID real de la asignación
        userId: currentUser?.id || 0,
        title: assignmentData.title || 'Nueva Asignación de Trabajo',
        message: assignmentData.message || 'Se te ha asignado una nueva tarea',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        metadata: assignmentData.metadata // Usar directamente la metadata del backend
      };
      
      console.log('📋 Adding notification to list:', notification);
      setNotifications(prev => [notification, ...prev]);
    };

    // Agregar event listeners
    window.addEventListener('newNotification', handleNewNotification as EventListener);
    window.addEventListener('newAssignmentNotification', handleNewAssignmentNotification as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      window.removeEventListener('newAssignmentNotification', handleNewAssignmentNotification as EventListener);
    };
  }, []);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Datos de ejemplo en caso de error
      setNotifications([
        {
          id: 1,
          userId: 1,
          title: 'Nueva operación asignada',
          message: 'Se te ha asignado una nueva operación de vuelo AA123',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 1,
          title: 'Cambio de turno',
          message: 'Tu turno del martes ha sido reprogramado',
          type: 'warning',
          read: true,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notificationService.createNotification({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type as 'info' | 'success' | 'warning' | 'error'
      });
      setShowCreateForm(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        recipientId: [],
        priority: 'medium'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const getUserOptions = () => {
    return users.map(user => ({
      value: user.id.toString(),
      label: `${user.name} (${user.email})`
    }));
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Hace un momento';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notificaciones</h1>
          <div className="flex items-center space-x-4 mt-1">
            {unreadCount > 0 && (
              <p className="text-gray-400">
                Tienes {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
              </p>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${websocketService.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-400">
                {websocketService.connected ? 'Tiempo real activo' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-4">
          {canCreateNotifications() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Notificación
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary text-sm"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setSelectedFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          No leídas ({unreadCount})
        </button>
        <button
          onClick={() => setSelectedFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'read'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Leídas ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 005.53 4H20a2 2 0 012 2v11a2 2 0 01-2 2H6.828l-2-2H3a2 2 0 01-2-2V6a2 2 0 012-2h1.828z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No hay notificaciones</h3>
            <p className="text-gray-400">
              {selectedFilter === 'unread' && 'No tienes notificaciones sin leer.'}
              {selectedFilter === 'read' && 'No tienes notificaciones leídas.'}
              {selectedFilter === 'all' && 'No has recibido notificaciones aún.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`card cursor-pointer transition-all hover:bg-gray-700 ${
                !notification.read ? 'border-l-4 border-blue-500 bg-gray-800' : ''
              }`}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${!notification.read ? 'text-gray-300' : 'text-gray-400'} mt-1`}>
                    {notification.message}
                  </p>
                  
                  {/* Mostrar información adicional para notificaciones de asignación */}
                  {notification.metadata && (
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {notification.metadata.flightNumber && (
                          <div>
                            <span className="text-gray-400">Vuelo:</span>
                            <span className="text-white ml-2 font-medium">{notification.metadata.flightNumber}</span>
                          </div>
                        )}
                        {notification.metadata.function && (
                          <div>
                            <span className="text-gray-400">Función:</span>
                            <span className="text-white ml-2 font-medium">{notification.metadata.function}</span>
                          </div>
                        )}
                        {notification.metadata.origin && notification.metadata.destination && (
                          <div>
                            <span className="text-gray-400">Ruta:</span>
                            <span className="text-white ml-2 font-medium">
                              {notification.metadata.origin} → {notification.metadata.destination}
                            </span>
                          </div>
                        )}
                        {notification.metadata.startTime && (
                          <div>
                            <span className="text-gray-400">Inicio:</span>
                            <span className="text-white ml-2 font-medium">
                              {new Date(notification.metadata.startTime).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {notification.metadata.endTime && notification.metadata.startTime && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Duración:</span>
                            <span className="text-white ml-2 font-medium">
                              {new Date(notification.metadata.startTime).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(notification.metadata.endTime).toLocaleString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      notification.type === 'success' ? 'bg-green-900 text-green-200' :
                      notification.type === 'warning' ? 'bg-yellow-900 text-yellow-200' :
                      notification.type === 'error' ? 'bg-red-900 text-red-200' :
                      'bg-blue-900 text-blue-200'
                    }`}>
                      {notification.type === 'success' && 'Éxito'}
                      {notification.type === 'warning' && 'Advertencia'}
                      {notification.type === 'error' && 'Error'}
                      {notification.type === 'info' && 'Información'}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Notification Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crear Nueva Notificación</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Título de la notificación"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mensaje</label>
                <textarea
                  required
                  rows={3}
                  className="input-field"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Mensaje de la notificación"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                  <select
                    className="input-field"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  >
                    <option value="info">Información</option>
                    <option value="warning">Advertencia</option>
                    <option value="success">Éxito</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prioridad</label>
                  <select
                    className="input-field"
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as any })}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              
              <MultiSelect
                label="Destinatario (opcional)"
                options={getUserOptions()}
                value={newNotification.recipientId}
                onChange={(selected) => setNewNotification({ ...newNotification, recipientId: selected })}
                placeholder="Seleccionar usuario específico (dejar vacío para todos)..."
                isMulti={false}
              />
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Crear Notificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
