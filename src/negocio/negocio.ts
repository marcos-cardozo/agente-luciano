/**
 * Datos fijos del negocio de Luciano.
 *
 * TODO(Marcos): completar con Luciano. Todo lo que dice "COMPLETAR" es un
 * marcador: el agente tiene instrucciones de NO inventar esos datos y
 * derivar a Luciano mientras sigan así.
 */
export const NEGOCIO = {
  nombre: 'Herramientas Luciano', // COMPLETAR: nombre real del negocio
  dueno: 'Luciano',
  ubicacion: 'COMPLETAR (barrio o zona de retiro)',
  horarios: 'COMPLETAR (ej: lunes a sábado de 9 a 19 hs)',
  envios: 'COMPLETAR (ej: envíos en Córdoba Capital, costo según zona)',
  mediosDePago: 'COMPLETAR (ej: efectivo, transferencia, Mercado Pago)',
  garantia: 'COMPLETAR (ej: 6 meses de garantía en herramientas nuevas)',
};

/** Las 5 preguntas frecuentes del prototipo. */
export const PREGUNTAS_FRECUENTES = [
  { tema: 'precio y stock', respuesta: 'Se consulta en el catálogo con la herramienta buscar_productos.' },
  { tema: 'ubicación / retiro', respuesta: NEGOCIO.ubicacion },
  { tema: 'horarios', respuesta: NEGOCIO.horarios },
  { tema: 'envíos', respuesta: NEGOCIO.envios },
  { tema: 'medios de pago', respuesta: NEGOCIO.mediosDePago },
];
