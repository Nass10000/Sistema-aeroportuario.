import React, { useState, useEffect } from 'react';
import { operationService, stationService, type Operation, type Station } from '../services/api';
import MultiSelect from '../components/MultiSelect';
import { getAirportOptions, getAircraftOptions, getAirlineOptions, getGateOptions } from '../data/aviation';

// Función universal para extraer el string del MultiSelect (sirve para array u objeto)
const extractValue = (input: any) => {
  if (Array.isArray(input)) return input[0]?.value || '';
  if (typeof input === 'object' && input !== null) return input.value || '';
  return '';
};

const OperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOperation, setNewOperation] = useState({
    flightNumber: '',
    airline: [] as any[],
    aircraftType: [] as any[],
    origin: [] as any[],
    destination: [] as any[],
    scheduledTime: '',
    operationType: 'arrival' as 'arrival' | 'departure',
    stationId: '',
    gate: [] as any[],
    status: 'scheduled' as 'scheduled' | 'boarding' | 'delayed' | 'completed' | 'cancelled'
  });

  useEffect(() => {
    fetchOperations();
    fetchStations();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const data = await operationService.getOperations();
      setOperations(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar operaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const data = await stationService.getStations();
      setStations(data);
    } catch (err: any) {
      console.error('Error loading stations:', err);
    }
  };

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extraer el valor con la función universal
    const originValue = extractValue(newOperation.origin);
    const destinationValue = extractValue(newOperation.destination);

    // Debug: ve exactamente lo que envías
    console.log('🌍 Origen:', originValue, '| Destino:', destinationValue);

    // Construye el payload con solo los campos que el backend espera
    const operationPayload = {
      name: `Vuelo ${newOperation.flightNumber} - ${newOperation.operationType === 'arrival' ? 'Llegada' : 'Salida'}`,
      flightNumber: newOperation.flightNumber,
      origin: originValue,
      destination: destinationValue,
      scheduledTime: new Date(newOperation.scheduledTime).toISOString(),
      passengerCount: 0, // Puedes cambiarlo si lo necesitas
      type: newOperation.operationType === 'arrival' ? 'ARRIVAL' : 'DEPARTURE',
      status: newOperation.status.toUpperCase(),
      stationId: parseInt(newOperation.stationId)
      // No mandes airline, aircraftType ni gate ni nada más extra
    };

    console.log('🚀 Payload enviado a backend:', operationPayload);

    try {
      await operationService.createOperation(operationPayload);
      setShowCreateForm(false);
      setNewOperation({
        flightNumber: '',
        airline: [],
        aircraftType: [],
        origin: [],
        destination: [],
        scheduledTime: '',
        operationType: 'arrival',
        stationId: '',
        gate: [],
        status: 'scheduled'
      });
      fetchOperations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear operación');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600';
      case 'boarding': return 'bg-green-600';
      case 'delayed': return 'bg-yellow-600';
      case 'completed': return 'bg-gray-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado';
      case 'boarding': return 'Abordando';
      case 'delayed': return 'Retrasado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getOperationTypeIcon = (type: string) => {
    if (type === 'arrival') {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
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
        <h1 className="text-3xl font-bold text-white">Gestión de Operaciones</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Operación
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Operation Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-lg w-full m-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crear Nueva Operación</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateOperation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número de Vuelo</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={newOperation.flightNumber}
                    onChange={(e) => setNewOperation({ ...newOperation, flightNumber: e.target.value })}
                    placeholder="AA123"
                  />
                </div>
                
                <MultiSelect
                  label="Aerolínea"
                  options={getAirlineOptions()}
                  value={newOperation.airline}
                  onChange={(selected) => setNewOperation({ ...newOperation, airline: selected })}
                  placeholder="Seleccionar aerolínea..."
                  isMulti={false}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  label="Tipo de Aeronave"
                  options={getAircraftOptions()}
                  value={newOperation.aircraftType}
                  onChange={(selected) => setNewOperation({ ...newOperation, aircraftType: selected })}
                  placeholder="Seleccionar tipo de aeronave..."
                  isMulti={false}
                  required
                />
                
                <MultiSelect
                  label="Puerta"
                  options={getGateOptions()}
                  value={newOperation.gate}
                  onChange={(selected) => setNewOperation({ ...newOperation, gate: selected })}
                  placeholder="Seleccionar puerta..."
                  isMulti={false}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <MultiSelect
                  label="Origen"
                  options={getAirportOptions()}
                  value={newOperation.origin}
                  onChange={(selected) => setNewOperation({ ...newOperation, origin: selected })}
                  placeholder="Seleccionar aeropuerto de origen..."
                  isMulti={false}
                  required
                />
                
                <MultiSelect
                  label="Destino"
                  options={getAirportOptions()}
                  value={newOperation.destination}
                  onChange={(selected) => setNewOperation({ ...newOperation, destination: selected })}
                  placeholder="Seleccionar aeropuerto de destino..."
                  isMulti={false}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hora Programada</label>
                <input
                  type="datetime-local"
                  required
                  className="input-field"
                  value={newOperation.scheduledTime}
                  onChange={(e) => setNewOperation({ ...newOperation, scheduledTime: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Operación</label>
                  <select
                    className="input-field"
                    value={newOperation.operationType}
                    onChange={(e) => setNewOperation({ ...newOperation, operationType: e.target.value as any })}
                  >
                    <option value="arrival">Llegada</option>
                    <option value="departure">Salida</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
                  <select
                    className="input-field"
                    value={newOperation.status}
                    onChange={(e) => setNewOperation({ ...newOperation, status: e.target.value as any })}
                  >
                    <option value="scheduled">Programado</option>
                    <option value="boarding">Abordando</option>
                    <option value="delayed">Retrasado</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Estación</label>
                <select
                  className="input-field"
                  value={newOperation.stationId}
                  onChange={(e) => setNewOperation({ ...newOperation, stationId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar estación</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </select>
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
                  Crear Operación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operations Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">Vuelo</th>
                <th className="text-left py-3 px-4 text-gray-300">Aerolínea</th>
                <th className="text-left py-3 px-4 text-gray-300">Ruta</th>
                <th className="text-left py-3 px-4 text-gray-300">Hora</th>
                <th className="text-left py-3 px-4 text-gray-300">Tipo</th>
                <th className="text-left py-3 px-4 text-gray-300">Estado</th>
                <th className="text-left py-3 px-4 text-gray-300">Puerta</th>
                <th className="text-left py-3 px-4 text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id} className="table-row border-b border-gray-700">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getOperationTypeIcon(operation.operationType)}
                      <span className="text-white font-medium">{operation.flightNumber}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{operation.airline}</td>
                  <td className="py-3 px-4 text-gray-300">
                    {operation.origin} → {operation.destination}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(operation.scheduledTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${
                      operation.operationType === 'arrival' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {operation.operationType === 'arrival' ? 'Llegada' : 'Salida'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(operation.status)}`}>
                      {getStatusName(operation.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{operation.gate || 'N/A'}</td>
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
              ))}
            </tbody>
          </table>
        </div>
        
        {operations.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay operaciones registradas
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsPage;
