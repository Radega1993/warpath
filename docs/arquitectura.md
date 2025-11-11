# Arquitectura Técnica - Warpath MVP

## Stack Tecnológico

### Frontend
- **Framework:** React + TypeScript + Vite
- **Estado UI:** Zustand (maneja estado + sincronización con WebSocket)
- **Renderizado de mapa:** SVG (migrar a PixiJS si es necesario)
- **Estilos:** Tailwind CSS con sistema de diseño moderno/retro
  - **Tema:** Oscuro futurista con paleta cyan/dorado
  - **Fuentes:** Orbitron (títulos), Rajdhani (cuerpo)
  - **Componentes:** Sistema de paneles, botones e inputs estandarizados
  - **Documentación:** Ver `docs/estilos-ui.md`

### Backend
- **Framework:** NestJS
- **Comunicación en tiempo real:** Socket.IO (WebSocket)
- **API REST:** Auth/Perfil
- **ODM:** Mongoose
- **Base de datos:** MongoDB (puerto 27018)
- **Docker:** Docker Compose para MongoDB
- **Timers:** En memoria (migrar a Redis cuando escale)

### Lógica de Juego
- **Paquete:** rules-engine (TypeScript puro, sin I/O)
- **FSM:** Máquina de estados finitos para turnos
- **Resolución:** Sistema de combates

### Infraestructura
- **Contenedores:** Docker (opcional para desarrollo)
- **CI/CD:** GitHub Actions
- **Hosting:** Render/Fly.io
- **Monitoreo:** Sentry (OpenTelemetry puede añadirse después)
- **Logs:** JSON
- **Feature Flags:** Config JSON

### Testing
- **Unitarios/Integración:** Vitest/Jest (reglas)
- **API REST:** Supertest
- **Carga WebSocket:** Artillery/k6

## Componentes Principales

### Rules Engine
- Paquete independiente de TypeScript puro
- Sin dependencias de I/O
- 100% testeable
- FSM para gestión de turnos
- Resolución determinista de combates

### Backend Autoritativo
- Servidor como única fuente de verdad
- Validación de todas las acciones del cliente
- Persistencia de estado de juego
- Sistema de timers en memoria (migrar a Redis cuando escale)

### Frontend Cliente
- Interfaz reactiva sincronizada con servidor vía WebSocket
- Renderizado de mapa con SVG (migrar a PixiJS si hay problemas de rendimiento)
- Gestión de estado local con Zustand
- Reconexión automática

## Flujo de Datos

1. **Cliente → Servidor:** Acciones del jugador vía WebSocket
2. **Servidor:** Valida y procesa en rules-engine
3. **Servidor → Cliente:** Broadcast de estado actualizado
4. **Cliente:** Actualiza UI según nuevo estado

## Persistencia

- **Base de datos:** MongoDB con Mongoose
  - **Collections:**
    - `rooms`: Salas de juego (Room schema)
    - `matches`: Registro de partidas (Match schema)
    - `matchsnapshots`: Snapshots por turno (MatchSnapshot schema)
    - `users`: Usuarios (User schema)
  - **Conexión:** Configurada en `app.module.ts` con variable de entorno `MONGODB_URI`
  - **Docker:** MongoDB 7.0 en puerto 27018 (docker-compose.yml)
- **Snapshots:** Estado completo al final de cada turno (persistido en MongoDB)
- **Replays:** Lista de acciones + seed para reproducción (preparado)
- **Telemetría:** Métricas de partidas y jugadores (en memoria, listo para persistir)
- **Catálogos:** Razas, Jefes, Caminos, Zonas (configurables en balance.json)

## Decisiones de Simplificación (MVP)

Para mantener el MVP asequible y enfocado, se han tomado las siguientes decisiones:

- **MongoDB vs PostgreSQL:** Se eligió MongoDB con Mongoose por simplicidad y flexibilidad para el MVP. La estructura de documentos se adapta bien a los snapshots de juego y permite iterar rápidamente.
- **Redis:** Postergado inicialmente. Se usa MongoDB + timers en memoria. Migrar a Redis cuando haya >50 salas simultáneas o se necesite pub/sub distribuido.
- **React Query:** No necesario inicialmente. Zustand maneja el estado UI y la sincronización con WebSocket es directa.
- **PixiJS:** Empezar con SVG para simplicidad. Migrar a PixiJS solo si hay problemas de rendimiento con mapas grandes o muchas animaciones.
- **OpenTelemetry:** Solo Sentry inicialmente para monitoreo básico. OpenTelemetry puede añadirse después si se necesita tracing más detallado.

Estas simplificaciones reducen la complejidad inicial y los costos (~$5-15/mes vs ~$20-30/mes), permitiendo un MVP más rápido y económico que puede escalar gradualmente.

