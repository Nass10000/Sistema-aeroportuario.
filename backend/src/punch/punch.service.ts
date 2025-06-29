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
    // 👇 [DEBUG] Imprime el usuario recibido por el servicio (debe tener id)
    console.log('🟢 PunchService: usuario recibido:', user);

    // 👇 [DEBUG] Imprime el tipo de marcaje recibido ('in' o 'out')
    console.log('🔵 PunchService: tipo recibido:', type);

    // VALIDACIÓN de usuario (lanza error si no llega usuario válido)
const userId = user.id || (user as any).userId;
if (!userId) {
  throw new HttpException('Usuario no válido', HttpStatus.BAD_REQUEST);
}



    // VALIDACIÓN del tipo de punch (solo acepta 'in' o 'out')
    if (type !== 'in' && type !== 'out') {
      throw new HttpException('Tipo de punch inválido', HttpStatus.BAD_REQUEST);
    }

    // [Opcional] Aquí podrías agregar validación de asignación activa

    // Crea el registro de punch y lo guarda en la base de datos
   const punch = this.punchRepository.create({ user: { id: userId }, type, comment });
  return this.punchRepository.save(punch);
}

  async findByUser(userId: number) {
    return this.punchRepository.find({
      where: { user: { id: userId } },
      order: { timestamp: 'DESC' }
    });
  }
}
