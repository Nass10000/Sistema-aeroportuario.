import React, { useState, useEffect } from 'react';
import { stationService } from '../services/api';
import type { User, Station } from '../services/api';

interface UserStationInfoProps {
  user: User | null;
}

const translateRole = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'Administrador';
    case 'manager': return 'Gerente';
    case 'supervisor': return 'Supervisor';
    case 'employee': return 'Empleado';
    case 'president': return 'Presidente';
    default: return 'Usuario';
  }
};

const UserStationInfo: React.FC<UserStationInfoProps> = ({ user }) => {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.stationId) {
      fetchStationInfo(user.stationId);
    }
  }, [user?.stationId]);

  const fetchStationInfo = async (stationId: number) => {
    try {
      setLoading(true);
      const stationData = await stationService.getStationById(stationId);
      setStation(stationData);
      setError('');
    } catch (error: any) {
      setError('Error al cargar información de la estación');
      setStation(null);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Mi Estación Asignada</h3>
      
      <div className="bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">{user.name}</h4>
          <span className="px-2 py-1 text-xs font-medium text-white rounded-full bg-blue-600">
            {translateRole(user.role)}
          </span>
        </div>

        {loading && (
          <div className="text-gray-300 text-sm">
            Cargando información de la estación...
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        {!user.stationId && !loading && (
          <div className="text-gray-300 text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Sin estación asignada</span>
            </div>
            <p className="text-xs">
              Contacta con tu administrador para que te asigne una estación de trabajo.
            </p>
          </div>
        )}

        {station && !loading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Estación:</span>
                <p className="text-white font-medium">{station.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Código:</span>
                <p className="text-white font-medium">{station.code || 'N/A'}</p>
              </div>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-400">Ubicación:</span>
              <p className="text-white">{station.location || 'No especificada'}</p>
            </div>

            <div className="text-sm">
              <span className="text-gray-400">Tipo:</span>
              <p className="text-white">{station.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Personal Mín:</span>
                <p className="text-white font-medium">{station.minimumStaff}</p>
              </div>
              <div>
                <span className="text-gray-400">Personal Máx:</span>
                <p className="text-white font-medium">{station.maximumStaff}</p>
              </div>
            </div>

            {station.description && (
              <div className="text-sm">
                <span className="text-gray-400">Descripción:</span>
                <p className="text-white text-xs mt-1">{station.description}</p>
              </div>
            )}

            <div className="flex items-center space-x-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${station.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`text-sm ${station.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {station.isActive ? 'Estación Activa' : 'Estación Inactiva'}
              </span>
            </div>
          </div>
        )}
      </div>

      {user.role === 'admin' && (
        <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>💼 Rol de Administrador:</strong> Puedes gestionar las asignaciones de estaciones 
            de todos los usuarios desde la sección de administración.
          </p>
        </div>
      )}

      {user.role === 'manager' && (
        <div className="mt-4 p-3 bg-purple-900 bg-opacity-30 rounded-lg">
          <p className="text-purple-200 text-sm">
            <strong>👨‍💼 Rol de Gerente:</strong> Puedes gestionar las asignaciones de empleados 
            y supervisores dentro de tu estación asignada.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserStationInfo;
