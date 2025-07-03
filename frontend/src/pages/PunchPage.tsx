import React, { useState, useEffect } from 'react';
import { punchService, type Punch } from '../services/api';

const PunchPage: React.FC = () => {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClockingIn, setIsClockingIn] = useState(false);

  useEffect(() => {
    console.log('🟠 useEffect: Cargando PunchPage...');
    fetchPunches();
  }, []);

  const fetchPunches = async () => {
    try {
      setLoading(true);
      console.log('🔄 fetchPunches: solicitando marcajes del usuario');
      const data = await punchService.getMyPunches();
      console.log('✅ fetchPunches: recibidos', data);
      setPunches(data);
      setError('');
    } catch (err: any) {
      console.error('❌ fetchPunches: error', err);
      if (err.response?.status === 401) {
        setError('No tienes permisos para ver esta información');
      } else {
        setError(err.response?.data?.message || 'Error al cargar registros');
      }
    } finally {
      setLoading(false);
      console.log('🔚 fetchPunches: finalizado');
    }
  };

  const handleClockIn = async () => {
    try {
      setIsClockingIn(true);
      setError('');
      console.log('🟢 handleClockIn: enviando punchIn...');
      await punchService.punchIn();
      console.log('✅ handleClockIn: punchIn exitoso');
      fetchPunches();
    } catch (err: any) {
      console.error('❌ handleClockIn: error', err);
      if (err.response?.status === 401) {
        setError('No tienes permisos para registrar entrada');
      } else {
        setError(err.response?.data?.message || 'Error al marcar entrada');
      }
    } finally {
      setIsClockingIn(false);
      console.log('🔚 handleClockIn: terminado');
    }
  };

  const handleClockOut = async () => {
    try {
      setIsClockingIn(true);
      setError('');
      console.log('🔴 handleClockOut: enviando punchOut...');
      await punchService.punchOut();
      console.log('✅ handleClockOut: punchOut exitoso');
      fetchPunches();
    } catch (err: any) {
      console.error('❌ handleClockOut: error', err);
      if (err.response?.status === 401) {
        setError('No tienes permisos para registrar salida');
      } else {
        setError(err.response?.data?.message || 'Error al marcar salida');
      }
    } finally {
      setIsClockingIn(false);
      console.log('🔚 handleClockOut: terminado');
    }
  };

  const getLastPunch = () => {
    if (punches.length === 0) return null;
    const last = punches[0];
    console.log('📥 getLastPunch:', last);
    return last;
  };

  const canClockIn = () => {
    const lastPunch = getLastPunch();
    const can = !lastPunch || lastPunch.type === 'out';
    console.log('🔎 canClockIn:', can);
    return can;
  };

  const canClockOut = () => {
    const lastPunch = getLastPunch();
    const can = lastPunch && lastPunch.type === 'in';
    console.log('🔎 canClockOut:', can);
    return can;
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getCurrentStatus = () => {
    const lastPunch = getLastPunch();
    if (!lastPunch) {
      console.log('🔎 getCurrentStatus: sin marcaje, fuera');
      return { status: 'out', time: null };
    }
    const obj = {
      status: lastPunch.type,
      time: lastPunch.timestamp
    };
    console.log('🔎 getCurrentStatus:', obj);
    return obj;
  };

  const currentStatus = getCurrentStatus();

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
        <h1 className="text-3xl font-bold text-white">Control Horario</h1>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Clock In/Out Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="card">
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              currentStatus.status === 'in' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {currentStatus.status === 'in' ? (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {currentStatus.status === 'in' ? 'En Trabajo' : 'Fuera de Trabajo'}
            </h3>
            {currentStatus.time && (
              <div className="text-gray-300">
                <p className="text-sm">
                  {currentStatus.status === 'in' ? 'Entrada:' : 'Última salida:'}
                </p>
                <p className="text-lg font-medium">
                  {new Date(currentStatus.time).toLocaleTimeString()}
                </p>
                {currentStatus.status === 'in' && (
                  <p className="text-sm text-gray-400 mt-2">
                    Trabajando: {formatDuration(typeof currentStatus.time === 'string' ? currentStatus.time : currentStatus.time.toISOString())}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clock Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Marcar Tiempo</h3>
          <div className="space-y-4">
            <button
              onClick={handleClockIn}
              disabled={!canClockIn() || isClockingIn}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 ${
                canClockIn() && !isClockingIn
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>{isClockingIn ? 'Marcando...' : 'Marcar Entrada'}</span>
              </div>
            </button>

            <button
              onClick={handleClockOut}
              disabled={!canClockOut() || isClockingIn}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all duration-200 ${
                canClockOut() && !isClockingIn
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>{isClockingIn ? 'Marcando...' : 'Marcar Salida'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Punch History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Historial de Marcajes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-300">Hora</th>
                <th className="text-left py-3 px-4 text-gray-300">Tipo</th>
                <th className="text-left py-3 px-4 text-gray-300">Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((punch) => (
                <tr key={punch.id} className="table-row border-b border-gray-700">
                  <td className="py-3 px-4 text-white">
                    {new Date(punch.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(punch.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${
                      punch.type === 'in' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {punch.type === 'in' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {punch.comment || 'Sin comentarios'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {punches.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No hay registros de marcajes
          </div>
        )}
      </div>
    </div>
  );
};

export default PunchPage;
