# Arquitectura Técnica - Warpath MVP

## Stack Tecnológico

### Frontend
- **Framework:** React + TypeScript + Vite
- **Estado UI:** Zustand (maneja estado + sincronización con WebSocket)
- **Renderizado de mapa:** SVG (migrar a PixiJS si es necesario)
- **Estilos:** Tailwind CSS

### Backend
- **Framework:** NestJS
- **Comunicación en tiempo real:** Socket.IO (WebSocket)
- **API REST:** Auth/Perfil
- **ORM:** Prisma
- **Base de datos:** PostgreSQL
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

- **Snapshots:** Estado completo al final de cada turno
- **Replays:** Lista de acciones + seed para reproducción
- **Telemetría:** Métricas de partidas y jugadores
- **Catálogos:** Razas, Jefes, Caminos, Zonas (configurables)

## Decisiones de Simplificación (MVP)

Para mantener el MVP asequible y enfocado, se han tomado las siguientes decisiones:

- **Redis:** Postergado inicialmente. Se usa PostgreSQL + timers en memoria. Migrar a Redis cuando haya >50 salas simultáneas o se necesite pub/sub distribuido.
- **React Query:** No necesario inicialmente. Zustand maneja el estado UI y la sincronización con WebSocket es directa.
- **PixiJS:** Empezar con SVG para simplicidad. Migrar a PixiJS solo si hay problemas de rendimiento con mapas grandes o muchas animaciones.
- **OpenTelemetry:** Solo Sentry inicialmente para monitoreo básico. OpenTelemetry puede añadirse después si se necesita tracing más detallado.

Estas simplificaciones reducen la complejidad inicial y los costos (~$5-15/mes vs ~$20-30/mes), permitiendo un MVP más rápido y económico que puede escalar gradualmente.

