import Anthropic from '@anthropic-ai/sdk';

/**
 * Lo único que el agente necesita del modelo: mandarle mensajes y recibir la respuesta.
 * Lo separamos en una interfaz para poder probar el agente sin gastar API
 * (en los tests usamos un "modelo falso" con respuestas guionadas).
 */
export interface ClienteLLM {
  crear(params: Anthropic.Messages.MessageCreateParamsNonStreaming): Promise<Anthropic.Messages.Message>;
}

export const CLIENTE_LLM = Symbol('CLIENTE_LLM');

export class ClienteAnthropic implements ClienteLLM {
  private readonly anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  crear(params: Anthropic.Messages.MessageCreateParamsNonStreaming) {
    return this.anthropic.messages.create(params);
  }
}
