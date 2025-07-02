/**
 * Utility functions for reports error handling and validation
 */

export interface StandardReportResponse<T = any> {
  summary: any;
  details: T[];
  message?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates required parameters for reports
 */
export function validateReportParameters(startDate?: string, endDate?: string): ValidationResult {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      message: 'Los parámetros startDate y endDate son obligatorios'
    };
  }

  // Validate date format and that dates are valid
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return {
      isValid: false,
      message: 'Las fechas proporcionadas no son válidas. Use formato YYYY-MM-DD'
    };
  }

  if (startDateObj > endDateObj) {
    return {
      isValid: false,
      message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
    };
  }

  return { isValid: true };
}

/**
 * Creates a standardized empty response for reports
 */
export function createEmptyReportResponse(message: string = 'No se encontraron datos para el rango solicitado'): StandardReportResponse {
  return {
    summary: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
    },
    details: [],
    message
  };
}

/**
 * Creates a standardized empty overtime response
 */
export function createEmptyOvertimeResponse(message: string = 'No se encontraron datos de horas extra para el rango solicitado'): StandardReportResponse {
  return {
    summary: {
      totalOvertimeHours: 0,
      totalOvertimePay: 0,
      employeesWithOvertime: 0,
      averageOvertimeHours: 0,
      totalEmployeesAnalyzed: 0
    },
    details: [],
    message
  };
}

/**
 * Creates a standardized empty coverage response
 */
export function createEmptyCoverageResponse(message: string = 'No se encontraron datos de cobertura de estaciones'): any[] {
  return [];
}

/**
 * Creates a standardized error response for reports
 */
export function createErrorReportResponse(error: string, type: 'attendance' | 'overtime' | 'coverage' = 'attendance'): StandardReportResponse | any[] {
  if (type === 'coverage') {
    return [];
  }

  if (type === 'attendance') {
    return {
      summary: {
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
      },
      details: [],
      error
    };
  } else if (type === 'overtime') {
    return {
      summary: {
        totalOvertimeHours: 0,
        totalOvertimePay: 0,
        employeesWithOvertime: 0,
        averageOvertimeHours: 0,
        totalEmployeesAnalyzed: 0
      },
      details: [],
      error
    };
  }

  // Default case - should not reach here but adding for completeness
  return {
    summary: {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
    },
    details: [],
    error
  };
}