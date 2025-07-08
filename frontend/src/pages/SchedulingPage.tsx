import React, { useState, useEffect } from 'react';
import { schedulingService, userService, operationService, type User, type Operation } from '../services/api';

const SchedulingPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'availability' | 'optimization'>('availability');

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
      // Mock data that matches the types
      setUsers([
        { 
          id: 1, 
          name: 'Juan Pérez', 
          email: 'juan@example.com', 
          role: 'employee' as const, 
          stationId: 1,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        { 
          id: 2, 
          name: 'María González', 
          email: 'maria@example.com', 
          role: 'employee' as const, 
          stationId: 2,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]);
      setOperations([
        {
          id: 1,
          name: 'Flight AA123',
          flightNumber: 'AA123',
          origin: 'MIA',
          destination: 'JFK',
          type: 'DEPARTURE' as const,
          scheduledTime: '2024-01-15T10:00:00Z',
          status: 'SCHEDULED' as const,
          passengerCount: 150,
          flightType: 'DOMESTIC' as const
        }
      ]);
    }
  };

  const checkAvailability = async (operationId: number) => {
    setLoading(true);
    setAvailableStaff([]);
    try {
      console.log('🔵 Verificando disponibilidad para operación:', operationId);
      const data = await schedulingService.getAvailableStaff(operationId);
      console.log('🔵 Personal disponible recibido:', data);
      
      // Transformar datos del backend al formato esperado por el frontend
      const transformedData = data.map((user: any) => ({
        userId: user.id,
        name: user.name,
        role: user.role,
        skills: user.skills || [],
        currentAssignments: user.currentAssignments || 0,
        availability: user.isAvailable ? 'available' : 'unavailable',
        experience: user.experience || 'junior',
        station: user.station?.name || 'N/A',
        email: user.email
      }));
      
      setAvailableStaff(transformedData);
      
      if (transformedData.length === 0) {
        alert('No hay personal disponible para esta operación');
      }
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      alert('Error al verificar disponibilidad: ' + (error as Error).message);
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
    setOptimizationResult(null);
    try {
      console.log('🔵 Calculando configuración óptima para operación:', operationId);
      const result = await schedulingService.getOptimalStaffing(operationId);
      console.log('🔵 Resultado de optimización:', result);
      
      setOptimizationResult(result);
      
      if (result.availableStaff.length === 0) {
        alert('Advertencia: No hay personal disponible para esta operación');
      } else {
        alert(`Configuración óptima calculada:\n- Personal mínimo: ${result.minimumStaff}\n- Personal recomendado: ${result.recommendedStaff}\n- Personal disponible: ${result.availableStaff.length}`);
      }
    } catch (error) {
      console.error('❌ Error getting optimal staffing:', error);
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
                      {staff.skills && staff.skills.length > 0 ? (
                        staff.skills.map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">Sin habilidades específicas</span>
                      )}
                    </div>
                  </div>
                  {staff.station && (
                    <p className="text-gray-300">
                      <span className="font-medium">Estación:</span> {staff.station}
                    </p>
                  )}
                  {staff.email && (
                    <p className="text-gray-300 text-xs">
                      <span className="font-medium">Email:</span> {staff.email}
                    </p>
                  )}
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
          <div className="flex items-end">
            <button
              onClick={() => selectedOperation && getOptimalStaffing(selectedOperation)}
              disabled={!selectedOperation || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Calcular Configuración Óptima'}
            </button>
          </div>
        </div>
      </div>

      {optimizationResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Resultado de Optimización</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="stat-card">
              <h3 className="text-sm font-medium text-gray-400">Personal Mínimo</h3>
              <p className="text-2xl font-bold text-white">{optimizationResult.minimumStaff}</p>
              <p className="text-xs text-gray-400 mt-1">Requerido</p>
            </div>
            <div className="stat-card">
              <h3 className="text-sm font-medium text-gray-400">Personal Recomendado</h3>
              <p className="text-2xl font-bold text-white">{optimizationResult.recommendedStaff}</p>
              <p className="text-xs text-gray-400 mt-1">Óptimo</p>
            </div>
            <div className="stat-card">
              <h3 className="text-sm font-medium text-gray-400">Personal Disponible</h3>
              <p className="text-2xl font-bold text-white">{optimizationResult.availableStaff.length}</p>
              <p className="text-xs text-gray-400 mt-1">Actual</p>
            </div>
          </div>

          {optimizationResult.skillsNeeded && optimizationResult.skillsNeeded.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Habilidades Requeridas</h4>
              <div className="flex flex-wrap gap-2">
                {optimizationResult.skillsNeeded.map((skill: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-purple-900 text-purple-200 text-sm rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-white font-medium mb-3">Personal Disponible</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optimizationResult.availableStaff.map((staff: any, index: number) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-white font-medium">{staff.name}</h5>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-900 text-green-200">
                      Disponible
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p><span className="font-medium">Rol:</span> {staff.role}</p>
                    <p><span className="font-medium">Estación:</span> {staff.station?.name || 'N/A'}</p>
                    {staff.skills && staff.skills.length > 0 && (
                      <div className="mt-2">
                        <span className="font-medium">Habilidades:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {staff.skills.map((skill: string, skillIndex: number) => (
                            <span key={skillIndex} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Eficiencia Actual</h3>
          <p className="text-2xl font-bold text-white">
            {optimizationResult 
              ? Math.round((optimizationResult.availableStaff.length / optimizationResult.recommendedStaff) * 100)
              : 78}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {optimizationResult ? 'Calculado' : 'Promedio del mes'}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Cobertura de Habilidades</h3>
          <p className="text-2xl font-bold text-white">
            {optimizationResult 
              ? Math.round((optimizationResult.skillsNeeded?.length || 0) / Math.max(1, optimizationResult.availableStaff.length) * 100)
              : 85}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {optimizationResult ? 'Actual' : 'Promedio'}
          </p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-medium text-gray-400">Personal Óptimo</h3>
          <p className="text-2xl font-bold text-white">
            {optimizationResult 
              ? (optimizationResult.availableStaff.length >= optimizationResult.recommendedStaff ? '✓' : '⚠️')
              : '⚠️'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {optimizationResult 
              ? (optimizationResult.availableStaff.length >= optimizationResult.recommendedStaff ? 'Suficiente' : 'Insuficiente')
              : 'Pendiente'}
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recomendaciones</h3>
        <div className="space-y-4">
          {optimizationResult ? (
            <>
              {optimizationResult.availableStaff.length < optimizationResult.minimumStaff && (
                <div className="flex items-start space-x-3 p-4 bg-red-900 bg-opacity-30 rounded-lg">
                  <svg className="w-6 h-6 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Personal Insuficiente</h4>
                    <p className="text-red-200 text-sm">
                      Se necesitan al menos {optimizationResult.minimumStaff} empleados. Solo hay {optimizationResult.availableStaff.length} disponibles.
                    </p>
                  </div>
                </div>
              )}
              
              {optimizationResult.availableStaff.length >= optimizationResult.minimumStaff && 
               optimizationResult.availableStaff.length < optimizationResult.recommendedStaff && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Personal Limitado</h4>
                    <p className="text-yellow-200 text-sm">
                      Se recomienda {optimizationResult.recommendedStaff} empleados para operación óptima. Considere asignar {optimizationResult.recommendedStaff - optimizationResult.availableStaff.length} empleados adicionales.
                    </p>
                  </div>
                </div>
              )}
              
              {optimizationResult.availableStaff.length >= optimizationResult.recommendedStaff && (
                <div className="flex items-start space-x-3 p-4 bg-green-900 bg-opacity-30 rounded-lg">
                  <svg className="w-6 h-6 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Personal Óptimo</h4>
                    <p className="text-green-200 text-sm">
                      Hay suficiente personal disponible para la operación. {optimizationResult.availableStaff.length} empleados están listos.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start space-x-3 p-4 bg-blue-900 bg-opacity-30 rounded-lg">
              <svg className="w-6 h-6 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-white font-medium">Seleccione una Operación</h4>
                <p className="text-blue-200 text-sm">
                  Elija una operación y haga clic en "Calcular Configuración Óptima" para obtener recomendaciones específicas.
                </p>
              </div>
            </div>
          )}
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
          Verificar Disponibilidad
        </button>
        <button
          onClick={() => setSelectedView('optimization')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedView === 'optimization'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Optimización de Personal
        </button>
      </div>

      {/* Contenido dinámico */}
      {selectedView === 'availability' && renderAvailabilityView()}
      {selectedView === 'optimization' && renderOptimizationView()}
    </div>
  );
};

export default SchedulingPage;
