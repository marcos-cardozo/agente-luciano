import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './mensaje.entity';

@Injectable()
export class ConversacionesService {
  constructor(@InjectRepository(Mensaje) private readonly mensajes: Repository<Mensaje>) {}

  guardar(clienteId: string, rol: Mensaje['rol'], texto: string) {
    return this.mensajes.save(this.mensajes.create({ clienteId, rol, texto }));
  }

  /** Los últimos N mensajes del cliente, del más viejo al más nuevo. */
  async historial(clienteId: string, limite = 20): Promise<Mensaje[]> {
    const ultimos = await this.mensajes.find({
      where: { clienteId },
      order: { id: 'DESC' },
      take: limite,
    });
    return ultimos.reverse();
  }

  borrar(clienteId: string) {
    return this.mensajes.delete({ clienteId });
  }
}
