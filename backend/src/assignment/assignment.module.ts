import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './assignment.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { NotificationModule } from '../notification/notification.module'; // <-- Importa el módulo

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment]),
    NotificationModule, // <-- Agrégalo aquí
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
