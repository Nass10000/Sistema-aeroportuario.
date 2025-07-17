import { Injectable } from '@nestjs/common';
import * as xmlrpc from 'xmlrpc';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class OdooService {
  private clientCommon = xmlrpc.createClient({ url: `${process.env.ODOO_URL}/xmlrpc/2/common` });
  private clientObject = xmlrpc.createClient({ url: `${process.env.ODOO_URL}/xmlrpc/2/object` });
  private uid: number;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private async authenticate(): Promise<number> {
    if (this.uid) return this.uid;
    return new Promise((res, rej) =>
      this.clientCommon.methodCall(
        'login',
        [process.env.ODOO_DATABASE || 'aeo_odoo', process.env.ODOO_USERNAME, process.env.ODOO_PASSWORD],
        (err, uid: number) => (err ? rej(err) : res(this.uid = uid))
      )
    );
  }

  async createEmployee(emp: { name: string; work_email: string }): Promise<number> {
    const uid = await this.authenticate();
    return new Promise((res, rej) =>
      this.clientObject.methodCall(
        'execute_kw',
        [
          process.env.ODOO_DATABASE || 'aeo_odoo', uid, process.env.ODOO_PASSWORD,
          'hr.employee', 'create',
          [{ name: emp.name, work_email: emp.work_email }]
        ],
        (err, id: number) => (err ? rej(err) : res(id))
      )
    );
  }

  // Nuevo método de sincronización
  async syncEmployees(): Promise<void> {
    const emps = await this.userRepo.find({ where: { role: UserRole.EMPLOYEE, isActive: true } });
    for (const u of emps) {
      await this.createEmployee({ name: u.name, work_email: u.email });
    }
  }

  async getEmployees(): Promise<any[]> {
    const uid = await this.authenticate();
    return new Promise<any[]>((resolve, reject) => {
      this.clientObject.methodCall(
        'execute_kw',
        [
          process.env.ODOO_DATABASE || 'aeo_odoo',
          uid,
          process.env.ODOO_PASSWORD,
          'hr.employee',
          'search_read',
          [[]],
          { fields: ['id', 'name', 'work_email'] }
        ],
        (err, res: any[]) => (err ? reject(err) : resolve(res))
      );
    });
  }

  async getContacts(): Promise<any[]> {
    const uid = await this.authenticate();
    return new Promise<any[]>((resolve, reject) => {
      this.clientObject.methodCall(
        'execute_kw',
        [
          process.env.ODOO_DATABASE || 'aeo_odoo',
          uid,
          process.env.ODOO_PASSWORD,
          'res.partner',
          'search_read',
          [[]],
          { fields: ['id', 'name', 'email', 'phone'] }
        ],
        (err, res: any[]) => (err ? reject(err) : resolve(res))
      );
    });
  }
}
