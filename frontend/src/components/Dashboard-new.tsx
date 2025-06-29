import React, { useState, useEffect } from 'react';
import { dashboardService, type User } from '../services/api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import UsersPage from '../pages/UsersPage';
import StationsPage from '../pages/StationsPage';
import OperationsPage from '../pages/OperationsPage';
import AssignmentsPage from '../pages/AssignmentsPage';
import PunchPage from '../pages/PunchPage';
import NotificationsPage from '../pages/NotificationsPage';
import ReportsPage from '../pages/ReportsPage';
import SchedulingPage from '../pages/SchedulingPage';

interface DashboardProps {
  onLogout: () => void;
}

// Componente Dashboard Home
const DashboardHome: React.FC<{ user: User | null }> = ({ user }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let data;
        if (user?.role === 'admin') {
          data = await dashboardService.getAdminDashboard();
        } else if (user?.role === 'manager') {
          data = await dashboardService.getManagerDashboard();
        } else {
          data = await dashboardService.getEmployeeDashboard();
        }
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        // Datos de ejemplo si falla la conexión
        setStats({
          totalUsers: 42,
          totalStations: 8,
          activeOperations: 15,
          totalAssignments: 28
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="text-sm text-gray-400">
          Bienvenido, {user?.name}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-20">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Usuarios</p>
              <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Estaciones</p>
              <p className="text-2xl font-bold text-white">{stats?.totalStations || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Operaciones Activas</p>
              <p className="text-2xl font-bold text-white">{stats?.activeOperations || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 bg-opacity-20">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Asignaciones</p>
              <p className="text-2xl font-bold text-white">{stats?.totalAssignments || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-white">Nueva operación asignada</p>
              <p className="text-xs text-gray-400">Hace 5 minutos</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-white">Usuario registrado en el sistema</p>
              <p className="text-xs text-gray-400">Hace 15 minutos</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm text-white">Turno completado</p>
              <p className="text-xs text-gray-400">Hace 1 hora</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'users':
        return <UsersPage />;
      case 'stations':
        return <StationsPage />;
      case 'operations':
        return <OperationsPage />;
      case 'assignments':
        return <AssignmentsPage />;
      case 'punch':
        return <PunchPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'scheduling':
        return <SchedulingPage />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} onLogout={onLogout} />
      <div className="flex">
        <Sidebar 
          user={user} 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
