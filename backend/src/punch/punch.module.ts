import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Punch } from './punch.entity';
import { PunchService } from './punch.service';
import { PunchController } from './punch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Punch])],
  providers: [PunchService],
  controllers: [PunchController],
  exports: [PunchService],
})
export class PunchModule {}
