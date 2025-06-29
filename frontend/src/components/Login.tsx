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

    console.log('📧 Login form submitted:', { 
      email, 
      hasPassword: !!password,
      passwordLength: password.length 
    });

    try {
      const response = await authService.login({ email, password });
      
      console.log('✅ Login successful in component, response:', { 
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        userRole: response.user?.role,
        userName: response.user?.name,
        tokenPreview: response.access_token?.substring(0, 20) + '...'
      });
      
      // Verificar que authService ya guardó el token
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      console.log('💾 Check localStorage after authService:', {
        hasSavedToken: !!savedToken,
        hasSavedUser: !!savedUser,
        savedTokenPreview: savedToken?.substring(0, 20) + '...',
        savedUserData: savedUser ? JSON.parse(savedUser) : null
      });
      
      // Si no se guardó, guardarlo manualmente (backup)
      if (!savedToken && response.access_token) {
        console.log('🔧 Backup: Saving token manually');
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      console.log('🏠 Redirecting to dashboard');
      onLogin(response.user);
      
    } catch (err: any) {
      console.error('❌ Login failed:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
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
        </div>
      </div>
    </div>
  );
};

export default Login;
