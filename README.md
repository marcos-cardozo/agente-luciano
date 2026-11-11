# Agente Luciano: prototipo

Agente de IA que contesta los mensajes de los clientes de Luciano (herramientas eléctricas). Responde precios y stock consultando el catálogo, contesta las preguntas frecuentes y, cuando alguien quiere comprar, **le avisa a Luciano para que él cierre la venta**.

Esta versión es un **simulador**: chateás en una página que imita WhatsApp. Cuando el agente funcione bien, conectamos WhatsApp de verdad.

## Cómo correrlo

Necesitás **Node 22.12 o más nuevo** y **Docker** (para Postgres).

```bash
npm install
cp .env.example .env        # y pegá tu ANTHROPIC_API_KEY
docker compose up -d        # levanta Postgres
npm run start:dev
```

Abrí **http://localhost:3000** y escribile como si fueras un cliente. Las primeras veces, usá los botones de sugerencias.

La API key se saca en https://console.anthropic.com (API Keys). Con Haiku, cada mensaje cuesta una fracción de centavo de dólar.

### Tests (no gastan API)

```bash
npm test
```

Usan un "Claude falso" con respuestas guionadas y la base real. Prueban que el agente consulte el catálogo, que avise a Luciano, que recuerde la conversación y que no se rompa si falla el modelo.

## Cómo funciona por dentro

```
Cliente escribe ──► ChatController (/api/chat)
                       │
                       ▼
                 AgenteService.responder()
                   1. guarda el mensaje en Postgres
                   2. arma el historial de la conversación
                   3. BUCLE DEL AGENTE:
                      ┌─► manda todo a Claude (prompt + historial + herramientas)
                      │      │
                      │      ├─ Claude pide una herramienta (stop_reason = "tool_use")
                      │      │     → la ejecutamos (buscar en el catálogo / avisar a Luciano)
                      └──────┘     → le devolvemos el resultado y vuelve a pensar
                             │
                             └─ Claude responde texto (stop_reason = "end_turn") → fin
                   4. guarda la respuesta y la devuelve
```

**La idea clave:** Claude no tiene acceso a tu base. Solo puede *pedir* que ejecutes una herramienta. Vos decidís qué herramientas existen y qué hacen. Eso es un agente: un modelo que razona + herramientas + un bucle.

| Archivo | Qué hace |
|---|---|
| `src/agente/prompt.ts` | Las instrucciones del agente: cómo habla, qué puede y qué no puede hacer. **Lo vas a ajustar mucho.** |
| `src/agente/herramientas.ts` | La definición de las herramientas que Claude puede pedir. |
| `src/agente/agente.service.ts` | El bucle del agente y la ejecución de las herramientas. |
| `src/negocio/negocio.ts` | Datos del negocio (horarios, envíos, pagos…). **Completar con Luciano.** |
| `src/catalogo/` | Productos en Postgres y la búsqueda. Arranca con un catálogo de ejemplo. |
| `src/conversaciones/` | Historial de mensajes por cliente (la "memoria" del agente). |
| `src/ventas/` | Avisos de venta para Luciano. |
| `public/index.html` | El simulador de WhatsApp y el panel de avisos. |

## Pendientes

- [ ] Completar `src/negocio/negocio.ts` con los datos reales de Luciano.
- [ ] Cargar el catálogo real (hoy son 7 productos de ejemplo en `src/catalogo/productos-ejemplo.ts`).
- [ ] Probar con las 20-30 preguntas que más le llegan a Luciano y ajustar el prompt.
- [ ] Conectar WhatsApp (API oficial de Meta): un webhook que llame a `AgenteService.responder()`.
- [ ] Que el aviso de venta le llegue a Luciano por WhatsApp, no solo al panel.
- [ ] Antes de producción: migraciones en vez de `synchronize: true`.
