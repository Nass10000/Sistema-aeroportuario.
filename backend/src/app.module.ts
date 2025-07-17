// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { User } from './user/user.entity';
import { Station } from './station/station.entity';
import { Operation } from './operation/operation.entity';
import { Assignment } from './assignment/assignment.entity';
import { Punch } from './punch/punch.entity';
import { Notification } from './notification/notification.entity';

import { UserModule } from './user/user.module';
import { StationModule } from './station/station.module';
import { OperationModule } from './operation/operation.module';
import { AssignmentModule } from './assignment/assignment.module';
import { AuthModule } from './auth/auth.module';
import { PunchModule } from './punch/punch.module';
import { NotificationModule } from './notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { OdooModule } from './odoo/odoo.module';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { ImprovedSecurityExceptionFilter } from './common/filters/improved-security-exception.filter';

@Module({
  imports: [
    // Carga global de las variables de entorno
    ConfigModule.forRoot({ isGlobal: true }),

    // Configuración de TypeORM / PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || undefined,
      host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
      port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || 'postgres'),
      password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'password'),
      database: process.env.DATABASE_URL ? undefined : (process.env.DB_DATABASE || 'aeo_db'),
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    TypeOrmModule.forFeature([User, Station, Operation, Assignment, Punch, Notification]),

    // Módulos de la aplicación
    UserModule,
    StationModule,
    OperationModule,
    AssignmentModule,
    AuthModule,
    PunchModule,
    NotificationModule,
    DashboardModule,
    ReportsModule,
    SchedulingModule,
    OdooModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ImprovedSecurityExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
