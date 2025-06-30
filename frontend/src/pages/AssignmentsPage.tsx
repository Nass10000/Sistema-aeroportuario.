import React, { useState, useEffect } from 'react';
import { assignmentService, userService, operationService, authService, type Assignment, type User, type Operation } from '../services/api';
import MultiSelect from '../components/MultiSelect';

// Helper para extraer el valor numérico del objeto seleccionado (isMulti=false)
const getIdFromSelect = (field: any) =>
  field && typeof field.value !== 'undefined'
    ? Number(field.value)
    : null;

const AssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Cambia el estado para que acepte correctamente los valores de MultiSelect
  const [newAssignment, setNewAssignment] = useState<{
    userId: { value: string; label: string } | null;
    operationId: { value: string; label: string } | null;
    startTime: string;
    endTime: string;
    assignmentFunction: string;
    cost: string;
  }>({
    userId: null,
    operationId: null,
    startTime: '',
    endTime: '',
    assignmentFunction: '',
    cost: ''
  });

  const getUserOptions = () => users.map(user => ({
    value: user.id.toString(),
    label: `${user.name} (${user.email})`
  }));

  const getOperationOptions = () => operations.map(operation => ({
    value: operation.id.toString(),
    label: `${operation.flightNumber} - ${operation.origin} → ${operation.destination}`
  }));

  // Opciones para función de asignación
  const functionOptions = [
    { value: 'SUPERVISOR_EQUIPAJE', label: 'Supervisor de Equipaje' },
    { value: 'OPERADOR_EQUIPAJE', label: 'Operador de Equipaje' },
    { value: 'SUPERVISOR_RAMPA', label: 'Supervisor de Rampa' },
    { value: 'OPERADOR_RAMPA', label: 'Operador de Rampa' },
    { value: 'SUPERVISOR_COMBUSTIBLE', label: 'Supervisor de Combustible' },
    { value: 'OPERADOR_COMBUSTIBLE', label: 'Operador de Combustible' },
    { value: 'SUPERVISOR_CARGA', label: 'Supervisor de Carga' },
    { value: 'OPERADOR_CARGA', label: 'Operador de Carga' },
    { value: 'SUPERVISOR_LIMPIEZA', label: 'Supervisor de Limpieza' },
    { value: 'OPERADOR_LIMPIEZA', label: 'Operador de Limpieza' },
    { value: 'SUPERVISOR_SEGURIDAD', label: 'Supervisor de Seguridad' },
    { value: 'AGENTE_SEGURIDAD', label: 'Agente de Seguridad' },
    { value: 'TECNICO_MANTENIMIENTO', label: 'Técnico de Mantenimiento' },
    { value: 'COORDINADOR_OPERACIONES', label: 'Coordinador de Operaciones' },
  ];

  useEffect(() => {
    // Verificar permisos del usuario actual
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    // Solo permitir acceso a admin, manager y supervisor
    if (!user || user.role === 'employee' || user.role === 'president') {
      setError('No tienes permisos para acceder a las asignaciones');
      setLoading(false);
      return;
    }

    const loadAllData = async () => {
      setLoading(true);
      try {
        // Cargar usuarios y operaciones PRIMERO
        await Promise.all([fetchUsers(), fetchOperations()]);
        // Luego cargar asignaciones
        await fetchAssignments();
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments();
      console.log('📋 Asignaciones cargadas:', data); // Debug - estructura completa
      setAssignments(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      console.log('👥 Usuarios cargados:', data); // Debug
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err);
    }
  };

  const fetchOperations = async () => {
    try {
      const data = await operationService.getOperations();
      console.log('✈️ Operaciones cargadas:', data); // Debug
      setOperations(data);
    } catch (err: any) {
      console.error('Error loading operations:', err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extrae el id como número (permite 0)
    const userId = getIdFromSelect(newAssignment.userId);
    const operationId = getIdFromSelect(newAssignment.operationId);

    console.log('userId:', userId, 'operationId:', operationId);

    if (userId === null || operationId === null) {
      setError('Debes seleccionar usuario y operación válidos.');
      return;
    }
    if (
      !newAssignment.startTime ||
      !newAssignment.endTime ||
      !newAssignment.assignmentFunction ||
      !newAssignment.cost ||
      isNaN(Number(newAssignment.cost))
    ) {
      setError('Todos los campos son obligatorios y deben ser válidos.');
      return;
    }

    try {
      await assignmentService.createAssignment({
        userId: getIdFromSelect(newAssignment.userId),
        operationId: getIdFromSelect(newAssignment.operationId),
        startTime: new Date(newAssignment.startTime).toISOString(),
        endTime: new Date(newAssignment.endTime).toISOString(),
        function: newAssignment.assignmentFunction,
        cost: Number(newAssignment.cost)
      });
      setShowCreateForm(false);
      setNewAssignment({
        userId: null,
        operationId: null,
        startTime: '',
        endTime: '',
        assignmentFunction: '',
        cost: ''
      });
      fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear asignación');
    }
  };

  // ⚡ MODIFICADAS: soportan ambos formatos (ID u objeto)
  const getUserName = (assignment: any) => {
    const id = assignment.userId ?? assignment.user?.id;
    if (!id || !users.length) {
      return `Usuario #${id || 'undefined'}`;
    }
    let user = users.find(u => u.id === id);
    if (!user) user = users.find(u => Number(u.id) === Number(id));
    if (!user) user = users.find(u => u.id.toString() === id.toString());
    return user ? user.name : `Usuario #${id}`;
  };

  const getOperationInfo = (assignment: any) => {
    const id = assignment.operationId ?? assignment.operation?.id;
    if (!id || !operations.length) {
      return `Operación #${id || 'undefined'}`;
    }
    let operation = operations.find(o => o.id === id);
    if (!operation) operation = operations.find(o => Number(o.id) === Number(id));
    if (!operation) operation = operations.find(o => o.id.toString() === id.toString());
    return operation ?
      `${operation.flightNumber} - ${operation.origin} → ${operation.destination}` :
      `Operación #${id}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-600';
      case 'in_progress': return 'bg-yellow-600';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'assigned': return 'Asignado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getFunctionDisplayName = (functionCode: string) => {
    const functionOption = functionOptions.find(opt => opt.value === functionCode);
    return functionOption ? functionOption.label : functionCode;
  };

  const debugAssignmentData = (assignment: Assignment) => {
    console.log('🔍 Debug asignación completa:', {
      id: assignment.id,
      userId: (assignment as any).userId ?? (assignment as any).user?.id,
      operationId: (assignment as any).operationId ?? (assignment as any).operation?.id,
      // user: assignment.user, // Removed because Assignment has no 'user'
      // operation: assignment.operation, // Removed because Assignment has no 'operation'
      userType: typeof ((assignment as any).userId ?? (assignment as any).user?.id),
      operationType: typeof ((assignment as any).operationId ?? (assignment as any).operation?.id),
      allUsers: users.map(u => ({ id: u.id, name: u.name, type: typeof u.id })),
      allOperations: operations.map(o => ({ id: o.id, flightNumber: o.flightNumber, type: typeof o.id }))
    });
  };

  // Función para formatear fechas
  function formatDate(dateString?: string) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
  }

  // ⏳ Esperar a que cargue todo antes de mostrar la tabla
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Verificar permisos específicos
  if (currentUser && (currentUser.role === 'employee' || currentUser.role === 'president')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-900 border border-red-700 text-red-100 px-6 py-4 rounded-lg max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p>No tienes permisos para acceder a la gestión de asignaciones.</p>
          <p className="text-sm mt-2 text-red-300">
            {currentUser.role === 'employee' 
              ? 'Los empleados no pueden gestionar asignaciones.' 
              : 'Los presidentes solo tienen acceso de visualización.'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gestión de Asignaciones</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Asignación
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Assignment Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crear Nueva Asignación</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <MultiSelect
                label="Usuario"
                options={getUserOptions()}
                value={newAssignment.userId ? [newAssignment.userId] : []}
                onChange={selected => {
                  let option = Array.isArray(selected) ? selected[0] ?? null : selected;
                  if (option && typeof option.value !== 'string') {
                    option = { ...option, value: String(option.value) };
                  }
                  setNewAssignment({ ...newAssignment, userId: option });
                }}
                placeholder="Seleccionar usuario..."
                isMulti={false}
                required
              />

              <MultiSelect
                label="Operación"
                options={getOperationOptions()}
                value={newAssignment.operationId ? [newAssignment.operationId] : []}
                onChange={selected => {
                  let option = Array.isArray(selected) ? selected[0] ?? null : selected;
                  if (option && typeof option.value !== 'string') {
                    option = { ...option, value: String(option.value) };
                  }
                  setNewAssignment({ ...newAssignment, operationId: option });
                }}
                placeholder="Seleccionar operación..."
                isMulti={false}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Inicio</label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={newAssignment.startTime}
                  onChange={(e) => setNewAssignment({ ...newAssignment, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Fin</label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={newAssignment.endTime}
                  onChange={(e) => setNewAssignment({ ...newAssignment, endTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Función</label>
                <MultiSelect
                  options={functionOptions}
                  value={
                    functionOptions.filter(
                      (opt) => opt.value === newAssignment.assignmentFunction
                    )
                  }
                  onChange={(selected: any) =>
                    setNewAssignment({
                      ...newAssignment,
                      assignmentFunction: selected && !Array.isArray(selected)
                        ? selected.value
                        : Array.isArray(selected) && selected.length > 0
                        ? selected[0].value
                        : ''
                    })
                  }
                  placeholder="Seleccionar función..."
                  isMulti={false}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Costo (USD/hora)</label>
                <input
                  type="number"
                  required
                  className="input-field"
                  min="0"
                  step="0.01"
                  value={newAssignment.cost}
                  onChange={(e) => setNewAssignment({ ...newAssignment, cost: e.target.value })}
                  placeholder="Ej: 12.5"
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
                  Crear Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignments Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">ID</th>
                <th className="text-left py-3 px-4 text-gray-300">Empleado Asignado</th>
                <th className="text-left py-3 px-4 text-gray-300">Operación</th>
                <th className="text-left py-3 px-4 text-gray-300">Función</th>
                <th className="text-left py-3 px-4 text-gray-300">Inicio</th>
                <th className="text-left py-3 px-4 text-gray-300">Fin</th>
                <th className="text-left py-3 px-4 text-gray-300">Costo/Hora</th>
                <th className="text-left py-3 px-4 text-gray-300">Estado</th>
                <th className="text-left py-3 px-4 text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                // Llamar debug solo para la primera asignación
                if (assignment.id === assignments[0]?.id) {
                  debugAssignmentData(assignment);
                }
                return (
                  <tr key={assignment.id} className="table-row border-b border-gray-700">
                    <td className="py-3 px-4 text-gray-300">#{assignment.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{getUserName(assignment)}</div>
                        <div className="text-sm text-gray-400">
                          {users.find(u => u.id === ((assignment as any).userId ?? (assignment as any).user?.id))?.email || 'Email no disponible'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{getOperationInfo(assignment)}</div>
                        <div className="text-sm text-gray-400">
                          {operations.find(o => o.id === ((assignment as any).operationId ?? (assignment as any).operation?.id))?.scheduledTime 
                            ? new Date(operations.find(o => o.id === ((assignment as any).operationId ?? (assignment as any).operation?.id))!.scheduledTime!).toLocaleDateString()
                            : 'Fecha no disponible'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getFunctionDisplayName((assignment as any).assignmentFunction || (assignment as any).function || 'No especificada')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatDate((assignment as any).startTime || (assignment as any).start_time)}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatDate((assignment as any).endTime || (assignment as any).end_time)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-green-400 font-medium">
                        ${(assignment as any).cost || '0'}/h
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor((assignment as any).assignmentStatus || 'assigned')}`}>
                        {getStatusName((assignment as any).assignmentStatus || 'assigned')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-red-400 hover:text-red-300 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {assignments.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay asignaciones registradas
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
