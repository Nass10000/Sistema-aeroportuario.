import React, { useState, useEffect } from 'react';
import { reportsService, stationService } from '../services/api';
import type { Station } from '../services/api';

interface ReportData {
  data?: any[];
  details?: any[];
  summary?: {
    totalEmployees?: number;
    presentToday?: number;
    absentToday?: number;
    attendanceRate?: number;
    totalHours?: number;
    averageAttendance?: number;
    totalCost?: number;
  };
  success?: boolean;
  message?: string;
}

const ReportsPage: React.FC = () => {
  // Date range state
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const [startDate, setStartDate] = useState(lastWeek.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [quickRange, setQuickRange] = useState('last_7_days');
  const [selectedStation, setSelectedStation] = useState<number | ''>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [stations, setStations] = useState<Station[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStations();
    generateReport();
    // eslint-disable-next-line
  }, []);

  const loadStations = async () => {
    try {
      const stationsData = await stationService.getStations();
      setStations(stationsData || []);
    } catch (err) {
      console.error('Error loading stations:', err);
    }
  };

  const handleQuickRangeChange = (range: string) => {
    setQuickRange(range);
    const today = new Date();
    let start = new Date();
    switch (range) {
      case 'today':
        start = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        setEndDate(start.toISOString().split('T')[0]);
        break;
      case 'last_7_days':
        start.setDate(today.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(today.getDate() - 30);
        break;
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setEndDate(lastMonth.toISOString().split('T')[0]);
        break;
    }
    setStartDate(start.toISOString().split('T')[0]);
    if (range !== 'yesterday' && range !== 'last_month') {
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params: any = { startDate, endDate };
      if (selectedStation) params.stationId = selectedStation;
      // Employee filter placeholder (not implemented in backend)
      const response = await reportsService.getAttendanceReport(params);
      setReportData(response);
    } catch (err: any) {
      setError(err.message || 'Error al obtener los datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!reportData || !(reportData.data?.length || reportData.details?.length)) {
      setError('No hay datos para descargar');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/attendance?startDate=${startDate}&endDate=${endDate}${selectedStation ? `&stationId=${selectedStation}` : ''}&format=csv`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-asistencia-${startDate}-${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Error al descargar el archivo CSV');
      }
    } catch (err: any) {
      setError(err.message || 'Error al descargar el archivo CSV');
    } finally {
      setLoading(false);
    }
  };

  // Helper para encontrar el primer array en la respuesta
  function getReportRows(reportData: any): any[] {
    if (!reportData) return [];
    if (Array.isArray(reportData.data)) return reportData.data;
    if (Array.isArray(reportData.details)) return reportData.details;
    for (const key of Object.keys(reportData)) {
      if (Array.isArray(reportData[key])) return reportData[key];
    }
    return [];
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Reportes</h1>
          <p className="text-gray-400">Análisis detallado de la asistencia del personal</p>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">Reporte de Asistencia</h3>
            <p className="text-blue-100">Análisis detallado de la asistencia del personal</p>
          </div>
          <div className="bg-orange-600 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold mb-2">Reporte de Horas Extra</h3>
            <p className="text-orange-100">Seguimiento de horas extras y pagos adicionales</p>
          </div>
          <div className="bg-green-600 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold mb-2">Cobertura de Estaciones</h3>
            <p className="text-green-100">Estado de cobertura de personal por estación</p>
          </div>
        </div>

        {/* Filtros avanzados */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Filtros Avanzados</h2>
          {/* Rangos de Fecha Rápidos */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Rangos de Fecha Rápidos</label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'yesterday', label: 'Ayer' },
                { key: 'last_7_days', label: 'Últimos 7 días' },
                { key: 'last_30_days', label: 'Últimos 30 días' },
                { key: 'this_month', label: 'Este mes' },
                { key: 'last_month', label: 'Mes pasado' }
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleQuickRangeChange(range.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickRange === range.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          {/* Fechas personalizadas y selects */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estación</label>
              <select
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las estaciones</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Empleado Específico</label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los empleados</option>
                {/* Opciones de empleados pueden agregarse aquí si se implementa */}
              </select>
            </div>
          </div>
          {/* Botón Generar Reporte */}
          <div className="flex justify-center">
            <button
              onClick={generateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando Reporte...
                </>
              ) : (
                <>
                  📊 Generar Reporte
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-red-200">Error al procesar reporte</h3>
                <pre className="text-red-300 whitespace-pre-wrap break-all">{error}</pre>
                <button
                  onClick={() => setError(null)}
                  className="text-red-200 underline hover:text-red-100 text-sm mt-2"
                >
                  Cerrar mensaje
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Results */}
        {reportData && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Reporte de Asistencia</h2>
              <button
                onClick={handleDownloadCSV}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                📥 Descargar CSV
              </button>
            </div>
            <p className="text-gray-400 mb-4">
              Análisis detallado de la asistencia del personal
            </p>
            {/* Summary Stats */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {reportData.summary.totalEmployees !== undefined && (
                  <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{reportData.summary.totalEmployees}</div>
                    <div className="text-blue-300">Total Empleados</div>
                  </div>
                )}
                {reportData.summary.presentToday !== undefined && (
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{reportData.summary.presentToday}</div>
                    <div className="text-green-300">Presentes Hoy</div>
                  </div>
                )}
                {reportData.summary.absentToday !== undefined && (
                  <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{reportData.summary.absentToday}</div>
                    <div className="text-red-300">Ausentes Hoy</div>
                  </div>
                )}
                {reportData.summary.attendanceRate !== undefined && (
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{reportData.summary.attendanceRate}%</div>
                    <div className="text-purple-300">Tasa de Asistencia</div>
                  </div>
                )}
                {reportData.summary.totalHours !== undefined && (
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{reportData.summary.totalHours}</div>
                    <div className="text-green-300">Total Horas</div>
                  </div>
                )}
                {reportData.summary.averageAttendance !== undefined && (
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{reportData.summary.averageAttendance}%</div>
                    <div className="text-purple-300">Asistencia Promedio</div>
                  </div>
                )}
                {reportData.summary.totalCost !== undefined && (
                  <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">${reportData.summary.totalCost}</div>
                    <div className="text-yellow-300">Costo Total</div>
                  </div>
                )}
              </div>
            )}
            {/* Report Data Table */}
            {getReportRows(reportData).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-700 text-gray-300">
                      <th className="border border-gray-600 px-4 py-3 text-left">Empleado</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Total Asignaciones</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Completadas</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Ausencias</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Tasa Asistencia</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Total Horas</th>
                      <th className="border border-gray-600 px-4 py-3 text-center">Promedio Horas/Día</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReportRows(reportData).map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-700/50">
                        <td className="border border-gray-600 px-4 py-3 text-white font-medium">
                          {row.employeeName || row.employee_name || row.name || 'N/A'}
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center text-gray-300">
                          {row.totalAssignments || row.total_assignments || 0}
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center text-green-400">
                          {row.completedAssignments || row.completed_assignments || 0}
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center text-red-400">
                          {row.absentAssignments || row.absent_assignments || 0}
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center">
                          <span className={`font-medium ${
                            (row.attendanceRate || row.attendance_rate || 0) >= 0.9 
                              ? 'text-green-400' 
                              : (row.attendanceRate || row.attendance_rate || 0) >= 0.7 
                                ? 'text-yellow-400' 
                                : 'text-red-400'
                          }`}>
                            {((row.attendanceRate || row.attendance_rate || 0) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center text-blue-400">
                          {(row.totalHours || row.total_hours || 0).toFixed(1)}
                        </td>
                        <td className="border border-gray-600 px-4 py-3 text-center text-purple-400">
                          {(row.averageHoursPerDay || row.average_hours_per_day || 0).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-xl text-gray-400 mb-2">No hay datos disponibles</p>
                <p className="text-gray-500">Intenta ajustar los filtros o el rango de fechas</p>
                <pre className="text-xs text-gray-400 bg-gray-900 mt-4 p-2 rounded overflow-x-auto text-left max-w-full whitespace-pre-wrap">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { ReportsPage };
export default ReportsPage;
