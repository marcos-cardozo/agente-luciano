import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvisoVenta } from './aviso-venta.entity';

@Injectable()
export class VentasService {
  private readonly logger = new Logger('Ventas');

  constructor(@InjectRepository(AvisoVenta) private readonly avisos: Repository<AvisoVenta>) {}

  async avisarALuciano(datos: Omit<AvisoVenta, 'id' | 'estado' | 'creadoEn'>): Promise<AvisoVenta> {
    const aviso = await this.avisos.save(this.avisos.create(datos));
    // En el prototipo el aviso queda en la base y en la consola.
    // Más adelante: mandarle un WhatsApp a Luciano con estos datos.
    this.logger.warn(
      `🔔 NUEVA VENTA para Luciano → ${aviso.cantidad} x ${aviso.producto} | cliente: ${aviso.nombreCliente || aviso.clienteId} | ${aviso.detalle}`,
    );
    return aviso;
  }

  pendientes(): Promise<AvisoVenta[]> {
    return this.avisos.find({ order: { id: 'DESC' } });
  }

  async marcarAtendido(id: number) {
    await this.avisos.update(id, { estado: 'atendido' });
  }
}
