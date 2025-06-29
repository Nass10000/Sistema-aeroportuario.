import React, { useState } from 'react';
import { authService } from '../services/api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin(response.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: string) => {
    switch (role) {
      case 'admin':
        setEmail('admin@aereo.com');
        setPassword('admin123');
        break;
      case 'manager':
        setEmail('manager@aereo.com');
        setPassword('manager123');
        break;
      case 'employee':
        setEmail('employee@aereo.com');
        setPassword('employee123');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="card-dark">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sistema Aeroportuario</h2>
            <p className="text-gray-400">Control y gestión de operaciones aeroportuarias</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400 mb-4">Credenciales de prueba:</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Administrador</p>
                    <p className="text-xs text-gray-400">admin@aereo.com</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">Admin</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager')}
                className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Gerente</p>
                    <p className="text-xs text-gray-400">manager@aereo.com</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Manager</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('employee')}
                className="text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Empleado</p>
                    <p className="text-xs text-gray-400">employee@aereo.com</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">Employee</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
