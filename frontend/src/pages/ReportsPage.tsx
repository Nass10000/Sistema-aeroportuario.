import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reportsService, authService, stationService, type User, type Station } from '../services/api';
import Select from 'react-select';

// Tipos específicos para los reportes
interface ReportParams {
  startDate: string;
  endDate: string;
  stationId?: number;
  employeeId?: number;
  format?: 'json' | 'csv';
}

interface ReportFilter {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stationId: number | null;
  employeeId: number | null;
  quickDateRange: string;
}

interface LoadingState {
  isLoading: boolean;
  progress: number;
  timeoutWarning: boolean;
  currentOperation: string;
}

const ReportsPage: React.FC = () => {
  // Estados principales
  const [selectedReport, setSelectedReport] = useState<string>('attendance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    timeoutWarning: false,
    currentOperation: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    stationId: null,
    employeeId: null,
    quickDateRange: 'last_7_days'
  });

  // Referencias para manejo de timeouts y cancelaciones
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Configuración de tipos de reportes
  const reportTypes = [
    { 
      id: 'attendance', 
      name: 'Reporte de Asistencia', 
      icon: '👥',
      description: 'Análisis detallado de la asistencia del personal',
      permissions: ['view_reports']
    },
    { 
      id: 'overtime', 
      name: 'Reporte de Horas Extra', 
      icon: '⏰',
      description: 'Seguimiento de horas extras y pagos adicionales',
      permissions: ['view_reports']
    },
    { 
      id: 'coverage', 
      name: 'Cobertura de Estaciones', 
      icon: '📍',
      description: 'Estado de cobertura de personal por estación',
      permissions: ['view_reports']
    },
    { 
      id: 'weekly-schedule', 
      name: 'Programación Semanal', 
      icon: '📅',
      description: 'Horarios y programación semanal del personal',
      permissions: ['view_reports']
    },
    { 
      id: 'employee-schedule', 
      name: 'Horario por Empleado', 
      icon: '👤',
      description: 'Horarios específicos de empleados individuales',
      permissions: ['view_reports']
    },
    { 
      id: 'cost-analysis', 
      name: 'Análisis de Costos', 
      icon: '💰',
      description: 'Análisis financiero y de costos operacionales',
      permissions: ['view_reports', 'export_reports']
    },
    { 
      id: 'operational-metrics', 
      name: 'Métricas Operacionales', 
      icon: '📊',
      description: 'KPIs y métricas de rendimiento operacional',
      permissions: ['view_reports']
    }
  ];

  // Rangos de fechas predefinidos
  const quickDateRanges = [
    { 
      id: 'today', 
      name: 'Hoy',
      getRange: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    { 
      id: 'yesterday', 
      name: 'Ayer',
      getRange: () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return { startDate: yesterday, endDate: yesterday };
      }
    },
    { 
      id: 'last_7_days', 
      name: 'Últimos 7 días',
      getRange: () => ({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      })
    },
    { 
      id: 'last_30_days', 
      name: 'Últimos 30 días',
      getRange: () => ({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      })
    },
    { 
      id: 'this_month', 
      name: 'Este mes',
      getRange: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      }
    },
    { 
      id: 'last_month', 
      name: 'Mes pasado',
      getRange: () => {
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: startOfLastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0]
        };
      }
    }
  ];

  // Funciones de permisos
  const canAccessReports = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'supervisor' || 
           currentUser?.role === 'president';
  };

  const canViewAllStations = (): boolean => {
    return currentUser?.role === 'admin' || currentUser?.role === 'president';
  };

  const canExportReports = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'supervisor';
  };

  const canEdit = (): boolean => {
    return currentUser?.role === 'admin' || 
           currentUser?.role === 'manager' || 
           currentUser?.role === 'supervisor';
  };

  // Función para limpiar timeouts y controladores
  const cleanupRefs = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // Función para actualizar el progreso de carga
  const startProgressIndicator = useCallback(() => {
    setLoading(prev => ({ ...prev, progress: 0 }));
    
    progressRef.current = setInterval(() => {
      setLoading(prev => ({
        ...prev,
        progress: Math.min(prev.progress + Math.random() * 15, 85)
      }));
    }, 1000);

    // Mostrar advertencia de timeout después de 30 segundos (50% del timeout total de 60s)
    timeoutRef.current = setTimeout(() => {
      setLoading(prev => ({ ...prev, timeoutWarning: true }));
    }, 30000);
  }, []);

  // Función principal para generar reportes
  const generateReport = async () => {
    if (!canAccessReports()) {
      setError('No tienes permisos para acceder a los reportes');
      return;
    }

    // Verificar token de autenticación
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Limpiar estado anterior
    cleanupRefs();
    setError(null);
    setReportData(null);

    // Configurar nuevo controlador de cancelación
    abortControllerRef.current = new AbortController();

    // Configurar estado de carga
    setLoading({
      isLoading: true,
      progress: 0,
      timeoutWarning: false,
      currentOperation: `Generando ${reportTypes.find(r => r.id === selectedReport)?.name || 'reporte'}...`
    });

    startProgressIndicator();

    try {
      const params: ReportParams = {
        ...filters.dateRange,
        stationId: filters.stationId || undefined,
        employeeId: filters.employeeId || undefined
      };

      // Si el usuario no puede ver todas las estaciones, forzar su stationId
      if (!canViewAllStations() && currentUser?.stationId) {
        params.stationId = currentUser.stationId;
      }

      let data;
      setLoading(prev => ({ ...prev, currentOperation: 'Consultando base de datos...' }));

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
          throw new Error('Tipo de reporte no válido');
      }

      setLoading(prev => ({ ...prev, progress: 100, currentOperation: 'Finalizando...' }));
      setReportData(data);

    } catch (error: any) {
      console.error('Error generating report:', error);
      
      if (error.name === 'AbortError') {
        setError('Reporte cancelado por el usuario');
      } else if (error.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError('El reporte tardó demasiado en generarse. Intenta con un rango de fechas más pequeño o revisa tu conexión.');
      } else {
        setError(error.response?.data?.message || error.message || 'Error al generar el reporte');
      }
    } finally {
      // Asegurar limpieza completa del estado
      cleanupRefs();
      setLoading({
        isLoading: false,
        progress: 0,
        timeoutWarning: false,
        currentOperation: ''
      });
    }
  };

  // Función para cancelar el reporte
  const cancelReport = useCallback(() => {
    cleanupRefs();
    setLoading({
      isLoading: false,
      progress: 0,
      timeoutWarning: false,
      currentOperation: ''
    });
    setError('Reporte cancelado por el usuario');
  }, [cleanupRefs]);

  // Función para exportar reportes
  const exportReport = async (format: 'csv' | 'json') => {
    if (!canExportReports()) {
      setError('No tienes permisos para exportar reportes');
      return;
    }

    if (!reportData) {
      setError('No hay datos para exportar. Genera un reporte primero.');
      return;
    }

    try {
      setLoading({
        isLoading: true,
        progress: 0,
        timeoutWarning: false,
        currentOperation: `Exportando a ${format.toUpperCase()}...`
      });

      const params: ReportParams = {
        ...filters.dateRange,
        stationId: filters.stationId || undefined,
        employeeId: filters.employeeId || undefined,
        format
      };

      if (!canViewAllStations() && currentUser?.stationId) {
        params.stationId = currentUser.stationId;
      }

      let exportData;

      switch (selectedReport) {
        case 'attendance':
          exportData = await reportsService.getAttendanceReport(params);
          break;
        case 'overtime':
          exportData = await reportsService.getOvertimeReport(params);
          break;
        case 'coverage':
          exportData = await reportsService.getCoverageReport();
          break;
        case 'weekly-schedule':
          exportData = await reportsService.getWeeklySchedule(params);
          break;
        case 'employee-schedule':
          exportData = await reportsService.getEmployeeSchedule(params);
          break;
        case 'cost-analysis':
          exportData = await reportsService.getCostAnalysis(params);
          break;
        case 'operational-metrics':
          exportData = await reportsService.getOperationalMetrics(params);
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      // Crear y descargar archivo
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedReport}_${timestamp}.${format}`;
      
      let content: string;
      let mimeType: string;

      if (format === 'csv') {
        // Convertir datos a CSV
        const csvData = Array.isArray(exportData) ? exportData : exportData.details || [];
        if (csvData.length === 0) {
          throw new Error('No hay datos para exportar');
        }
        
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(','),
          ...csvData.map((row: any) => 
            headers.map(header => 
              typeof row[header] === 'string' && row[header].includes(',') 
                ? `"${row[header]}"` 
                : row[header]
            ).join(',')
          )
        ].join('\n');
        
        content = csvContent;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      }

      // Crear y descargar archivo
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Error exporting report:', error);
      setError(error.message || 'Error al exportar el reporte');
    } finally {
      setLoading({
        isLoading: false,
        progress: 0,
        timeoutWarning: false,
        currentOperation: ''
      });
    }
  };

  // Función para actualizar filtros rápidos de fecha
  const handleQuickDateChange = (rangeId: string) => {
    const range = quickDateRanges.find(r => r.id === rangeId);
    if (range) {
      const newRange = range.getRange();
      setFilters(prev => ({
        ...prev,
        dateRange: newRange,
        quickDateRange: rangeId
      }));
    }
  };

  // Función para resetear filtros
  const resetFilters = () => {
    setFilters({
      dateRange: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      stationId: null,
      employeeId: null,
      quickDateRange: 'last_7_days'
    });
  };

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        if (user && canAccessReports()) {
          // Cargar estaciones si el usuario puede verlas todas
          if (canViewAllStations()) {
            const stationsData = await stationService.getStations();
            setStations(stationsData);
          }

          // TODO: Cargar lista de empleados si es necesario
          // const employeesData = await userService.getEmployees();
          // setEmployees(employeesData);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      cleanupRefs();
    };
  }, [cleanupRefs]);

  // Componente para renderizar reportes específicos
  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m6 0h6m-6 6v6m-6-6v6m6-6v6" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            ✨ Listo para generar reportes
          </h3>
          <p className="text-gray-400 text-lg mb-4">
            Selecciona un tipo de reporte, ajusta los filtros y usa el botón "🚀 Generar Reporte"
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <p className="text-blue-200 text-sm font-medium">
                    Tips para mejores resultados:
                  </p>
                  <ul className="text-blue-300 text-xs mt-2 space-y-1">
                    <li>• Usa rangos de fecha específicos para reportes más rápidos</li>
                    <li>• Filtra por estación para reducir la cantidad de datos</li>
                    <li>• Los reportes se generan en tiempo real con datos actuales</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Verificar si hay error en la respuesta
    if (reportData.error) {
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
          <p className="text-gray-400 text-sm mt-4">
            Usa el botón "🚀 Generar Reporte" en la parte superior para intentar nuevamente
          </p>
        </div>
      );
    }

    // Verificar si hay mensaje pero no datos
    if (reportData.message && !reportData.summary && !reportData.details) {
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
          <p className="text-gray-400 text-sm mt-4">
            Usa el botón "🚀 Generar Reporte" en la parte superior para actualizar con nuevos filtros
          </p>
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
            
            <div className="card-dark">
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
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className="py-3 px-4 text-white">{item.name}</td>
                        <td className="py-3 px-4 text-gray-300">{item.station}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Presente' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{item.checkIn || '-'}</td>
                        <td className="py-3 px-4 text-gray-300">{item.checkOut || '-'}</td>
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
            
            <div className="card-dark">
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
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className="py-3 px-4 text-white">{item.name}</td>
                        <td className="py-3 px-4 text-gray-300">{item.regularHours || 0}</td>
                        <td className="py-3 px-4 text-yellow-400 font-medium">{item.overtimeHours || 0}</td>
                        <td className="py-3 px-4 text-green-400 font-medium">{item.totalPay || 0}</td>
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
          <div className="card-dark">
            <h4 className="text-lg font-semibold text-white mb-4">Datos del Reporte</h4>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <pre className="text-gray-300 text-sm overflow-auto whitespace-pre-wrap max-h-96">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
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
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4v2m0 4v2m8-8h4m-4 4h4m-4 4h4M8 21l4-4 4 4M8 21l4 4 4-4" />
            </svg>
          </div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Centro de Reportes</h1>
          <p className="text-gray-400 mt-1">
            Análisis completo y exportación de datos operacionales
          </p>
          {currentUser?.role === 'president' && (
            <div className="flex items-center mt-2 p-2 bg-yellow-900 border border-yellow-600 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-200 text-sm font-medium">Modo solo lectura - Presidente</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Simplified single action button that combines generation and display */}
          <button
            onClick={generateReport}
            disabled={loading.isLoading || !canEdit()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center px-6 py-3 text-lg font-semibold"
            title={!canEdit() ? 'Los presidentes no pueden actualizar reportes' : 'Generar y mostrar reporte con filtros actuales'}
          >
            {loading.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando Reporte...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                🚀 Generar Reporte
              </>
            )}
          </button>
          {loading.isLoading && (
            <button
              onClick={cancelReport}
              className="btn-secondary flex items-center justify-center opacity-75 hover:opacity-100"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Tipo de Reporte</h3>
          <span className="text-sm text-gray-400">
            {reportTypes.length} tipos disponibles
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`group p-4 rounded-lg border text-left transition-all duration-200 transform hover:scale-105 ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-500 bg-opacity-20 shadow-lg'
                  : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {report.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium block truncate">
                    {report.name}
                  </span>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Filtros Avanzados</h3>
          <button
            onClick={resetFilters}
            className="btn-secondary text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Resetear
          </button>
        </div>
        
        {/* Rangos rápidos de fecha */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Rangos de Fecha Rápidos
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickDateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => handleQuickDateChange(range.id)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  filters.quickDateRange === range.id
                    ? 'border-blue-500 bg-blue-500 bg-opacity-20 text-blue-300'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros detallados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={filters.dateRange.startDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, startDate: e.target.value },
                quickDateRange: ''
              }))}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={filters.dateRange.endDate}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, endDate: e.target.value },
                quickDateRange: ''
              }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estación
            </label>
            {canViewAllStations() ? (
              <Select
                isClearable
                options={stations.map(station => ({
                  value: station.id,
                  label: station.name
                }))}
                value={stations.find(s => s.id === filters.stationId) ? {
                  value: filters.stationId!,
                  label: stations.find(s => s.id === filters.stationId)!.name
                } : null}
                onChange={(option) => setFilters(prev => ({
                  ...prev,
                  stationId: option ? option.value : null
                }))}
                placeholder="Todas las estaciones"
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#374151',
                    borderColor: '#4b5563',
                    color: '#f9fafb',
                    minHeight: '44px'
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#374151',
                    borderColor: '#4b5563'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#4b5563' : '#374151',
                    color: '#f9fafb'
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#f9fafb'
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#9ca3af'
                  })
                }}
              />
            ) : (
              <div className="input-field bg-gray-800 text-gray-400 cursor-not-allowed flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {currentUser?.stationId ? 
                  `Estación ${stations.find(s => s.id === currentUser.stationId)?.name || currentUser.stationId}` 
                  : 'Sin estación asignada'
                }
              </div>
            )}
            {!canViewAllStations() && (
              <p className="text-xs text-gray-400 mt-1">
                Solo puedes ver reportes de tu estación asignada
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Empleado Específico
            </label>
            <Select
              isClearable
              options={[]}
              value={null}
              onChange={() => {}}
              placeholder="Todos los empleados (pendiente implementar)"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={true}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#374151',
                  borderColor: '#4b5563',
                  color: '#f9fafb',
                  minHeight: '44px'
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#374151',
                  borderColor: '#4b5563'
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#4b5563' : '#374151',
                  color: '#f9fafb'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#f9fafb'
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af'
                })
              }}
            />
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {reportTypes.find(r => r.id === selectedReport)?.name}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {reportTypes.find(r => r.id === selectedReport)?.description}
            </p>
          </div>
          {/* Simplified export options - shown as a subtle dropdown only when data exists */}
          {reportData && canExportReports() && !loading.isLoading && (
            <div className="relative">
              <details className="group">
                <summary className="btn-secondary text-sm flex items-center cursor-pointer list-none">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar
                  <svg className="w-4 h-4 ml-2 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                  <button 
                    onClick={() => exportReport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-t-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                  </button>
                  <button 
                    onClick={() => exportReport('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-b-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    JSON
                  </button>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Indicador de progreso durante la carga */}
        {loading.isLoading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{loading.currentOperation}</span>
              <span className="text-sm text-gray-400">{Math.round(loading.progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(loading.progress, 100)}%` }}
              ></div>
            </div>
            {loading.timeoutWarning && (
              <div className="mt-3 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-yellow-200 text-sm font-medium">
                      El reporte está tardando más de lo esperado
                    </p>
                    <p className="text-yellow-300 text-xs mt-1">
                      Esto puede deberse a la cantidad de datos. Puedes reducir el rango de fechas o cancelar y intentar nuevamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manejo de errores */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-red-200 font-medium">Error al procesar reporte</h4>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Cerrar mensaje
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido del reporte */}
        {!loading.isLoading && !error && (
          renderReportContent()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
