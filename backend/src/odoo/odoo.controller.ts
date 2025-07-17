import { Controller, Get } from '@nestjs/common';
import { OdooService } from './odoo.service';

@Controller('odoo')
export class OdooController {
  constructor(private readonly odoo: OdooService) {}

  @Get('sync')
  async sync() {
    await this.odoo.syncEmployees();
    return { message: 'Sincronización completada' };
  }

  @Get('employees')
  async getEmployees() {
    return this.odoo.getEmployees();
  }

  @Get('contacts')
  async getContacts() {
    return this.odoo.getContacts();
  }
}
