import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Un mensaje de la conversación con un cliente (lo que escribió él o lo que contestó el agente). */
@Entity('mensajes')
export class Mensaje {
  @PrimaryGeneratedColumn()
  id: number;

  /** Identifica al cliente. En WhatsApp va a ser su número de teléfono. */
  @Index()
  @Column()
  clienteId: string;

  @Column()
  rol: 'cliente' | 'agente';

  @Column('text')
  texto: string;

  @CreateDateColumn()
  creadoEn: Date;
}
