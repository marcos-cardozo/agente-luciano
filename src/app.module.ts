import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoModule } from './catalogo/catalogo.module';
import { Producto } from './catalogo/producto.entity';
import { Mensaje } from './conversaciones/mensaje.entity';
import { ConversacionesService } from './conversaciones/conversaciones.service';
import { AvisoVenta } from './ventas/aviso-venta.entity';
import { VentasService } from './ventas/ventas.service';
import { AgenteService } from './agente/agente.service';
import { CLIENTE_LLM, ClienteAnthropic } from './agente/cliente-llm';
import { ChatController } from './chat/chat.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'agente'),
        password: config.get('DB_PASSWORD', 'agente'),
        database: config.get('DB_NAME', 'agente_luciano'),
        entities: [Producto, Mensaje, AvisoVenta],
        // Solo para el prototipo: crea/actualiza las tablas solo. En producción, migraciones.
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Mensaje, AvisoVenta]),
    CatalogoModule,
  ],
  controllers: [ChatController],
  providers: [
    ConversacionesService,
    VentasService,
    AgenteService,
    {
      provide: CLIENTE_LLM,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const apiKey = config.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) {
          throw new Error('Falta ANTHROPIC_API_KEY en el archivo .env (copiá .env.example como .env).');
        }
        return new ClienteAnthropic(apiKey);
      },
    },
  ],
})
export class AppModule {}
