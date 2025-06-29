import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class MethodNotAllowedInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request.method.toUpperCase();
    
    // Lista de métodos HTTP no soportados que deberían devolver 405
    const unsupportedMethods = ['TRACE', 'CONNECT', 'HEAD'];
    
    if (unsupportedMethods.includes(method)) {
      // Configurar headers de métodos permitidos
      response.set('Allow', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      
      throw new HttpException(
        {
          statusCode: HttpStatus.METHOD_NOT_ALLOWED,
          message: `Método ${method} no permitido en esta ruta`,
          error: 'Method Not Allowed',
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
        },
        HttpStatus.METHOD_NOT_ALLOWED,
      );
    }

    return next.handle().pipe(
      catchError((error) => {
        // Si el error es 404 y es por método no soportado, convertir a 405
        if (error.status === 404 && error.message?.includes('Cannot')) {
          const methodMatch = error.message.match(/Cannot\s+(\w+)\s+/);
          if (methodMatch) {
            const detectedMethod = methodMatch[1].toUpperCase();
            if (unsupportedMethods.includes(detectedMethod)) {
              response.set('Allow', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
              
              return throwError(() => new HttpException(
                {
                  statusCode: HttpStatus.METHOD_NOT_ALLOWED,
                  message: `Método ${detectedMethod} no permitido en esta ruta`,
                  error: 'Method Not Allowed',
                  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
                },
                HttpStatus.METHOD_NOT_ALLOWED
              ));
            }
          }
        }
        return throwError(() => error);
      })
    );
  }
}
