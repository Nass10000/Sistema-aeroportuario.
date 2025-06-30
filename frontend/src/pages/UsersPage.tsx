import React, { useState, useEffect } from 'react';
import { userService, authService, type User } from '../services/api';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'supervisor' | 'employee',
    stationId: '',
    category: 'baggage' as string
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'supervisor' | 'employee',
    stationId: '',
    category: 'baggage' as string
  });

  const validatePassword = (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  // Función para determinar si el usuario actual puede editar otro usuario
  const canEditUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // Admin puede editar a cualquiera
    if (currentUser.role === 'admin') return true;
    
    // Manager y Supervisor solo pueden editar empleados de su estación
    if ((currentUser.role === 'manager' || currentUser.role === 'supervisor')) {
      return targetUser.role === 'employee' && 
             targetUser.stationId === currentUser.stationId;
    }
    
    return false;
  };

  // Función para determinar si se puede editar el rol del usuario objetivo
  const canEditRole = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // Solo admin puede editar roles de managers y supervisores
    if (targetUser.role === 'manager' || targetUser.role === 'supervisor') {
      return currentUser.role === 'admin';
    }
    
    // Admin puede editar cualquier rol
    if (currentUser.role === 'admin') return true;
    
    // Manager y Supervisor pueden editar roles de empleados
    if ((currentUser.role === 'manager' || currentUser.role === 'supervisor')) {
      return targetUser.role === 'employee';
    }
    
    return false;
  };

  // Función para determinar si se puede editar el stationId del usuario objetivo
  const canEditStationId = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // Solo admin puede editar stationId de managers y supervisores
    if (targetUser.role === 'manager' || targetUser.role === 'supervisor') {
      return currentUser.role === 'admin';
    }
    
    // Admin puede editar cualquier stationId
    if (currentUser.role === 'admin') return true;
    
    // Manager y Supervisor NO pueden cambiar stationId de empleados
    return false;
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar contraseña antes de enviar
    if (!validatePassword(newUser.password)) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }
    
    try {
      await userService.createUser({
        ...newUser,
        stationId: newUser.stationId ? parseInt(newUser.stationId) : undefined,
        category: newUser.role === 'employee' ? newUser.category : undefined
      });
      setShowCreateForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'employee', stationId: '', category: 'baggage' });
      fetchUsers();
      setError(''); // Limpiar errores previos
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'manager' | 'supervisor' | 'employee',
      stationId: user.stationId?.toString() || '',
      category: user.category || 'baggage'
    });
    setShowEditForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await userService.updateUser(editingUser.id, {
        ...editUser,
        stationId: editUser.stationId ? parseInt(editUser.stationId) : undefined,
        category: editUser.role === 'employee' ? editUser.category : undefined
      });
      setShowEditForm(false);
      setEditingUser(null);
      setEditUser({ name: '', email: '', role: 'employee', stationId: '', category: 'baggage' });
      fetchUsers();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600';
      case 'president': return 'bg-yellow-600';
      case 'manager': return 'bg-blue-600';
      case 'supervisor': return 'bg-purple-600';
      case 'employee': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'president': return 'Presidente';
      case 'manager': return 'Gerente';
      case 'supervisor': return 'Supervisor';
      case 'employee': return 'Empleado';
      default: return 'Usuario';
    }
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
        <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
        {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'supervisor') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Usuario
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Usuario</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Debe contener: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial (@$!%*?&)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rol</label>
                <select
                  className="input-field"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                >
                  <option value="employee">Empleado</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Gerente</option>
                  <option value="president">Presidente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {newUser.role === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoría de Empleado</label>
                  <select
                    className="input-field"
                    value={newUser.category}
                    onChange={(e) => setNewUser({ ...newUser, category: e.target.value })}
                    required
                  >
                    <option value="baggage">Equipaje</option>
                    <option value="fuel">Combustible</option>
                    <option value="ramp">Rampa</option>
                    <option value="cargo">Carga</option>
                    <option value="cleaning">Limpieza</option>
                    <option value="security">Seguridad</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="operations">Operaciones</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ID de Estación (opcional)</label>
                <input
                  type="number"
                  className="input-field"
                  value={newUser.stationId}
                  onChange={(e) => setNewUser({ ...newUser, stationId: e.target.value })}
                  placeholder="1, 2, 3..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Form Modal */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Editar Usuario</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rol</label>
                <select
                  className="input-field"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                  disabled={!canEditRole(editingUser)}
                >
                  <option value="employee">Empleado</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Gerente</option>
                  <option value="president">Presidente</option>
                  <option value="admin">Administrador</option>
                </select>
                {!canEditRole(editingUser) && (
                  <p className="text-xs text-gray-400 mt-1">
                    No tienes permisos para editar este rol
                  </p>
                )}
              </div>

              {editUser.role === 'employee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoría de Empleado</label>
                  <select
                    className="input-field"
                    value={editUser.category}
                    onChange={(e) => setEditUser({ ...editUser, category: e.target.value })}
                    required
                  >
                    <option value="baggage">Equipaje</option>
                    <option value="fuel">Combustible</option>
                    <option value="ramp">Rampa</option>
                    <option value="cargo">Carga</option>
                    <option value="cleaning">Limpieza</option>
                    <option value="security">Seguridad</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="operations">Operaciones</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ID de Estación (opcional)</label>
                <input
                  type="number"
                  className="input-field"
                  value={editUser.stationId}
                  onChange={(e) => setEditUser({ ...editUser, stationId: e.target.value })}
                  placeholder="1, 2, 3..."
                  disabled={!canEditStationId(editingUser)}
                />
                {!canEditStationId(editingUser) && (
                  <p className="text-xs text-gray-400 mt-1">
                    No tienes permisos para editar la estación de este usuario
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Actualizar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">ID</th>
                <th className="text-left py-3 px-4 text-gray-300">Nombre</th>
                <th className="text-left py-3 px-4 text-gray-300">Email</th>
                <th className="text-left py-3 px-4 text-gray-300">Rol</th>
                <th className="text-left py-3 px-4 text-gray-300">Estación</th>
                <th className="text-left py-3 px-4 text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="table-row border-b border-gray-700">
                  <td className="py-3 px-4 text-gray-300">#{user.id}</td>
                  <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-gray-300">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{user.stationId || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {canEditUser(user) && (
                        <button 
                          onClick={() => handleEditUser(user)} 
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Editar usuario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {currentUser?.role === 'admin' && (
                        <button 
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Eliminar usuario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      {!canEditUser(user) && currentUser?.role !== 'admin' && (
                        <span className="text-gray-500 text-xs">Sin permisos</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
