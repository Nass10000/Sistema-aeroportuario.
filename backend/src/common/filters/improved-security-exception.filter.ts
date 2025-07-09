import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ImprovedSecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ImprovedSecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Mejorar respuestas específicas para Forbidden
      if (status === HttpStatus.FORBIDDEN) {
        message = 'No tienes permisos suficientes para realizar esta acción';
        details = {
          error: 'Acceso denegado',
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          requiredRole: this.extractRequiredRole(exception),
          suggestion: 'Contacta a tu supervisor o administrador si necesitas acceso a esta funcionalidad'
        };
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse as string;
      }
    } else {
      // Error no controlado - Log para seguridad pero no exponer detalles
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
      
      // Log del error real para debugging (no enviado al cliente)
      this.logger.error(
        `Error no controlado: ${exception}`,
        exception instanceof Error ? exception.stack : 'No stack trace',
        `${request.method} ${request.url}`
      );
    }

    // Log específico para errores de autorización
    if (status === HttpStatus.FORBIDDEN || status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn(
        `🚫 ACCESO DENEGADO: ${request.method} ${request.url} - Status: ${status} - IP: ${request.ip} - User: ${(request as any).user?.email || 'No autenticado'}`
      );
    } else {
      // Log de otros errores para auditoria de seguridad
      this.logger.warn(
        `${request.method} ${request.url} - Status: ${status} - IP: ${request.ip} - User-Agent: ${request.get('user-agent')}`
      );
    }

    // Respuesta estructurada
    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details && { details })
    };

    response.status(status).json(errorResponse);
  }

  private extractRequiredRole(exception: HttpException): string {
    // Intentar extraer información del rol requerido del mensaje de error
    const message = exception.message;
    if (message.includes('ADMIN')) return 'Administrador';
    if (message.includes('MANAGER')) return 'Gerente';
    if (message.includes('SUPERVISOR')) return 'Supervisor';
    return 'Rol específico no determinado';
  }
}
