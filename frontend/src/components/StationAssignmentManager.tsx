import React, { useState, useEffect } from 'react';
import { userService, stationService } from '../services/api';
import type { User, Station } from '../services/api';

interface StationAssignmentManagerProps {
  onClose: () => void;
  selectedUser?: User;
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

const StationAssignmentManager: React.FC<StationAssignmentManagerProps> = ({ onClose, selectedUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(selectedUser?.id || 0);
  const [selectedStationId, setSelectedStationId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, stationsData] = await Promise.all([
        userService.getAllUsers(),
        stationService.getAllStations()
      ]);
      // Filtrar usuarios para excluir presidentes
      const filteredUsers = usersData.filter(user => user.role?.toUpperCase() !== 'PRESIDENT');
      setUsers(filteredUsers);
      setStations(stationsData);
    } catch (error: any) {
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStation = async () => {
    if (!selectedUserId || !selectedStationId) {
      setError('Debe seleccionar un usuario y una estación');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await userService.assignStation(selectedUserId, selectedStationId);
      setSuccess('Estación asignada exitosamente');
      await loadData(); // Recargar datos
      
      // Limpiar formulario después de éxito
      setTimeout(() => {
        setSuccess('');
        if (!selectedUser) { // Solo limpiar si no es un usuario específico
          setSelectedUserId(0);
        }
        setSelectedStationId(0);
      }, 2000);
    } catch (error: any) {
      setError('Error al asignar estación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStation = async () => {
    if (!selectedUserId) {
      setError('Debe seleccionar un usuario');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await userService.removeStationAssignment(selectedUserId);
      setSuccess('Asignación de estación removida exitosamente');
      await loadData(); // Recargar datos
    } catch (error: any) {
      setError('Error al remover asignación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u.id === selectedUserId);
  const selectedStationData = stations.find(s => s.id === selectedStationId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Gestión de Asignación de Estaciones
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Solo se pueden asignar estaciones a empleados, supervisores, gerentes y administradores. 
            Los presidentes no requieren asignación de estación específica.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Selector de Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={!!selectedUser || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value={0}>Seleccione un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({translateRole(user.role)}) 
                  {user.stationId && ` - Estación: ${stations.find(s => s.id === user.stationId)?.name || `ID: ${user.stationId}`}`}
                </option>
              ))}
            </select>
          </div>

          {/* Información del usuario seleccionado */}
          {selectedUserData && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm"><strong>Usuario:</strong> {selectedUserData.name}</p>
              <p className="text-sm"><strong>Rol:</strong> {translateRole(selectedUserData.role)}</p>
              <p className="text-sm">
                <strong>Estación actual:</strong> {
                  selectedUserData.stationId 
                    ? stations.find(s => s.id === selectedUserData.stationId)?.name || `ID: ${selectedUserData.stationId}`
                    : 'Sin asignar'
                }
              </p>
            </div>
          )}

          {/* Selector de Estación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Estación
            </label>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Seleccione una estación</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.code}) - Personal mínimo: {station.minimumStaff || 'No definido'}
                </option>
              ))}
            </select>
          </div>

          {/* Información de la estación seleccionada */}
          {selectedStationData && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm"><strong>Estación:</strong> {selectedStationData.name}</p>
              <p className="text-sm"><strong>Código:</strong> {selectedStationData.code}</p>
              <p className="text-sm"><strong>Personal mínimo:</strong> {selectedStationData.minimumStaff || 'No definido'}</p>
              <p className="text-sm"><strong>Personal máximo:</strong> {selectedStationData.maximumStaff || 'No definido'}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleAssignStation}
              disabled={loading || !selectedUserId || !selectedStationId}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Asignar Estación'}
            </button>
            
            <button
              onClick={handleRemoveStation}
              disabled={loading || !selectedUserId || !selectedUserData?.stationId}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Remover Asignación
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationAssignmentManager;
