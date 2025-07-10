import React, { useState, useEffect } from 'react';
import { schedulingService, userService, operationService, stationService, type User, type Operation, type Station } from '../services/api';
import StationAssignmentManager from '../components/StationAssignmentManager';
import StaffOptimizationPanel from '../components/StaffOptimizationPanel';

// Función helper para traducir roles
const translateRole = (role: string): string => {
  const roleTranslations: { [key: string]: string } = {
    'employee': 'Empleado',
    'supervisor': 'Supervisor', 
    'manager': 'Gerente',
    'president': 'Presidente',
    'admin': 'Administrador'
  };
  return roleTranslations[role] || role;
};

const SchedulingPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'availability' | 'optimization' | 'stations'>('availability');
  const [showStationManager, setShowStationManager] = useState(false);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [usersData, operationsData, stationsData] = await Promise.all([
        userService.getUsers(),
        operationService.getOperations(),
        stationService.getStations()
      ]);
      setUsers(usersData);
      setOperations(operationsData);
      setStations(stationsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // En caso de error, mantener arrays vacíos para que la UI funcione
      setUsers([]);
      setOperations([]);
      setStations([]);
    }
  };

  const checkAvailability = async (operationId: number) => {
    setLoading(true);
    try {
      // Usar datos reales de la base de datos en lugar de mock data
      const data = await schedulingService.checkAvailability({
        operationId,
        date: new Date().toISOString()
      });
      
      // Si la respuesta tiene datos reales, usarlos
      if (data && data.availableStaff && data.availableStaff.length > 0) {
        setAvailableStaff(data.availableStaff);
      } else {
        // Si no hay datos del backend, mostrar usuarios reales de la base de datos
        const realUsers = await userService.getAllUsers();
        const availableUsers = realUsers
          .filter(user => user.role !== 'admin' && user.role !== 'president')
          .map(user => ({
            userId: user.id,
            name: user.name,
            role: user.role,
            stationId: user.stationId,
            stationName: stations.find(s => s.id === user.stationId)?.name || 'Sin estación',
            skills: user.skills || [],
            currentAssignments: 0, // Esto se puede calcular con datos reales
            availability: user.isAvailable ? 'available' : 'unavailable',
            experience: 'senior' // Esto se puede determinar con datos reales
          }));
        setAvailableStaff(availableUsers);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // En caso de error total, mostrar mensaje de error en lugar de datos ficticios
      setAvailableStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const validateAssignment = async (assignmentData: any) => {
    try {
      const validation = await schedulingService.validateAssignment(assignmentData);
      alert(`Validación: ${validation.valid ? 'Válida' : 'Inválida'}\n${validation.message || ''}`);
    } catch (error) {
      console.error('Error validating assignment:', error);
      alert('Error al validar la asignación');
    }
  };

  const getOptimalStaffing = async (operationId: number) => {
    setLoading(true);
    try {
      // Usar el método correcto optimizeStaffing que implementamos
      const optimal = await schedulingService.optimizeStaffing(operationId);
      console.log('Optimal staffing:', optimal);
      
      // Mostrar resultados en una alerta más detallada
      let message = `Optimización completada:\n`;
      message += `Personal suficiente: ${optimal.minimumStaffMet ? 'Sí' : 'No'}\n`;
      message += `Disponible: ${optimal.staffAvailability.available}\n`;
      message += `Requerido: ${optimal.staffAvailability.required}\n`;
      
      if (optimal.optimizationSuggestions.length > 0) {
        message += `\nSugerencias:\n${optimal.optimizationSuggestions.slice(0, 3).join('\n')}`;
      }
      
      alert(message);
    } catch (error) {
      console.error('Error getting optimal staffing:', error);
      alert('Error al calcular configuración óptima: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const renderAvailabilityView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Verificar Disponibilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seleccionar Operación
            </label>
            <select
              value={selectedOperation || ''}
              onChange={(e) => setSelectedOperation(Number(e.target.value))}
              className="input-field"
            >
              <option value="">Selecciona una operación</option>
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.flightNumber} - {op.name || 'N/A'} ({op.scheduledTime ? new Date(op.scheduledTime!).toLocaleString() : 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => selectedOperation && checkAvailability(selectedOperation)}
              disabled={!selectedOperation || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar Disponibilidad'}
            </button>
          </div>
        </div>
      </div>

      {availableStaff.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Personal Disponible</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableStaff.map((staff) => (
              <div key={staff.userId} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{staff.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    staff.availability === 'available' ? 'bg-green-900 text-green-200' :
                    staff.availability === 'limited' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-red-900 text-red-200'
                  }`}>
                    {staff.availability === 'available' ? 'Disponible' :
                     staff.availability === 'limited' ? 'Limitado' : 'No disponible'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium">Rol:</span> {translateRole(staff.role)}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Experiencia:</span> {staff.experience}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Asignaciones actuales:</span> {staff.currentAssignments}
                  </p>
                  <div>
                    <span className="font-medium text-gray-300">Habilidades:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staff.skills?.map((skill: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => validateAssignment({
                    userId: staff.userId,
                    operationId: selectedOperation,
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
                  })}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  Validar Asignación
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOptimizationView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Optimización de Personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Operación para Optimizar
            </label>
            <select
              value={selectedOperation || ''}
              onChange={(e) => setSelectedOperation(Number(e.target.value))}
              className="input-field"
            >
              <option value="">Selecciona una operación</option>
              {operations.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.flightNumber} - {op.name || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={() => selectedOperation && getOptimalStaffing(selectedOperation)}
              disabled={!selectedOperation || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Optimizando...' : 'Calcular Configuración Óptima'}
            </button>
            <button
              onClick={() => setShowOptimizationPanel(true)}
              className="btn-secondary"
            >
              Ver Panel Detallado
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Eficiencia Actual</h3>
          <p className="text-2xl font-bold text-white">78%</p>
          <p className="text-xs text-gray-400 mt-1">Promedio del mes</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Costos de Personal</h3>
          <p className="text-2xl font-bold text-white">$24,560</p>
          <p className="text-xs text-gray-400 mt-1">Este mes</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Horas Extra</h3>
          <p className="text-2xl font-bold text-white">45h</p>
          <p className="text-xs text-gray-400 mt-1">Esta semana</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recomendaciones de Optimización</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
            <svg className="w-6 h-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-white font-medium">Redistribuir Turnos</h4>
              <p className="text-blue-200 text-sm">
                Considerar redistribuir los turnos de la tarde para reducir horas extra en un 15%
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
            <svg className="w-6 h-6 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-white font-medium">Capacitación Cruzada</h4>
              <p className="text-yellow-200 text-sm">
                3 empleados necesitan capacitación en habilidades adicionales para mayor flexibilidad
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 bg-green-900 bg-opacity-30 rounded-lg">
            <svg className="w-6 h-6 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-white font-medium">Ahorro Potencial</h4>
              <p className="text-green-200 text-sm">
                Optimización podría ahorrar hasta $3,200 mensuales en costos de personal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Nueva vista para gestión de estaciones
  const renderStationsView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Gestión de Estaciones</h3>
        <p className="text-gray-300 mb-4">
          Visualiza y gestiona las asignaciones de personal a cada estación del aeropuerto.
        </p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-400">
              Total de estaciones: {stations.length} • Personal asignado: {users.filter(u => u.stationId).length}
            </p>
          </div>
          <button
            onClick={() => setShowStationManager(true)}
            className="btn-primary"
          >
            Gestionar Asignaciones de Estación
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Personal por Estación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mostrar estaciones reales de la base de datos */}
          {stations.map(station => {
            const stationUsers = users.filter(u => u.stationId === station.id);
            
            return (
              <div key={station.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{station.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    station.isActive ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                  }`}>
                    {station.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium">Código:</span> {station.code || 'N/A'}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Tipo:</span> {station.type}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Personal:</span> {stationUsers.length} / {station.minimumStaff}-{station.maximumStaff}
                  </p>
                  
                  {stationUsers.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-gray-400 text-xs mb-1">Personal asignado:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {stationUsers.map(user => (
                          <div key={user.id} className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1">
                            {user.name} - {translateRole(user.role)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-yellow-400">
                      Sin personal asignado
                    </div>
                  )}

                  <div className={`text-xs font-medium mt-2 ${
                    stationUsers.length >= station.minimumStaff ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Estado: {stationUsers.length >= station.minimumStaff ? 'Óptimo' : 'Insuficiente'}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Mostrar usuarios sin estación asignada */}
          {users.filter(u => !u.stationId && u.role !== 'president').length > 0 && (
            <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4 border border-yellow-600">
              <h4 className="text-yellow-200 font-medium mb-2">⚠️ Sin Estación Asignada</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {users.filter(u => !u.stationId && u.role !== 'president').map(user => (
                  <div key={user.id} className="text-xs text-yellow-300 bg-yellow-900 bg-opacity-50 rounded px-2 py-1">
                    {user.name} - {translateRole(user.role)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Resumen de Asignaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-200">{stations.length}</div>
              <div className="text-blue-200 text-sm">Total Estaciones</div>
            </div>
          </div>
          <div className="bg-green-900 bg-opacity-30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-200">{users.filter(u => u.stationId).length}</div>
              <div className="text-green-200 text-sm">Personal Asignado</div>
            </div>
          </div>
          <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-200">{users.filter(u => !u.stationId && u.role !== 'president').length}</div>
              <div className="text-yellow-200 text-sm">Sin Asignar</div>
            </div>
          </div>
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-200">{stations.filter(s => s.isActive).length}</div>
              <div className="text-purple-200 text-sm">Estaciones Activas</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-gray-200 font-medium mb-2">📋 Información sobre Asignaciones:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Use el botón "Gestionar Asignaciones de Estación" para asignar o cambiar la estación de cada empleado.</li>
            <li>• Solo se puede asignar estaciones a empleados, supervisores, gerentes y administradores.</li>
            <li>• Los presidentes no requieren asignación de estación específica.</li>
            <li>• Cada estación muestra su capacidad mínima y máxima de personal.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Programación y Optimización</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStationManager(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            Gestionar Estaciones
          </button>
          <button
            onClick={() => setShowOptimizationPanel(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Optimización Avanzada
          </button>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedView('availability')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedView === 'availability'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Disponibilidad
        </button>
        <button
          onClick={() => setSelectedView('optimization')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedView === 'optimization'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Optimización
        </button>
        <button
          onClick={() => setSelectedView('stations')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedView === 'stations'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Gestión de Estaciones
        </button>
      </div>

      {/* Contenido dinámico */}
      {selectedView === 'availability' && renderAvailabilityView()}
      {selectedView === 'optimization' && renderOptimizationView()}
      {selectedView === 'stations' && renderStationsView()}

      {/* Modales */}
      {showStationManager && (
        <StationAssignmentManager onClose={() => setShowStationManager(false)} />
      )}
      
      {showOptimizationPanel && (
        <StaffOptimizationPanel 
          operationId={selectedOperation || undefined}
          onClose={() => setShowOptimizationPanel(false)} 
        />
      )}
    </div>
  );
};

export default SchedulingPage;
