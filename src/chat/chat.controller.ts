import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AgenteService } from '../agente/agente.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { ConversacionesService } from '../conversaciones/conversaciones.service';
import { VentasService } from '../ventas/ventas.service';

/**
 * Endpoints del simulador. Cuando conectemos WhatsApp, se suma un
 * controller de webhook que llama al mismo AgenteService.responder().
 */
@Controller('api')
export class ChatController {
  constructor(
    private readonly agente: AgenteService,
    private readonly catalogo: CatalogoService,
    private readonly conversaciones: ConversacionesService,
    private readonly ventas: VentasService,
  ) {}

  @Post('chat')
  async chat(@Body() body: { clienteId?: string; mensaje?: string }) {
    const clienteId = body?.clienteId?.trim();
    const mensaje = body?.mensaje?.trim();
    if (!clienteId || !mensaje) {
      throw new BadRequestException('Faltan clienteId o mensaje');
    }
    return { respuesta: await this.agente.responder(clienteId, mensaje) };
  }

  @Delete('chat/:clienteId')
  async reiniciar(@Param('clienteId') clienteId: string) {
    await this.conversaciones.borrar(clienteId);
    return { ok: true };
  }

  @Get('avisos')
  avisos() {
    return this.ventas.pendientes();
  }

  @Patch('avisos/:id/atendido')
  async atendido(@Param('id', ParseIntPipe) id: number) {
    await this.ventas.marcarAtendido(id);
    return { ok: true };
  }

  @Get('catalogo')
  productos() {
    return this.catalogo.todos();
  }
}
