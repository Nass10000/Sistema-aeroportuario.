import React, { useState, useEffect } from 'react';
import { reportsService, authService, type User } from '../services/api';
import StationSelect from '../components/StationSelect';

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('attendance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
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

    // Verificar token de autenticación
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setReportData({ error: 'No hay token de autenticación. Por favor, inicia sesión nuevamente.' });
      setLoading(false);
      return;
    }

    console.log('🔑 Auth token check:', { 
      hasToken: !!token, 
      tokenLength: token?.length, 
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none' 
    });

    // Cancelar cualquier petición anterior
    if (abortController) {
      abortController.abort();
    }

    // Crear nuevo AbortController
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    setLoading(true);
    setReportData(null);
    setTimeoutWarning(false);
    setLoadingProgress(0);
    
    console.log('🔄 Generating report:', selectedReport, 'with params:', dateRange, 'stationId:', stationId);

    // Mostrar advertencia de timeout después de 15 segundos (reducido de 30)
    const timeoutTimer = setTimeout(() => {
      setTimeoutWarning(true);
    }, 15000);

    // Simular progreso de carga más rápido
    const progressTimer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 85) return prev; // Detener antes del 100%
        return prev + Math.random() * 15; // Incrementos más grandes
      });
    }, 1000); // Actualizar cada segundo
    
    try {
      let data;
      const params: ReportParams = { ...dateRange };
      
      // Si el usuario no puede ver todas las estaciones, forzar su stationId
      if (!canViewAllStations() && currentUser?.stationId) {
        params.stationId = currentUser.stationId;
      } else if (stationId) {
        params.stationId = stationId;
      }

      console.log('📊 Final params for report:', params);

      switch (selectedReport) {
        case 'attendance':
          console.log('📋 Requesting attendance report...');
          data = await reportsService.getAttendanceReport(params);
          console.log('✅ Attendance report received:', data);
          break;
        case 'overtime':
          console.log('⏰ Requesting overtime report...');
          data = await reportsService.getOvertimeReport(params);
          console.log('✅ Overtime report received:', data);
          break;
        case 'coverage':
          console.log('📍 Requesting coverage report...');
          data = await reportsService.getCoverageReport();
          console.log('✅ Coverage report received:', data);
          break;
        case 'weekly-schedule':
          console.log('📅 Requesting weekly schedule report...');
          data = await reportsService.getWeeklySchedule(params);
          console.log('✅ Weekly schedule report received:', data);
          break;
        case 'employee-schedule':
          console.log('👤 Requesting employee schedule report...');
          data = await reportsService.getEmployeeSchedule(params);
          console.log('✅ Employee schedule report received:', data);
          break;
        case 'cost-analysis':
          console.log('💰 Requesting cost analysis report...');
          data = await reportsService.getCostAnalysis(params);
          console.log('✅ Cost analysis report received:', data);
          break;
        case 'operational-metrics':
          console.log('📊 Requesting operational metrics report...');
          data = await reportsService.getOperationalMetrics(params);
          console.log('✅ Operational metrics report received:', data);
          break;
        default:
          data = { message: 'Reporte no disponible' };
      }
      
      console.log('🎯 Setting report data:', data);
      setReportData(data);
      setLoadingProgress(100);
    } catch (error: any) {
      console.error('❌ Error generating report:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error status:', error.response?.status);
      
      // Manejar errores específicos
      if (error.name === 'AbortError') {
        setReportData({ message: 'Reporte cancelado por el usuario' });
      } else if (error.response?.status === 401) {
        setReportData({ 
          error: '🔐 Error de autenticación. Tu sesión ha expirado.',
          suggestion: 'Por favor, inicia sesión nuevamente para acceder a los reportes.',
          isAuthError: true 
        });
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setReportData({ 
          error: 'El reporte tardó demasiado en generarse. Intenta con un rango de fechas más pequeño o verifica tu conexión.',
          isTimeout: true 
        });
      } else {
        setReportData({ 
          error: 'Error al generar el reporte: ' + (error.response?.data?.message || error.message),
          suggestion: 'Intenta nuevamente o contacta al administrador si el problema persiste.'
        });
      }
    } finally {
      clearTimeout(timeoutTimer);
      clearInterval(progressTimer);
      setLoading(false);
      setTimeoutWarning(false);
      setLoadingProgress(0);
      setAbortController(null);
      console.log('🏁 Report generation finished');
    }
  };

  const generateMockData = (reportType: string) => {
    // Solo retorna mensaje de error, sin datos hardcodeados
    return { message: 'No se pudo obtener datos del backend para ' + reportType };
  };

  useEffect(() => {
    // Inicializar usuario actual
    const user = authService.getCurrentUser();
    console.log('👤 Current user from localStorage:', user);
    console.log('👤 User role:', user?.role);
    console.log('👤 Can access reports:', user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor' || user?.role === 'president');
    setCurrentUser(user);
  }, []);

  // Removed automatic report generation - now only manual via button click

  const cancelReport = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setTimeoutWarning(false);
      setLoadingProgress(0);
      setReportData({ message: 'Reporte cancelado por el usuario' });
    }
  };

  const renderReportContent = () => {
    console.log('🖼️ Rendering report content. Loading:', loading, 'Report data:', reportData);
    
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-center">
            <span className="text-gray-400 block">Generando reporte...</span>
            {loadingProgress > 0 && (
              <div className="w-64 bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                ></div>
              </div>
            )}
            {timeoutWarning && (
              <div className="mt-3 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ El reporte está tardando más de 15 segundos
                </p>
                <p className="text-yellow-300 text-xs mt-1">
                  Esto puede deberse a una gran cantidad de datos o conexión lenta
                </p>
                <button 
                  onClick={cancelReport}
                  className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-yellow-100 text-xs rounded"
                >
                  Cancelar Reporte
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (!reportData) {
      console.log('⚠️ No report data available');
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m6 0h6m-6 6v6m-6-6v6m6-6v6" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">Selecciona un tipo de reporte y haz clic en "Actualizar Reporte"</p>
          <p className="text-gray-500 text-sm mt-2">Los reportes se generan en tiempo real con tus datos actuales</p>
        </div>
      );
    }

    // Verificar si hay error en la respuesta
    if (reportData.error) {
      console.log('❌ Report data contains error:', reportData.error);
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 text-lg font-semibold">Error al generar el reporte</p>
          <p className="text-red-300 mt-2">{reportData.error}</p>
          {reportData.suggestion && (
            <p className="text-gray-400 text-sm mt-2">{reportData.suggestion}</p>
          )}
          {reportData.isTimeout && (
            <div className="mt-4 p-4 bg-orange-900 border border-orange-600 rounded-lg text-left max-w-md mx-auto">
              <p className="text-orange-200 font-semibold">💡 Sugerencias:</p>
              <ul className="text-orange-300 text-sm mt-2 space-y-1">
                <li>• Reduce el rango de fechas</li>
                <li>• Filtra por una estación específica</li>
                <li>• Verifica tu conexión a internet</li>
                <li>• Intenta nuevamente en un momento</li>
              </ul>
            </div>
          )}
          {reportData.isAuthError && (
            <div className="mt-4 p-4 bg-red-900 border border-red-600 rounded-lg text-left max-w-md mx-auto">
              <p className="text-red-200 font-semibold">🔐 Problema de Autenticación:</p>
              <ul className="text-red-300 text-sm mt-2 space-y-1">
                <li>• Tu sesión ha expirado</li>
                <li>• Necesitas iniciar sesión nuevamente</li>
                <li>• El token de autenticación no es válido</li>
              </ul>
              <button 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-red-100 text-sm rounded"
              >
                Ir a Login
              </button>
            </div>
          )}
          <button 
            onClick={generateReport}
            className="mt-4 btn-primary"
          >
            Reintentar
          </button>
        </div>
      );
    }

    // Verificar si hay mensaje pero no datos
    if (reportData.message && !reportData.summary && !reportData.details) {
      console.log('📝 Report data contains only message:', reportData.message);
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-1h1v1zm0 0v6m6-6v6m6-6v6m-6-6h6m-6 0H13m6 0h6" />
            </svg>
          </div>
          <p className="text-yellow-400 text-lg">{reportData.message}</p>
          <p className="text-gray-400 text-sm mt-2">
            Esto puede significar que no hay datos para el período seleccionado
          </p>
          <button 
            onClick={generateReport}
            className="mt-4 btn-secondary"
          >
            Actualizar Reporte
          </button>
        </div>
      );
    }

    console.log('📊 Rendering report for type:', selectedReport);

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
