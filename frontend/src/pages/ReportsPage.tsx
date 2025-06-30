import React, { useState, useEffect } from 'react';
import { reportsService, authService, type User } from '../services/api';
import StationSelect from '../components/StationSelect';

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('attendance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [stationId, setStationId] = useState<number | null>(null);

  const reportTypes = [
    { id: 'attendance', name: 'Reporte de Asistencia', icon: '👥' },
    { id: 'overtime', name: 'Reporte de Horas Extra', icon: '⏰' },
    { id: 'coverage', name: 'Cobertura de Estaciones', icon: '📍' },
    { id: 'weekly-schedule', name: 'Horario Semanal', icon: '📅' },
    { id: 'employee-schedule', name: 'Horario por Empleado', icon: '👤' },
    { id: 'cost-analysis', name: 'Análisis de Costos', icon: '💰' },
    { id: 'operational-metrics', name: 'Métricas Operacionales', icon: '📊' }
  ];

  // Función para determinar si el usuario puede acceder a reportes
  const canAccessReports = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'supervisor' || 
           currentUser?.role === 'president';
  };

  // Función para determinar si el usuario puede ver todos los reportes o solo los de su estación
  const canViewAllStations = (): boolean => {
    return currentUser?.role === 'admin' || currentUser?.role === 'president';
  };

  // Función para determinar si el usuario puede editar (president solo visualiza)
  const canEdit = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'supervisor';
  };

  type ReportParams = {
    startDate: string;
    endDate: string;
    stationId?: number;
  };

  const generateReport = async () => {
    // Verificar permisos
    if (!canAccessReports()) {
      setReportData({ error: 'No tienes permisos para acceder a los reportes' });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data;
      const params: ReportParams = { ...dateRange };
      
      // Si el usuario no puede ver todas las estaciones, forzar su stationId
      if (!canViewAllStations() && currentUser?.stationId) {
        params.stationId = currentUser.stationId;
      } else if (stationId) {
        params.stationId = stationId;
      }

      switch (selectedReport) {
        case 'attendance':
          data = await reportsService.getAttendanceReport(params);
          break;
        case 'overtime':
          data = await reportsService.getOvertimeReport(params);
          break;
        case 'coverage':
          data = await reportsService.getCoverageReport();
          break;
        case 'weekly-schedule':
          data = await reportsService.getWeeklySchedule(params);
          break;
        case 'employee-schedule':
          data = await reportsService.getEmployeeSchedule(params);
          break;
        case 'cost-analysis':
          data = await reportsService.getCostAnalysis(params);
          break;
        case 'operational-metrics':
          data = await reportsService.getOperationalMetrics(params);
          break;
        default:
          data = { message: 'Reporte no disponible' };
      }
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData(generateMockData(selectedReport));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (reportType: string) => {
    // Solo retorna mensaje de error, sin datos hardcodeados
    return { message: 'No se pudo obtener datos del backend para ' + reportType };
  };

  useEffect(() => {
    // Inicializar usuario actual
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedReport, stationId]);

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-400">Generando reporte...</span>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400">Selecciona un tipo de reporte para comenzar</p>
        </div>
      );
    }

    // Renderizado específico para cada tipo de reporte
    switch (selectedReport) {
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Total Empleados</h3>
                <p className="text-2xl font-bold text-white">{reportData.summary?.totalEmployees || 0}</p>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Presentes Hoy</h3>
                <p className="text-2xl font-bold text-green-400">{reportData.summary?.presentToday || 0}</p>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Ausentes Hoy</h3>
                <p className="text-2xl font-bold text-red-400">{reportData.summary?.absentToday || 0}</p>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Tasa de Asistencia</h3>
                <p className="text-2xl font-bold text-blue-400">{reportData.summary?.attendanceRate || 0}%</p>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Detalle de Asistencia</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Empleado</th>
                      <th className="text-left py-3 px-4 text-gray-300">Estación</th>
                      <th className="text-left py-3 px-4 text-gray-300">Estado</th>
                      <th className="text-left py-3 px-4 text-gray-300">Entrada</th>
                      <th className="text-left py-3 px-4 text-gray-300">Salida</th>
                      <th className="text-left py-3 px-4 text-gray-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">{item.name}</td>
                        <td className="py-3 px-4 text-gray-300">{item.station}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'Presente' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{item.checkIn}</td>
                        <td className="py-3 px-4 text-gray-300">{item.checkOut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'overtime':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Total Horas Extra</h3>
                <p className="text-2xl font-bold text-white">{reportData.summary?.totalOvertimeHours || 0}</p>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Empleados con H. Extra</h3>
                <p className="text-2xl font-bold text-blue-400">{reportData.summary?.employeesWithOvertime || 0}</p>
              </div>
              <div className="stat-card">
                <h3 className="text-sm font-medium text-gray-400">Promedio H. Extra</h3>
                <p className="text-2xl font-bold text-yellow-400">{reportData.summary?.averageOvertime || 0}</p>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Detalle de Horas Extra</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Empleado</th>
                      <th className="text-left py-3 px-4 text-gray-300">Horas Regulares</th>
                      <th className="text-left py-3 px-4 text-gray-300">Horas Extra</th>
                      <th className="text-left py-3 px-4 text-gray-300">Pago Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">{item.name}</td>
                        <td className="py-3 px-4 text-gray-300">{item.regularHours}</td>
                        <td className="py-3 px-4 text-yellow-400 font-medium">{item.overtimeHours}</td>
                        <td className="py-3 px-4 text-green-400 font-medium">{item.totalPay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="card">
            <pre className="text-gray-300 text-sm overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  // Verificar permisos antes de renderizar
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canAccessReports()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-900 border border-red-700 text-red-100 px-6 py-4 rounded-lg max-w-md text-center">
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p>No tienes permisos para acceder a los reportes.</p>
          <p className="text-sm mt-2 text-red-300">
            Solo administradores, gerentes, supervisores y presidentes pueden ver reportes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          {currentUser?.role === 'president' && (
            <p className="text-sm text-yellow-400 mt-1">
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Modo solo lectura - Presidente
            </p>
          )}
        </div>
        <button
          onClick={generateReport}
          disabled={loading || !canEdit()}
          className="btn-primary disabled:opacity-50"
          title={!canEdit() ? 'Los presidentes no pueden actualizar reportes' : ''}
        >
          {loading ? 'Generando...' : 'Actualizar Reporte'}
        </button>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Tipo de Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{report.icon}</span>
                <span className="text-white font-medium">{report.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de fecha y estación */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de fin
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estación
            </label>
            {canViewAllStations() ? (
              <StationSelect value={stationId} onChange={setStationId} />
            ) : (
              <div className="input-field bg-gray-800 text-gray-400 cursor-not-allowed">
                {currentUser?.stationId ? `Estación ${currentUser.stationId}` : 'Sin estación asignada'}
              </div>
            )}
            {!canViewAllStations() && (
              <p className="text-xs text-gray-400 mt-1">
                Solo puedes ver reportes de tu estación asignada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {reportTypes.find(r => r.id === selectedReport)?.name}
          </h3>
          <div className="flex space-x-2">
            <button className="btn-secondary text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar PDF
            </button>
            <button className="btn-secondary text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </button>
          </div>
        </div>
        {renderReportContent()}
      </div>
    </div>
  );
};

export default ReportsPage;
