import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { OdooService } from './odoo.service';
import { OdooController } from './odoo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [OdooService],
  controllers: [OdooController],
  exports: [OdooService],
})
export class OdooModule {}
