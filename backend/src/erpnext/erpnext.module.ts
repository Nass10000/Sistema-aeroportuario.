import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ErpNextService } from './erpnext.service';
import { ErpNextController } from './erpnext.controller';

@Module({
  imports: [HttpModule],
  providers: [ErpNextService],
  controllers: [ErpNextController],
  exports: [ErpNextService],
})
export class ErpNextModule {}
