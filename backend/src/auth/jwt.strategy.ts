// src/auth/jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    this.logger.log('🔐 JWT Strategy: Initialized with secret from ConfigService');
  }

  async validate(payload: any) {
    const user = {
      userId: payload.sub,
      email: payload.username,
      role: payload.role,
      stationId: payload.stationId,
      supervisorId: payload.supervisorId,
    };

    this.logger.log(`🔒 JWT Strategy: Token validation successful, user: ${JSON.stringify(user)}`);
    return user;
  }
}
