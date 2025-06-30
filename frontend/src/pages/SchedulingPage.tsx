import React, { useState, useEffect } from 'react';
import { schedulingService, userService, operationService, type User, type Operation } from '../services/api';

const SchedulingPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'availability' | 'assignment' | 'optimization'>('availability');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [usersData, operationsData] = await Promise.all([
        userService.getUsers(),
        operationService.getOperations()
      ]);
      setUsers(usersData);
      setOperations(operationsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Datos de ejemplo
      setUsers([
        { id: 1, name: 'Juan Pérez', email: 'juan@example.com', role: 'employee', stationId: 1 },
        { id: 2, name: 'María González', email: 'maria@example.com', role: 'employee', stationId: 2 }
      ]);
      setOperations([
        {
          id: 1,
          flightNumber: 'AA123',
          airline: 'American Airlines',
          origin: 'MIA',
          destination: 'JFK',
          operationType: 'departure',
          scheduledTime: '2024-01-15T10:00:00Z',
          status: 'scheduled'
        }
      ]);
    }
  };

  const checkAvailability = async (operationId: number) => {
    setLoading(true);
    try {
      const data = await schedulingService.getAvailableStaff(operationId);
      setAvailableStaff(data);
    } catch (error) {
      console.error('Error checking availability:', error);
      // Datos de ejemplo
      setAvailableStaff([
        {
          userId: 1,
          name: 'Juan Pérez',
          role: 'employee',
          skills: ['ground_handling', 'baggage'],
          currentAssignments: 2,
          availability: 'available',
          experience: 'senior'
        },
        {
          userId: 2,
          name: 'María González',
          role: 'employee',
          skills: ['security', 'customer_service'],
          currentAssignments: 1,
          availability: 'limited',
          experience: 'junior'
        }
      ]);
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
      const optimal = await schedulingService.getOptimalStaffing(operationId);
      console.log('Optimal staffing:', optimal);
      alert('Configuración óptima calculada');
    } catch (error) {
      console.error('Error getting optimal staffing:', error);
      alert('Error al calcular configuración óptima');
    } finally {
      setLoading(false);
    }
  };

  const createReplacement = async (replacementData: any) => {
    try {
      await schedulingService.createReplacement(replacementData);
      alert('Reemplazo creado exitosamente');
    } catch (error) {
      console.error('Error creating replacement:', error);
      alert('Error al crear reemplazo');
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
                  {op.flightNumber} - {op.airline || 'N/A'} ({op.scheduledTime ? new Date(op.scheduledTime!).toLocaleString() : 'N/A'})
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
                    <span className="font-medium">Rol:</span> {staff.role}
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

  const renderAssignmentView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Crear Nueva Asignación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Empleado
              </label>
              <select className="input-field">
                <option value="">Selecciona un empleado</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operación
              </label>
              <select className="input-field">
                <option value="">Selecciona una operación</option>
                {operations.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.flightNumber} - {op.airline || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hora de inicio
              </label>
              <input
                type="datetime-local"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hora de fin
              </label>
              <input
                type="datetime-local"
                className="input-field"
              />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 mt-6">
          <button className="btn-primary">
            Crear Asignación
          </button>
          <button className="btn-secondary">
            Validar Antes de Crear
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Crear Reemplazo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Empleado Original
            </label>
            <select className="input-field">
              <option value="">Selecciona empleado</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Empleado Reemplazo
            </label>
            <select className="input-field">
              <option value="">Selecciona reemplazo</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => createReplacement({
                originalUserId: 1,
                replacementUserId: 2,
                reason: 'Enfermedad',
                date: new Date().toISOString()
              })}
              className="btn-primary w-full"
            >
              Crear Reemplazo
            </button>
          </div>
        </div>
      </div>
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
                  {op.flightNumber} - {op.airline || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => selectedOperation && getOptimalStaffing(selectedOperation)}
              disabled={!selectedOperation || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Optimizando...' : 'Calcular Configuración Óptima'}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Programación y Optimización</h1>
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
          onClick={() => setSelectedView('assignment')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedView === 'assignment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Asignaciones
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
      </div>

      {/* Contenido dinámico */}
      {selectedView === 'availability' && renderAvailabilityView()}
      {selectedView === 'assignment' && renderAssignmentView()}
      {selectedView === 'optimization' && renderOptimizationView()}
    </div>
  );
};

export default SchedulingPage;
