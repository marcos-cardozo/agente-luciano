import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Producto } from './producto.entity';

@Injectable()
export class CatalogoService {
  constructor(@InjectRepository(Producto) private readonly productos: Repository<Producto>) {}

  /**
   * Busca productos por palabras sueltas en nombre, marca o categoría.
   * "taladro bosch" encuentra los productos que tengan "taladro" Y "bosch".
   */
  async buscar(consulta: string, limite = 5): Promise<Producto[]> {
    const palabras = consulta
      .toLowerCase()
      .split(/\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 1);

    if (palabras.length === 0) return [];

    const qb = this.productos.createQueryBuilder('p');
    palabras.forEach((palabra, i) => {
      qb.andWhere(
        `(p.nombre ILIKE :w${i} OR p.marca ILIKE :w${i} OR p.categoria ILIKE :w${i})`,
        { [`w${i}`]: `%${palabra}%` },
      );
    });
    return qb.orderBy('p.stock', 'DESC').limit(limite).getMany();
  }

  porNombre(nombre: string): Promise<Producto | null> {
    return this.productos.findOne({ where: { nombre: ILike(nombre) } });
  }

  todos(): Promise<Producto[]> {
    return this.productos.find({ order: { categoria: 'ASC', nombre: 'ASC' } });
  }
}
