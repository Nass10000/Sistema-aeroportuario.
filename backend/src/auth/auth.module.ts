// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    // Asegúrate de que ConfigModule esté cargado (si lo has hecho global en AppModule,
    // no hace falta volver a importarlo aquí)
    ConfigModule,

    UserModule,
    PassportModule,

    // Ahora leemos el JWT_SECRET desde ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    RolesGuard,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
