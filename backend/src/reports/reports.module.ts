import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../assignment/assignment.entity';
import { Operation } from '../operation/operation.entity';
import { Station } from '../station/station.entity';
import { User } from '../user/user.entity';
import { Punch } from '../punch/punch.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment, Operation, Station, User, Punch])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
