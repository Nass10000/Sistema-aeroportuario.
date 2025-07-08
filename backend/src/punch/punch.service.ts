import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Punch, PunchType } from './punch.entity';
import { User } from '../user/user.entity';

@Injectable()
export class PunchService {
  constructor(
    @InjectRepository(Punch)
    private punchRepository: Repository<Punch>,
  ) {}

  async punch(user: User, type: PunchType, comment?: string) {
    try {
      // 👇 [DEBUG] Imprime el usuario recibido por el servicio (debe tener id)
      console.log('🟢 PunchService: usuario recibido:', user);
      console.log('🔵 PunchService: tipo recibido:', type);

      // VALIDACIÓN de usuario (lanza error si no llega usuario válido)
      const userId = user.id || (user as any).userId;
      if (!userId) {
        throw new HttpException('Usuario no válido - ID no encontrado', HttpStatus.BAD_REQUEST);
      }

      // VALIDACIÓN del tipo de punch (solo acepta 'in' o 'out')
      if (type !== 'in' && type !== 'out') {
        throw new HttpException('Tipo de punch inválido. Use "in" o "out"', HttpStatus.BAD_REQUEST);
      }

      // Validación adicional para evitar marcajes duplicados
      const lastPunch = await this.punchRepository.findOne({
        where: { user: { id: userId } },
        order: { timestamp: 'DESC' }
      });

      if (lastPunch && lastPunch.type === type) {
        const typeText = type === 'in' ? 'entrada' : 'salida';
        throw new HttpException(
          `Ya has marcado ${typeText} recientemente. Tu último marcaje fue ${typeText} el ${lastPunch.timestamp.toLocaleString()}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Crea el registro de punch y lo guarda en la base de datos
      const punch = this.punchRepository.create({ 
        user: { id: userId }, 
        type, 
        comment,
        timestamp: new Date()
      });
      
      const savedPunch = await this.punchRepository.save(punch);
      console.log('✅ PunchService: marcaje guardado:', savedPunch);
      
      return savedPunch;
    } catch (error) {
      console.error('❌ PunchService: error en punch:', error);
      throw error;
    }
  }

  async findByUser(userId: number) {
    return this.punchRepository.find({
      where: { user: { id: userId } },
      order: { timestamp: 'DESC' }
    });
  }
}
