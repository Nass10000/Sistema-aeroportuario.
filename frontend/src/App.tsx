import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { authService } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token almacenado y si es válido
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        // Verificar que el token no esté expirado (si es un JWT)
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = tokenPayload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
        } else {
          // Token expirado, limpiar storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Si hay error al procesar el token, usar el userData almacenado
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando aplicación...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
