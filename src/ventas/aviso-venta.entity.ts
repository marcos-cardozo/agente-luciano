import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Un aviso para Luciano: un cliente quiere comprar.
 * El agente NO cierra la venta: junta los datos y avisa. La venta la cierra Luciano.
 */
@Entity('avisos_venta')
export class AvisoVenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clienteId: string;

  @Column({ default: '' })
  nombreCliente: string;

  @Column()
  producto: string;

  @Column('int', { default: 1 })
  cantidad: number;

  /** Retiro, envío, forma de pago, dudas pendientes... lo que el cliente haya dicho. */
  @Column('text', { default: '' })
  detalle: string;

  @Column({ default: 'pendiente' })
  estado: 'pendiente' | 'atendido';

  @CreateDateColumn()
  creadoEn: Date;
}
