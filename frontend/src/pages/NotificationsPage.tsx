import React, { useState, useEffect } from 'react';
import { notificationService, type Notification, type NotificationType, type NotificationPriority } from '../services/api';

// Helper function to get notification type color
const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case 'EMERGENCY':
    case 'ALERT':
      return 'text-red-400';
    case 'OPERATIONAL_ALERT':
    case 'OVERTIME_ALERT':
      return 'text-yellow-400';
    case 'ASSIGNMENT':
    case 'SCHEDULE_CHANGE':
      return 'text-blue-400';
    case 'SYSTEM':
      return 'text-gray-400';
    default:
      return 'text-green-400';
  }
};

// Helper function to get priority color
const getPriorityColor = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'CRITICAL':
    case 'URGENT':
      return 'bg-red-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    case 'LOW':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper function to format notification type for display
const formatNotificationType = (type: NotificationType): string => {
  switch (type) {
    case 'EMERGENCY':
      return 'Emergencia';
    case 'ALERT':
      return 'Alerta';
    case 'OPERATIONAL_ALERT':
      return 'Alerta Operacional';
    case 'OVERTIME_ALERT':
      return 'Alerta de Horas Extra';
    case 'ASSIGNMENT':
      return 'Asignación';
    case 'SCHEDULE_CHANGE':
      return 'Cambio de Horario';
    case 'SYSTEM':
      return 'Sistema';
    default:
      return type;
  }
};

// Helper function to format priority for display
const formatPriority = (priority: NotificationPriority): string => {
  switch (priority) {
    case 'CRITICAL':
      return 'Crítica';
    case 'URGENT':
      return 'Urgente';
    case 'HIGH':
      return 'Alta';
    case 'MEDIUM':
      return 'Media';
    case 'LOW':
      return 'Baja';
    default:
      return priority;
  }
};

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'read') return notification.isRead;
    if (selectedFilter === 'unread') return !notification.isRead;
    return true;
  });

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Notificaciones</h1>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setSelectedFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedFilter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          No Leídas
        </button>
        <button
          onClick={() => setSelectedFilter('read')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedFilter === 'read'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Leídas
        </button>
      </div>

      {/* Notifications list */}
      <div className="card">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay notificaciones disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-6 rounded-lg border ${
                  !notification.isRead 
                    ? 'bg-blue-900/20 border-blue-500/50' 
                    : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-white">{notification.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)} text-white`}>
                          {formatPriority(notification.priority)}
                        </span>
                        <span className={`text-sm font-medium ${getNotificationTypeColor(notification.type)}`}>
                          {formatNotificationType(notification.type)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {formatDate(notification.createdAt)}
                        {notification.recipient && (
                          <span className="ml-2">
                            • Para: {notification.recipient.name}
                          </span>
                        )}
                      </p>
                      <div className="flex space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
