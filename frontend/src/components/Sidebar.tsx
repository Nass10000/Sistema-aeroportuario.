import React from 'react';
import type { User } from '../services/api';

interface SidebarProps {
  user: User | null;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeSection, onSectionChange }) => {
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor', 'employee', 'president']
    },
    {
      id: 'users',
      name: 'Usuarios',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor']
    },
    {
      id: 'stations',
      name: 'Estaciones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
        </svg>
      ),
      roles: ['admin'] // Solo admins pueden ver gestión de estaciones
    },
    {
      id: 'operations',
      name: 'Operaciones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor', 'employee']
    },
    {
      id: 'assignments',
      name: 'Asignaciones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor']
    },
    {
      id: 'punch',
      name: 'Control Horario',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor', 'employee']
    },
    {
      id: 'reports',
      name: 'Reportes',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor', 'president']
    },
    {
      id: 'notifications',
      name: 'Notificaciones',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor', 'employee']
    },
    {
      id: 'scheduling',
      name: 'Programación',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
        </svg>
      ),
      roles: ['admin', 'manager', 'supervisor']
    },
  ];

  const visibleItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="sidebar w-80 min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-gray-900 shadow-2xl border-r border-blue-800">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-8 flex items-center space-x-3">
          <span className="text-2xl font-bold text-white tracking-wide">AEO Sistema</span>
          <span className="bg-blue-700 text-xs text-white px-2 py-1 rounded-full font-semibold">Control Aeroportuario</span>
        </div>
        <nav className="space-y-2 flex-1">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 text-base font-medium group shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-900
                ${activeSection === item.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'text-gray-300 hover:bg-blue-700 hover:text-white hover:scale-105'}
              `}
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        {user && (
          <div className="mt-10 flex items-center space-x-3 bg-blue-800/60 rounded-lg p-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {user.name?.[0] || user.email?.[0] || 'U'}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{user.name || user.email}</div>
              <div className="text-blue-200 text-xs capitalize">{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
