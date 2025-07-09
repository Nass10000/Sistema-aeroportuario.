import React from 'react';
import { authService, type User } from '../services/api';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const translateRole = (role: string): string => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'Administrador';
    case 'MANAGER': return 'Gerente';
    case 'SUPERVISOR': return 'Supervisor';
    case 'EMPLOYEE': return 'Empleado';
    case 'PRESIDENT': return 'Presidente';
    default: return 'Usuario';
  }
};

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return 'bg-red-600';
      case 'PRESIDENT': return 'bg-purple-600';
      case 'MANAGER': return 'bg-blue-600';
      case 'SUPERVISOR': return 'bg-indigo-600';
      case 'EMPLOYEE': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <nav className="navbar sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AEO Sistema</h1>
                <p className="text-xs text-gray-400">Control Aeroportuario</p>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getRoleColor(user.role)}`}>
                      {translateRole(user.role)}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botón de Logout */}
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
