import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type Anthropic from '@anthropic-ai/sdk';
import { AppModule } from '../src/app.module';
import { CLIENTE_LLM, ClienteLLM } from '../src/agente/cliente-llm';
import { AgenteService } from '../src/agente/agente.service';
import { AvisoVenta } from '../src/ventas/aviso-venta.entity';
import { Mensaje } from '../src/conversaciones/mensaje.entity';

/**
 * Test de punta a punta con Postgres real y un "Claude falso" con respuestas guionadas.
 * Requiere la base levantada (docker compose up -d). No gasta API.
 */

type Respuesta = Pick<Anthropic.Messages.Message, 'content' | 'stop_reason'>;

class ClaudeFalso implements ClienteLLM {
  llamadas: Anthropic.Messages.MessageCreateParamsNonStreaming[] = [];
  constructor(private guion: Respuesta[]) {}
  async crear(params: Anthropic.Messages.MessageCreateParamsNonStreaming) {
    // Copia profunda: el agente sigue modificando el array de mensajes después.
    this.llamadas.push(JSON.parse(JSON.stringify(params)));
    const r = this.guion.shift();
    if (!r) throw new Error('El guion se quedó sin respuestas');
    return r as Anthropic.Messages.Message;
  }
}

const texto = (t: string): Respuesta => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: t, citations: null }] as any });
const herramienta = (id: string, name: string, input: object): Respuesta => ({
  stop_reason: 'tool_use',
  content: [{ type: 'tool_use', id, name, input }] as any,
});

describe('Agente de Luciano', () => {
  let app: INestApplication;
  let agente: AgenteService;
  let claude: ClaudeFalso;

  before(async () => {
    process.env.ANTHROPIC_API_KEY ??= 'test';
    claude = new ClaudeFalso([]);
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CLIENTE_LLM)
      .useValue(claude)
      .compile();
    app = modulo.createNestApplication();
    await app.init();
    agente = app.get(AgenteService);
    await app.get(getRepositoryToken(Mensaje)).clear();
    await app.get(getRepositoryToken(AvisoVenta)).clear();
  });

  after(() => app.close());

  it('consulta el catálogo real antes de responder un precio', async () => {
    (claude as any).guion = [
      herramienta('t1', 'buscar_productos', { consulta: 'amoladora makita' }),
      texto('La amoladora Makita 115mm está $132.000 y tenemos stock 👍'),
    ];

    const respuesta = await agente.responder('cliente-1', '¿Cuánto sale la amoladora Makita?');

    assert.match(respuesta, /\$132\.000/);
    // La segunda llamada a Claude lleva el resultado de la búsqueda en la base.
    const segunda = claude.llamadas[1];
    const resultado = (segunda.messages.at(-1)!.content as any[])[0];
    assert.equal(resultado.type, 'tool_result');
    assert.equal(resultado.tool_use_id, 't1');
    const productos = JSON.parse(resultado.content);
    assert.equal(productos.length, 1);
    assert.equal(productos[0].marca, 'Makita');
    assert.equal(productos[0].precio_pesos, 132000);
    assert.equal(productos[0].stock, 6);
  });

  it('avisa a Luciano cuando el cliente quiere comprar, y guarda el historial', async () => {
    claude.llamadas = [];
    (claude as any).guion = [
      herramienta('t2', 'avisar_a_luciano', {
        producto: 'Amoladora angular 115mm 850W',
        cantidad: 1,
        nombre_cliente: 'Juan',
        detalle: 'Retira en el local, paga en efectivo',
      }),
      texto('¡Listo Juan! Luciano te escribe en un rato para cerrar la compra.'),
    ];

    await agente.responder('cliente-1', 'La quiero, soy Juan, la paso a buscar y pago en efectivo');

    const avisos = await app.get(getRepositoryToken(AvisoVenta)).find();
    assert.equal(avisos.length, 1);
    assert.equal(avisos[0].clienteId, 'cliente-1');
    assert.equal(avisos[0].nombreCliente, 'Juan');
    assert.equal(avisos[0].estado, 'pendiente');

    // El historial anterior viaja en la conversación (memoria entre mensajes).
    const primera = claude.llamadas[0];
    assert.deepEqual(primera.messages.map((m) => m.role), ['user', 'assistant', 'user']);
    assert.match(String(primera.messages[1].content), /\$132\.000/);
  });

  it('si el modelo falla, contesta un mensaje amable en vez de romperse', async () => {
    (claude as any).guion = [];
    const respuesta = await agente.responder('cliente-2', 'hola');
    assert.match(respuesta, /Luciano/);
  });

  it('búsqueda sin coincidencias devuelve un aviso claro para el modelo', async () => {
    const r = JSON.parse(await agente.ejecutarHerramienta('x', 'buscar_productos', { consulta: 'motosierra stihl' }));
    assert.match(r.resultado, /No hay productos/);
  });

  it('junta mensajes seguidos del mismo lado y arranca siempre por el cliente', () => {
    const msgs = agente.armarMensajes([
      { rol: 'agente', texto: 'mensaje suelto' },
      { rol: 'cliente', texto: 'hola' },
      { rol: 'cliente', texto: '¿tenés taladros?' },
      { rol: 'agente', texto: 'sí' },
    ]);
    assert.deepEqual(msgs, [
      { role: 'user', content: 'hola\n¿tenés taladros?' },
      { role: 'assistant', content: 'sí' },
    ]);
  });
});
