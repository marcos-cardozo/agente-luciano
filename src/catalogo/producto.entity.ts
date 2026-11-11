import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  marca: string;

  @Column()
  categoria: string;

  /** Precio en pesos, sin decimales. */
  @Column('int')
  precio: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('text', { default: '' })
  descripcion: string;
}
