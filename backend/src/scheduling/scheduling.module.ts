import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../assignment/assignment.entity';
import { User } from '../user/user.entity';
import { Operation } from '../operation/operation.entity';
import { Station } from '../station/station.entity';
import { NotificationModule } from '../notification/notification.module';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, User, Operation, Station]),
    NotificationModule,
  ],
  providers: [SchedulingService],
  controllers: [SchedulingController],
  exports: [SchedulingService],
})
export class SchedulingModule {}
