import { Producto } from './producto.entity';

/**
 * Catálogo de EJEMPLO para probar el prototipo.
 * TODO(Marcos): reemplazar por el catálogo real de Luciano.
 */
export const PRODUCTOS_EJEMPLO: Omit<Producto, 'id'>[] = [
  { nombre: 'Taladro percutor 13mm 750W', marca: 'Bosch', categoria: 'taladros', precio: 189000, stock: 4, descripcion: 'Con maletín y 5 mechas.' },
  { nombre: 'Taladro atornillador inalámbrico 20V', marca: 'DeWalt', categoria: 'taladros', precio: 245000, stock: 2, descripcion: 'Incluye 2 baterías y cargador.' },
  { nombre: 'Amoladora angular 115mm 850W', marca: 'Makita', categoria: 'amoladoras', precio: 132000, stock: 6, descripcion: 'Con disco de corte.' },
  { nombre: 'Amoladora angular 230mm 2200W', marca: 'Bosch', categoria: 'amoladoras', precio: 298000, stock: 0, descripcion: 'Uso profesional.' },
  { nombre: 'Sierra circular 185mm 1400W', marca: 'Black+Decker', categoria: 'sierras', precio: 156000, stock: 3, descripcion: 'Con guía paralela.' },
  { nombre: 'Lijadora orbital 300W', marca: 'Black+Decker', categoria: 'lijadoras', precio: 78000, stock: 5, descripcion: 'Con bolsa recolectora.' },
  { nombre: 'Rotomartillo SDS Plus 800W', marca: 'Makita', categoria: 'rotomartillos', precio: 320000, stock: 1, descripcion: 'Con 3 funciones.' },
];
