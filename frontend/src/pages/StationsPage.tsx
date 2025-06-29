import React, { useState, useEffect } from 'react';
import { stationService, type Station } from '../services/api';

const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStation, setNewStation] = useState({
    name: '',
    code: '',
    terminal: '',
    isActive: true
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const data = await stationService.getStations();
      setStations(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stationService.createStation(newStation);
      setShowCreateForm(false);
      setNewStation({ name: '', code: '', terminal: '', isActive: true });
      fetchStations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear estación');
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
        <h1 className="text-3xl font-bold text-white">Gestión de Estaciones</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva Estación
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Station Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Crear Nueva Estación</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateStation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  placeholder="Terminal A"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Código</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newStation.code}
                  onChange={(e) => setNewStation({ ...newStation, code: e.target.value })}
                  placeholder="TA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Terminal</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newStation.terminal}
                  onChange={(e) => setNewStation({ ...newStation, terminal: e.target.value })}
                  placeholder="Terminal Principal"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="mr-2"
                  checked={newStation.isActive}
                  onChange={(e) => setNewStation({ ...newStation, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Estación activa
                </label>
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
                  Crear Estación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((station) => (
          <div key={station.id} className="card hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{station.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                station.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {station.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-medium">Código:</span> {station.code}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-medium">Terminal:</span> {station.terminal}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-medium">ID:</span> #{station.id}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button className="btn-secondary flex-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
              <button className="btn-danger">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {stations.length === 0 && (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No hay estaciones</h3>
          <p className="text-gray-400">Comienza creando tu primera estación.</p>
        </div>
      )}
    </div>
  );
};

export default StationsPage;
