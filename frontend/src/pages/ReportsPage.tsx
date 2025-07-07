import React, { useState } from 'react';
import { reportsService } from '../services/api';

interface ReportData {
  [key: string]: any;
}

const ReportsPage: React.FC = () => {
  // Estado para fechas
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const [startDate, setStartDate] = useState(lastWeek.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params: any = { startDate, endDate };
      const response = await reportsService.getAttendanceReport(params);
      console.log('Respuesta del backend:', response); // Log para depuración
      setReportData(response);
    } catch (err: any) {
      setError(err.message || 'Error al obtener los datos del servidor');
    } finally {
      setLoading(false);
    }
  };

  // Helper para encontrar el array de datos más relevante para la tabla
  function getReportRows(reportData: any): any[] {
    if (!reportData) return [];
    // Prioridad: details > data > cualquier otro array > array directo
    if (Array.isArray(reportData.details) && reportData.details.length > 0) return reportData.details;
    if (Array.isArray(reportData.data) && reportData.data.length > 0) return reportData.data;
    // Buscar cualquier otra propiedad array con datos
    for (const key of Object.keys(reportData)) {
      if (Array.isArray(reportData[key]) && reportData[key].length > 0) return reportData[key];
    }
    // Si la respuesta es un array directo
    if (Array.isArray(reportData) && reportData.length > 0) return reportData;
    return [];
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Reportes</h1>
          <p className="text-gray-400">Análisis detallado de la asistencia del personal</p>
        </div>

        {/* Filtros de fecha */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 mt-4 md:mt-6"
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
          <div className="bg-gray-800 rounded-lg p-6 w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Reporte de Asistencia</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Análisis detallado de la asistencia del personal
            </p>
            {/* Report Data Table */}
            {getReportRows(reportData).length > 0 ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full table-auto border-collapse text-base min-w-max">
                  <thead>
                    <tr className="bg-gray-700 text-gray-300">
                      {Object.keys(getReportRows(reportData)[0] || {}).map((col) => (
                        <th key={col} className="border border-gray-600 px-8 py-4 text-left whitespace-nowrap min-w-[150px]">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getReportRows(reportData).map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-700/50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="border border-gray-600 px-8 py-4 text-white font-medium whitespace-nowrap min-w-[150px]">{String(val)}</td>
                        ))}
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
              </div>
            )}
            {/* Mostrar siempre el JSON crudo de la respuesta para depuración */}
            {/* Debug oculto en producción */}
            {/* <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-300 mb-2">Debug: Respuesta cruda del backend</h3>
              <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto text-left max-w-full whitespace-pre-wrap">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
