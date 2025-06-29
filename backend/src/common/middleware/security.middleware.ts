import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity'; // Ajusta si la ruta es diferente

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly rateLimitStore: RateLimitStore = {};

  // Configuración de rate limiting para app privada
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
  private readonly RATE_LIMIT_MAX_REQUESTS = 300; // 300 requests por ventana

  // Patrones sospechosos
  private readonly SUSPICIOUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /exec\(/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /'.*or.*'.*='/i,
    /\.\.\//,
    /\.\.\\/,
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const clientIp = this.getClientIp(req);

    // 1. Rate Limiting
    if (!this.checkRateLimit(clientIp)) {
      this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({
        statusCode: 429,
        message: 'Demasiadas solicitudes. Intente más tarde.',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Sanitización de entrada
    this.sanitizeRequest(req);

    // 3. Detección de patrones sospechosos
    if (this.detectSuspiciousActivity(req)) {
      this.logger.error(`Actividad sospechosa detectada desde IP: ${clientIp} - URL: ${req.url}`);
      return res.status(400).json({
        statusCode: 400,
        message: 'Solicitud inválida detectada',
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Headers de seguridad
    this.setSecurityHeaders(res);

    // 5. Buscar el usuario real en la base si existe req.user (payload del JWT)
    try {
      if (req.user && (req.user.sub || req.user.id)) {
        const userId = req.user.sub || req.user.id || req.user.userId;

        const dbUser = await this.userRepository.findOne({ where: { id: userId } });
        if (!dbUser) {
          this.logger.warn(`Usuario no encontrado en base para id: ${userId}`);
        } else {
          req.user = dbUser;
        }
      }
    } catch (err) {
      this.logger.error('Error buscando el usuario en la base:', err);
    }

    next();
  }

  private getClientIp(req: Request): string {
    return req.ip ||
      (req.connection && req.connection.remoteAddress) ||
      (req.socket && req.socket.remoteAddress) ||
      'unknown';
  }

  private checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const client = this.rateLimitStore[clientIp];

    if (!client) {
      this.rateLimitStore[clientIp] = {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      };
      return true;
    }

    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + this.RATE_LIMIT_WINDOW;
      return true;
    }

    if (client.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    client.count++;
    return true;
  }

  // ----------- SANITIZE FIXED -----------
  private sanitizeRequest(req: Request): void {
    // Sanitizar query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        req.query[key] = this.sanitizeObject(req.query[key]);
      });
    }

    // Sanitizar body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        req.body[key] = this.sanitizeObject(req.body[key]);
      });
    }

    // Sanitizar params
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        req.params[key] = this.sanitizeObject(req.params[key]);
      });
    }
  }
  // --------------------------------------

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    return str
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remover caracteres de control
      .replace(/\x00/g, '') // Remover null bytes
      .slice(0, 1000); // Limitar longitud
  }

  private detectSuspiciousActivity(req: Request): boolean {
    const checkString = (str: string): boolean => {
      return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(str));
    };

    const checkObject = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return checkString(obj);
      }

      if (Array.isArray(obj)) {
        return obj.some(item => checkObject(item));
      }

      if (obj && typeof obj === 'object') {
        return Object.values(obj).some(value => checkObject(value));
      }

      return false;
    };

    // Verificar URL
    if (checkString(req.url)) return true;

    // Verificar headers sospechosos
    const userAgent = req.get('user-agent') || '';
    if (checkString(userAgent)) return true;

    // Verificar body
    if (req.body && checkObject(req.body)) return true;

    // Verificar query params
    if (req.query && checkObject(req.query)) return true;

    return false;
  }

  private setSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
}
