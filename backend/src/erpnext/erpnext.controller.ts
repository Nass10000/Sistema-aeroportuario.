import { Controller, Get, Post, Body } from '@nestjs/common';
import { ErpNextService } from './erpnext.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

@Controller('erpnext')
export class ErpNextController {
  constructor(private readonly erp: ErpNextService) {}

  @Get('empleados')
  async getEmpleados() {
    return this.erp.getEmployees();
  }

  @Post('empleados')
  async createEmpleado(@Body() employeeData: CreateEmployeeDto) {
    return this.erp.createEmployee(employeeData);
  }
}
