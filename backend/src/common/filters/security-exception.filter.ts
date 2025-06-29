import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

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
      
      if (typeof exceptionResponse === 'object') {
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

    // Log de todos los errores para auditoria de seguridad
    this.logger.warn(
      `${request.method} ${request.url} - Status: ${status} - IP: ${request.ip} - User-Agent: ${request.get('user-agent')}`
    );

    // Respuesta segura al cliente
    const errorResponse = {
      statusCode: status,
      message: message,
      ...(details && { errors: details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
