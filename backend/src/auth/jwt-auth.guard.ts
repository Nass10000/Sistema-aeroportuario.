import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🛡️ JwtAuthGuard: Checking authorization header:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader?.substring(0, 30) + '...'
    });

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    console.log('🛡️ JwtAuthGuard: Handle request result:', {
      hasError: !!err,
      hasUser: !!user,
      info: info,
      errorMessage: err?.message
    });

    if (err || !user) {
      console.log('🚫 JwtAuthGuard: Token validation failed:', {
        error: err?.message,
        info: info?.message,
        user: user
      });
      throw err || new UnauthorizedException();
    }

    console.log('✅ JwtAuthGuard: Token validation successful for user:', user);
    return user; // SOLO retorna el payload del JWT
  }
}
