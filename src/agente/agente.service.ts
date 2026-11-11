import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Anthropic from '@anthropic-ai/sdk';
import { CatalogoService } from '../catalogo/catalogo.service';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { VentasService } from '../ventas/ventas.service';
import { CLIENTE_LLM, ClienteLLM } from './cliente-llm';
import { HERRAMIENTAS } from './herramientas';
import { armarPromptDelSistema } from './prompt';

type MessageParam = Anthropic.Messages.MessageParam;

/** Cuántas vueltas de herramientas puede dar el agente antes de cortar, por seguridad. */
const MAX_VUELTAS = 5;

const RESPUESTA_DE_ERROR =
  'Uy, se me complicó responderte ahora 😅. Ya le aviso a Luciano para que te escriba.';

@Injectable()
export class AgenteService {
  private readonly logger = new Logger('Agente');

  constructor(
    @Inject(CLIENTE_LLM) private readonly llm: ClienteLLM,
    private readonly config: ConfigService,
    private readonly catalogo: CatalogoService,
    private readonly conversaciones: ConversacionesService,
    private readonly ventas: VentasService,
  ) {}

  /**
   * Recibe el mensaje de un cliente y devuelve la respuesta del agente.
   * Este método es el que después va a llamar el webhook de WhatsApp.
   */
  async responder(clienteId: string, textoCliente: string): Promise<string> {
    await this.conversaciones.guardar(clienteId, 'cliente', textoCliente);
    const historial = await this.conversaciones.historial(clienteId);
    const mensajes = this.armarMensajes(historial);

    let respuesta: string;
    try {
      respuesta = await this.bucleDelAgente(clienteId, mensajes);
    } catch (error) {
      this.logger.error(`Falló el modelo para ${clienteId}: ${(error as Error).message}`);
      respuesta = RESPUESTA_DE_ERROR;
    }

    await this.conversaciones.guardar(clienteId, 'agente', respuesta);
    return respuesta;
  }

  /**
   * El bucle del agente:
   * 1. Le mandamos la conversación a Claude.
   * 2. Si Claude pide una herramienta (stop_reason = "tool_use"), la ejecutamos
   *    y le devolvemos el resultado. Volvemos al paso 1.
   * 3. Si Claude responde con texto (stop_reason = "end_turn"), esa es la respuesta.
   */
  private async bucleDelAgente(clienteId: string, mensajes: MessageParam[]): Promise<string> {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const resultado = await this.llm.crear({
        model: this.config.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5',
        max_tokens: 1024,
        system: armarPromptDelSistema(),
        tools: HERRAMIENTAS,
        messages: mensajes,
      });

      if (resultado.stop_reason !== 'tool_use') {
        return this.extraerTexto(resultado.content) || RESPUESTA_DE_ERROR;
      }

      // Claude pidió una o más herramientas: las ejecutamos y le devolvemos los resultados.
      mensajes.push({ role: 'assistant', content: resultado.content });
      const resultados: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const bloque of resultado.content) {
        if (bloque.type !== 'tool_use') continue;
        this.logger.log(`🛠️  ${bloque.name}(${JSON.stringify(bloque.input)})`);
        resultados.push({
          type: 'tool_result',
          tool_use_id: bloque.id,
          content: await this.ejecutarHerramienta(clienteId, bloque.name, bloque.input),
        });
      }
      mensajes.push({ role: 'user', content: resultados });
    }
    this.logger.warn(`El agente superó ${MAX_VUELTAS} vueltas con ${clienteId}`);
    return RESPUESTA_DE_ERROR;
  }

  /** Ejecuta una herramienta y devuelve el resultado como texto (JSON) para Claude. */
  async ejecutarHerramienta(clienteId: string, nombre: string, input: unknown): Promise<string> {
    const datos = (input ?? {}) as Record<string, unknown>;
    switch (nombre) {
      case 'buscar_productos': {
        const productos = await this.catalogo.buscar(String(datos.consulta ?? ''));
        if (productos.length === 0) {
          return JSON.stringify({ resultado: 'No hay productos que coincidan con esa búsqueda.' });
        }
        return JSON.stringify(
          productos.map((p) => ({
            nombre: p.nombre,
            marca: p.marca,
            precio_pesos: p.precio,
            stock: p.stock,
            descripcion: p.descripcion,
          })),
        );
      }
      case 'avisar_a_luciano': {
        const aviso = await this.ventas.avisarALuciano({
          clienteId,
          producto: String(datos.producto ?? ''),
          cantidad: Number(datos.cantidad ?? 1) || 1,
          nombreCliente: String(datos.nombre_cliente ?? ''),
          detalle: String(datos.detalle ?? ''),
        });
        return JSON.stringify({ resultado: 'Aviso enviado a Luciano.', aviso_id: aviso.id });
      }
      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${nombre}` });
    }
  }

  /**
   * Convierte el historial guardado al formato que pide la API:
   * roles "user"/"assistant" alternados, empezando por "user".
   */
  armarMensajes(historial: { rol: 'cliente' | 'agente'; texto: string }[]): MessageParam[] {
    const mensajes: MessageParam[] = [];
    for (const m of historial) {
      const role = m.rol === 'cliente' ? 'user' : 'assistant';
      const ultimo = mensajes[mensajes.length - 1];
      if (ultimo && ultimo.role === role) {
        // Dos mensajes seguidos del mismo lado (ej: el cliente manda 3 mensajes): se juntan.
        ultimo.content = `${ultimo.content as string}\n${m.texto}`;
      } else {
        mensajes.push({ role, content: m.texto });
      }
    }
    while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
    return mensajes;
  }

  private extraerTexto(contenido: Anthropic.Messages.ContentBlock[]): string {
    return contenido
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }
}
