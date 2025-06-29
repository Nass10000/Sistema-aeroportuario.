import { 
  ValidationPipe, 
  BadRequestException,
  ValidationPipeOptions
} from '@nestjs/common';

export class SecurityValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      // Configuraciones de seguridad
      whitelist: true, // Solo propiedades definidas en DTOs
      forbidNonWhitelisted: true, // Rechazar propiedades no permitidas
      transform: true, // Transformar tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Conversión automática de tipos
      },
      // Mensajes de error detallados para desarrollo
      disableErrorMessages: false,
      // Validación detallada
      validationError: {
        target: false, // No incluir el objeto completo en errores
        value: false,  // No incluir valores en errores (seguridad)
      },
      // Función personalizada para formatear errores
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = Object.values(error.constraints || {});
          return {
            property: error.property,
            messages: constraints,
            rejectedValue: error.value ? '[FILTRADO POR SEGURIDAD]' : undefined
          };
        });
        
        return new BadRequestException({
          statusCode: 400,
          message: 'Datos de entrada inválidos',
          errors: messages,
          timestamp: new Date().toISOString()
        });
      },
      ...options,
    });
  }
}
