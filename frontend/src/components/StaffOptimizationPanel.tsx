import React, { useState, useEffect } from 'react';
import { schedulingService, operationService } from '../services/api';
import type { Operation, StaffOptimizationResult } from '../services/api';

interface StaffOptimizationPanelProps {
  operationId?: number;
  onClose?: () => void;
}

const StaffOptimizationPanel: React.FC<StaffOptimizationPanelProps> = ({ operationId, onClose }) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<number>(operationId || 0);
  const [optimizationResult, setOptimizationResult] = useState<StaffOptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOperations();
  }, []);

  useEffect(() => {
    if (operationId) {
      setSelectedOperationId(operationId);
      handleOptimizeStaffing(operationId);
    }
  }, [operationId]);

  const loadOperations = async () => {
    try {
      const data = await operationService.getAllOperations();
      setOperations(data);
    } catch (error: any) {
      setError('Error al cargar operaciones: ' + error.message);
    }
  };

  const handleOptimizeStaffing = async (opId?: number) => {
    const targetOperationId = opId || selectedOperationId;
    if (!targetOperationId) {
      setError('Debe seleccionar una operación');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await schedulingService.optimizeStaffing(targetOperationId);
      setOptimizationResult(result);
    } catch (error: any) {
      setError('Error al optimizar personal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedOperation = operations.find(op => op.id === selectedOperationId);

  const getStatusColor = (hasEnoughStaff: boolean) => {
    return hasEnoughStaff ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (hasEnoughStaff: boolean) => {
    return hasEnoughStaff ? '✅' : '⚠️';
  };

  const renderOptimizationCard = () => {
    if (!optimizationResult) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Resultado de Optimización</h3>
        
        {/* Estado General */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Estado del Personal:</span>
            <span className={`font-bold ${getStatusColor(optimizationResult.minimumStaffMet)}`}>
              {getStatusIcon(optimizationResult.minimumStaffMet)} 
              {optimizationResult.minimumStaffMet ? 'Personal Suficiente' : 'Personal Insuficiente'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{optimizationResult.staffAvailability.available}</div>
              <div className="text-gray-600">Disponible</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{optimizationResult.staffAvailability.required}</div>
              <div className="text-gray-600">Requerido</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${optimizationResult.staffAvailability.shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {optimizationResult.staffAvailability.shortage}
              </div>
              <div className="text-gray-600">Faltante</div>
            </div>
          </div>
        </div>

        {/* Sugerencias de Optimización */}
        {optimizationResult.optimizationSuggestions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">Sugerencias de Optimización:</h4>
            <ul className="space-y-2">
              {optimizationResult.optimizationSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Personal Recomendado */}
        {optimizationResult.recommendedAssignments.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-gray-800">Personal Recomendado:</h4>
            <div className="space-y-3">
              {optimizationResult.recommendedAssignments.map((staff) => (
                <div key={staff.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{staff.name}</div>
                    <div className="text-sm text-gray-600">
                      {staff.role} • Puntuación: {staff.recommendationScore}
                    </div>
                    <div className="text-sm text-blue-600">{staff.recommendedPosition}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {staff.skills.length > 0 && (
                        <div>Habilidades: {staff.skills.join(', ')}</div>
                      )}
                      {staff.certifications.length > 0 && (
                        <div>Certificaciones: {staff.certifications.length}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${onClose ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' : ''}`}>
      <div className={`bg-white ${onClose ? 'rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto' : ''} p-6`}>
        {onClose && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Optimización de Personal
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Selector de Operación */}
        {!operationId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Operación
            </label>
            <div className="flex space-x-3">
              <select
                value={selectedOperationId}
                onChange={(e) => setSelectedOperationId(Number(e.target.value))}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Seleccione una operación</option>
                {operations.map((operation) => (
                  <option key={operation.id} value={operation.id}>
                    {operation.name} - {operation.flightNumber} ({new Date(operation.scheduledTime).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleOptimizeStaffing()}
                disabled={loading || !selectedOperationId}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Optimizando...' : 'Optimizar'}
              </button>
            </div>
          </div>
        )}

        {/* Información de la Operación Seleccionada */}
        {selectedOperation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Operación Seleccionada</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre:</strong> {selectedOperation.name}</div>
              <div><strong>Vuelo:</strong> {selectedOperation.flightNumber}</div>
              <div><strong>Origen:</strong> {selectedOperation.origin}</div>
              <div><strong>Destino:</strong> {selectedOperation.destination}</div>
              <div><strong>Fecha:</strong> {new Date(selectedOperation.scheduledTime).toLocaleString()}</div>
              <div><strong>Pasajeros:</strong> {selectedOperation.passengerCount || 'N/A'}</div>
            </div>
          </div>
        )}

        {/* Resultado de Optimización */}
        {renderOptimizationCard()}

        {/* Botón de Cerrar */}
        {onClose && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffOptimizationPanel;
