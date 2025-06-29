import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/api';

const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('attendance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { id: 'attendance', name: 'Reporte de Asistencia', icon: '👥' },
    { id: 'overtime', name: 'Reporte de Horas Extra', icon: '⏰' },
    { id: 'coverage', name: 'Cobertura de Estaciones', icon: '📍' },
    { id: 'weekly-schedule', name: 'Horario Semanal', icon: '📅' },
    { id: 'employee-schedule', name: 'Horario por Empleado', icon: '👤' },
    { id: 'cost-analysis', name: 'Análisis de Costos', icon: '💰' },
    { id: 'operational-metrics', name: 'Métricas Operacionales', icon: '📊' }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      let data;
      const params = { ...dateRange };

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
      // Datos de ejemplo en caso de error
      setReportData(generateMockData(selectedReport));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (reportType: string) => {
    switch (reportType) {
      case 'attendance':
        return {
          summary: {
            totalEmployees: 25,
            presentToday: 23,
            absentToday: 2,
            attendanceRate: 92
          },
          details: [
            { name: 'Juan Pérez', status: 'Presente', checkIn: '08:00', checkOut: '17:00' },
            { name: 'María González', status: 'Presente', checkIn: '08:15', checkOut: '17:30' },
            { name: 'Carlos López', status: 'Ausente', checkIn: '-', checkOut: '-' }
          ]
        };
      case 'overtime':
        return {
          summary: {
            totalOvertimeHours: 45,
            employeesWithOvertime: 8,
            averageOvertime: 5.6
          },
          details: [
            { name: 'Ana Torres', regularHours: 40, overtimeHours: 8, totalPay: '$1,200' },
            { name: 'Luis Mendez', regularHours: 40, overtimeHours: 12, totalPay: '$1,350' }
          ]
        };
      default:
        return { message: 'Datos de ejemplo para ' + reportType };
    }
  };

  useEffect(() => {
    generateReport();
  }, [selectedReport]);

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
                      <th className="text-left py-3 px-4 text-gray-300">Estado</th>
                      <th className="text-left py-3 px-4 text-gray-300">Entrada</th>
                      <th className="text-left py-3 px-4 text-gray-300">Salida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details?.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">{item.name}</td>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Reportes</h1>
        <button
          onClick={generateReport}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
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

      {/* Filtros de fecha */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
