import React, { useState, useEffect } from 'react';
import {
  schedulingService,
  operationService,
  type Operation
} from '../services/api';
import StationAssignmentManager from '../components/StationAssignmentManager';
import StaffOptimizationPanel from '../components/StaffOptimizationPanel';

// Función helper para traducir roles
const translateRole = (role: string): string => {
  const roleTranslations: { [key: string]: string } = {
    employee: 'Empleado',
    supervisor: 'Supervisor',
    manager: 'Gerente',
    president: 'Presidente',
    admin: 'Administrador'
  };
  return roleTranslations[role] || role;
};

const SchedulingPage: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'availability' | 'optimization' | 'stations'>('availability');
  const [showStationManager, setShowStationManager] = useState(false);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const operations = await operationService.getOperations();
        setOperations(operations);
      } catch {
        setOperations([]);
      }
    })();
  }, []);

  const checkAvailability = async (operationId: number) => {
    setLoading(true);
    try {
      const data = await schedulingService.checkAvailability({ operationId, date: new Date().toISOString() });
      setStaffStats(data);
      setAvailableStaff(data.staffDetails ?? []);
    } catch {
      setStaffStats(null);
      setAvailableStaff([]);
    } finally { setLoading(false); }
  };

  const validateAssignment = async (d: any) => {
    try {
      const v = await schedulingService.validateAssignment(d);
      alert(`Validación: ${v.valid ? '✓' : '✗'}${v.errors?.join(', ')}`);
    } catch {
      alert('Error al validar la asignación');
    }
  };

  const getOptimalStaffing = async (operationId: number) => {
    setLoading(true);
    try {
      const opt = await schedulingService.optimizeStaffing(operationId);
      alert(`Suficiente: ${opt.minimumStaffMet}\nReq: ${opt.staffAvailability.required}\nDisp: ${opt.staffAvailability.available}`);
    } catch (e) {
      alert('Error optimizando: ' + (e as Error).message);
    } finally { setLoading(false); }
  };

  const renderAvailabilityView = () => (
    <div className="space-y-6">
      {staffStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['totalStaff','availableStaff','workingStaff','unavailableStaff','activeOperations'].map(key => (
            <div key={key} className="card text-center">
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                {key === 'totalStaff'? 'Total' :
                 key === 'availableStaff'? 'Disponible' :
                 key === 'workingStaff'? 'Trabajando' :
                 key === 'unavailableStaff'? 'No Disp' :
                 'Activas'}
              </h4>
              <p className="text-3xl font-bold text-white">{(staffStats as any)[key]}</p>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Verificar Disponibilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedOperation ?? ''}
            onChange={e => setSelectedOperation(Number(e.target.value))}
            className="input-field"
          >
            <option value="">Operacion</option>
            {operations.map(op => (
              <option key={op.id} value={op.id}>
                {op.flightNumber} ({op.scheduledTime && new Date(op.scheduledTime).toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedOperation && checkAvailability(selectedOperation)}
            disabled={!selectedOperation || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Verificar'}
          </button>
        </div>
      </div>
      {availableStaff.length > 0 && (
        <div className="card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableStaff.map(staff => (
            <div key={staff.userId} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-medium">{staff.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  staff.availability === 'available' ? 'bg-green-900' :
                  staff.availability === 'working'   ? 'bg-blue-900' :
                  'bg-red-900'
                }`}>
                  {staff.availability === 'available'? 'Disp':
                   staff.availability === 'working'? 'Trab' : 'No Disp'}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                <span className="font-medium">Rol:</span> {translateRole(staff.role)}
              </p>
              <p className="text-gray-300 text-sm mb-2">
                <span className="font-medium">Estación:</span> {staff.stationName}
              </p>
              <button
                onClick={() => validateAssignment({
                  userId: staff.userId,
                  operationId: selectedOperation,
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now()+4*3600000).toISOString()
                })}
                className="btn-secondary w-full mt-3 text-sm"
              >
                Validar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOptimizationView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Optimización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedOperation ?? ''}
            onChange={e => setSelectedOperation(Number(e.target.value))}
            className="input-field"
          >
            <option value="">Operacion</option>
            {operations.map(op => (
              <option key={op.id} value={op.id}>
                {op.flightNumber}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedOperation && getOptimalStaffing(selectedOperation)}
            disabled={!selectedOperation || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Optimizando...' : 'Optimizar'}
          </button>
        </div>
      </div>
      <button onClick={() => setShowOptimizationPanel(true)} className="btn-secondary w-full">
        Panel Avanzado
      </button>
      {showOptimizationPanel && <StaffOptimizationPanel onClose={() => setShowOptimizationPanel(false)} />}
    </div>
  );

  const renderStationsView = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Gestión de Estaciones</h3>
        <button onClick={() => setShowStationManager(true)} className="btn-primary">
          Abrir Gestor
        </button>
      </div>
      {showStationManager && <StationAssignmentManager onClose={() => setShowStationManager(false)} />}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Programación y Optimización</h1>
        <nav className="flex space-x-2">
          {(['availability','optimization','stations'] as const).map(view => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded-lg ${
                selectedView === view ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {view === 'availability'? 'Disponibilidad' :
               view === 'optimization'? 'Optimización' : 'Estaciones'}
            </button>
          ))}
        </nav>
      </header>
      {selectedView === 'availability' && renderAvailabilityView()}
      {selectedView === 'optimization' && renderOptimizationView()}
      {selectedView === 'stations' && renderStationsView()}
    </div>
  );
};

export default SchedulingPage;
