import type Anthropic from '@anthropic-ai/sdk';

/**
 * Las "herramientas" (tools) son funciones de tu código que Claude puede pedir usar.
 * Claude no las ejecuta: te dice "quiero usar buscar_productos con {consulta: 'taladro'}",
 * vos la ejecutás en NestJS y le devolvés el resultado. Ese ida y vuelta es el corazón de un agente.
 */
export const HERRAMIENTAS: Anthropic.Messages.Tool[] = [
  {
    name: 'buscar_productos',
    description:
      'Busca productos en el catálogo de Luciano por nombre, marca o categoría. Devuelve nombre, marca, precio en pesos y stock. Usala siempre que el cliente pregunte por un producto, precio o disponibilidad.',
    input_schema: {
      type: 'object',
      properties: {
        consulta: {
          type: 'string',
          description: 'Palabras clave, por ejemplo "taladro bosch" o "amoladora".',
        },
      },
      required: ['consulta'],
    },
  },
  {
    name: 'avisar_a_luciano',
    description:
      'Avisa a Luciano que un cliente quiere comprar, para que él lo contacte y cierre la venta. Usala solo cuando el cliente muestre intención clara de compra, o cuando pida atención humana.',
    input_schema: {
      type: 'object',
      properties: {
        producto: { type: 'string', description: 'Nombre exacto del producto del catálogo, o "ATENCIÓN HUMANA".' },
        cantidad: { type: 'integer', description: 'Cantidad que quiere comprar. 1 si no lo dijo.' },
        nombre_cliente: { type: 'string', description: 'Nombre del cliente, si lo dio.' },
        detalle: {
          type: 'string',
          description: 'Retiro o envío, zona, forma de pago y cualquier duda pendiente que haya mencionado.',
        },
      },
      required: ['producto', 'cantidad', 'detalle'],
    },
  },
];
