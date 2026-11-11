import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // El simulador de WhatsApp (public/index.html) se sirve en la raíz.
  app.useStaticAssets(join(__dirname, '..', 'public'));
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`Simulador listo en http://localhost:${port}`, 'Agente Luciano');
}
bootstrap();
