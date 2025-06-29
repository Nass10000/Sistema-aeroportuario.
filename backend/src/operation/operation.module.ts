import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Operation } from './operation.entity';
import { Station } from '../station/station.entity';
import { OperationService } from './operation.service';
import { OperationController } from './operation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Operation, Station])],
  providers: [OperationService],
  controllers: [OperationController],
  exports: [OperationService],
})
export class OperationModule {}
