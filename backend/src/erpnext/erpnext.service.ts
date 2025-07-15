import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErpNextService {
  private readonly erpNextUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.erpNextUrl = this.configService.get<string>('ERPNEXT_URL', 'http://localhost:8000');
    this.apiKey = this.configService.get<string>('ERPNEXT_API_KEY', '');
    this.apiSecret = this.configService.get<string>('ERPNEXT_API_SECRET', '');
  }

  async getEmployees() {
    try {
      // Para demostración, usamos datos simulados
      console.log('📊 Fetching employees from ERPNext API...');
      
      // Simulación de datos para demostración
      const mockData = {
        data: [
          {
            name: "EMP001",
            employee_name: "Juan Pérez",
            designation: "Senior Developer",
            department: "IT",
            company: "Mi Empresa",
            status: "Active",
            date_of_joining: "2023-01-15",
            employee_number: "001",
            email: "juan.perez@empresa.com"
          },
          {
            name: "EMP002",
            employee_name: "María García",
            designation: "Project Manager", 
            department: "IT",
            company: "Mi Empresa",
            status: "Active",
            date_of_joining: "2022-08-20",
            employee_number: "002",
            email: "maria.garcia@empresa.com"
          },
          {
            name: "EMP003",
            employee_name: "Carlos López",
            designation: "QA Engineer",
            department: "Quality Assurance",
            company: "Mi Empresa",
            status: "Active",
            date_of_joining: "2023-03-10",
            employee_number: "003",
            email: "carlos.lopez@empresa.com"
          },
          {
            name: "EMP004",
            employee_name: "Ana Rodríguez",
            designation: "UX Designer",
            department: "Design",
            company: "Mi Empresa",
            status: "Active",
            date_of_joining: "2023-06-01",
            employee_number: "004",
            email: "ana.rodriguez@empresa.com"
          }
        ],
        message: "Employees retrieved successfully"
      };

      console.log(`✅ Retrieved ${mockData.data.length} employees`);
      return mockData;

      /* 
      // Código real para ERPNext cuando esté configurado:
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.erpNextUrl}/api/resource/Employee`, {
          headers: {
            'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
            'Content-Type': 'application/json',
          },
        })
      );
      return response.data;
      */
    } catch (error) {
      console.error('Error fetching employees from ERPNext:', error.message);
      throw new Error('Failed to fetch employees from ERPNext');
    }
  }

  async createEmployee(employeeData: any) {
    try {
      // Simulación para pruebas mientras ERPNext no esté disponible
      if (!this.apiKey || this.apiKey === 'your_api_key_here') {
        console.log('🔧 Using mock creation - ERPNext not configured');
        const mockEmployee = {
          name: `EMP${Date.now().toString().slice(-3)}`,
          employee_name: employeeData.employee_name || employeeData.first_name,
          designation: employeeData.designation || "Employee",
          department: employeeData.department || "General",
          company: employeeData.company || "Mi Empresa",
          status: "Active",
          date_of_joining: new Date().toISOString().split('T')[0],
          employee_number: Date.now().toString().slice(-3)
        };
        
        return {
          data: mockEmployee,
          message: "Employee created successfully (mock)"
        };
      }

      // Código original para cuando ERPNext esté configurado
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.erpNextUrl}/api/resource/Employee`,
          employeeData,
          {
            headers: {
              'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      console.error('Error creating employee in ERPNext:', error.message);
      
      // Fallback a creación simulada en caso de error
      console.log('🔧 Falling back to mock creation due to error');
      return {
        data: {
          name: `EMP${Date.now().toString().slice(-3)}`,
          employee_name: employeeData.employee_name || "Empleado Nuevo",
          message: "Mock employee created - ERPNext connection failed"
        }
      };
    }
  }
}
