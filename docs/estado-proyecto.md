# Estado del Proyecto - Warpath

Última actualización: 2025-11-10 (actualizado)

## Resumen Ejecutivo

El proyecto Warpath está en desarrollo activo. Se ha completado la **Semana 1** (Rules Engine) y la **Semana 2** (Backend Autoritativo) del roadmap. Actualmente estamos en la **Semana 3** (Frontend), con la estructura básica implementada, la integración WebSocket funcionando, y el flujo de lobby/sala completamente operativo. Los jugadores pueden crear salas, unirse, seleccionar razas e iniciar partidas. El rules-engine está funcional con 97 tests pasando (84.23% coverage) y el backend autoritativo está operativo con 25 tests pasando.

## Estado por Componentes

### ✅ Completado

#### Semana 1 - Fundaciones y Rules Engine
- [x] Estructura monorepo creada (apps/client, apps/server, packages/rules-engine, packages/shared)
- [x] JSON del mapa definido (18 territorios, 4 spawns, 6 zonas especiales)
- [x] Rules-engine implementado:
  - [x] Modelo de datos completo (GameState, Player, Territory, Unit, Zone, Hero, Path)
  - [x] RNG seeded determinista
  - [x] Resolución de combate (rangos d4-d100, modificadores, reglas de empate)
  - [x] Sistema de economía (ingresos, costes, acciones)
  - [x] FSM de turno (lobby → deploy → attack → fortify → end_turn)
- [x] Tests unitarios (42 tests pasando, 77.55% coverage)
- [x] Script de simulación de batallas

#### Semana 2 - Backend Autoritativo
- [x] Estructura NestJS completa
- [x] Módulos implementados:
  - [x] Auth (guest mode con IDs únicos)
  - [x] Users (gestión de usuarios)
  - [x] Rooms (crear/join salas, selección raza/jefe)
  - [x] Match (registro de partidas y snapshots)
  - [x] Game (integración con rules-engine)
  - [x] Telemetry (métricas básicas)
- [x] Socket.IO Gateway:
  - [x] Namespace `/lobby` (gestión de salas)
  - [x] Namespace `/room/:id` (partida en curso)
- [x] Eventos WebSocket implementados:
  - [x] Cliente → Servidor: create_room, join_room, pick_faction, pick_hero, place, attack, fortify, upgrade_path, end_turn
  - [x] Servidor → Cliente: room_update, game_state, combat_result, economy_update, timer_tick, game_over, error
- [x] Timers en memoria (120 segundos por turno)
- [x] Snapshots por turno
- [x] Telemetría básica (inicio/fin partida, duración turnos)

### ✅ Completado (Continuación)

#### Tests Integrados
- [x] Tests de integración para flujos completos de partida
- [x] Tests unitarios del backend (25 tests pasando)
- [x] Tests de integración del GameService
- [x] Tests del RoomsService

### 🚧 En Progreso

#### Tests Adicionales
- [ ] Tests de WebSocket (conexión, eventos, desconexión)
- [ ] Tests de reconexión

### 🚧 En Progreso

#### Semana 3 - Frontend
- [x] Estructura React + TypeScript + Vite
- [x] Pantallas: Home, Lobby, Sala (Room), Partida (Game)
- [x] Renderizado de mapa (SVG) con territorios y adyacencias
- [x] Panel de control (GamePanel) con oro, acciones, temporizador
- [x] Integración WebSocket completa
- [x] Autenticación guest + handle (funcionando)
- [x] Crear/Unirse a salas (funcionando)
- [x] Selección de raza en sala
- [x] Iniciar partida (botón funcional)
- [x] Iniciar partida y mostrar estado inicial (funcionando)
- [x] Mapeo correcto de owners (territorios) usando userId
- [x] Identificación del jugador actual por userId
- [ ] Interacciones completas: Desplegar, Atacar, Fortificar, Subir Camino
- [ ] Log de combate
- [ ] Pantalla de Resultados

#### Semana 4 - Economía, Zonas y Caminos
- [ ] Implementación completa de 6 Caminos (N1-N3)
- [ ] Implementación completa de 6 Zonas Especiales
- [ ] Reglas de nivel de Clan
- [ ] Balance inicial via balance.json

#### Semana 5 - Pulido y Estabilidad
- [ ] Reconexión robusta
- [ ] Rate-limiting de acciones
- [ ] Sentry (front/back)
- [ ] Modo Bots
- [ ] Pruebas de carga (50-100 salas simultáneas)

#### Semana 6 - Beta Pública
- [ ] CI/CD a Render/Fly.io
- [ ] Tutorial 1 pantalla
- [ ] Tablero de métricas
- [ ] Términos y feedback form

## Métricas Actuales

### Rules Engine
- **Tests:** 97 pasando (100%)
- **Coverage:** 84.23%
- **Archivos:** 7 módulos principales
- **Líneas de código:** ~1500
- **Archivos de test:** 8 (rng.test.ts, combat.test.ts, combat-extended.test.ts, economy.test.ts, economy-extended.test.ts, fsm.test.ts, fsm-extended.test.ts, simulate.test.ts)

### Backend
- **Módulos:** 6 (Auth, Users, Rooms, Match, Game, Telemetry)
- **Gateways:** 3 (Auth, Rooms, Game)
- **Eventos WebSocket:** 9 C→S, 7 S→C
- **Compilación:** ✅ Sin errores
- **Servidor:** ✅ Inicia correctamente
- **Tests:** 25 pasando (100%)
  - Tests unitarios: 23
  - Tests de integración: 2

## Próximos Pasos Inmediatos

### Semana 3 - Frontend (Continuación)

1. ✅ **Iniciar partida y mostrar estado inicial** - Completado: Conectar con Game Gateway y mostrar estado del juego
2. **Interacciones del juego**:
   - **Desplegar tropas** - Comprar y desplegar tropas en territorios propios
   - **Atacar** - Seleccionar territorio origen/destino y atacar
   - **Fortificar** - Mover tropas entre territorios propios
   - **Subir Camino** - Mejorar caminos del clan
   - **Terminar Turno** - Pasar al siguiente jugador
3. **Log de combate** - Mostrar resultados de batallas en tiempo real con animaciones
4. **Pantalla de Resultados** - Mostrar estadísticas al finalizar partida

### Semana 4 - Economía, Zonas y Caminos

1. **Implementar efectos completos de Caminos** (N1-N3)
2. **Implementar efectos de Zonas Especiales**
3. **Reglas de nivel de Clan y desbloqueo de rangos**
4. **Balance inicial via balance.json**

## Notas Técnicas

### Dependencias Circulares
- Resueltas usando `forwardRef()` entre GameModule y RoomsModule

### Timers
- Implementados en memoria (sin Redis por ahora)
- 120 segundos por turno con auto-end

### Persistencia
- **Base de datos**: No implementada todavía (todo en memoria)
- Snapshots en memoria (sin DB por ahora)
- Listo para migrar a PostgreSQL cuando sea necesario (Semana 4 o 5)
- **Autenticación**: Guest mode con IDs únicos generados en servidor

### Validación
- Zod schemas para validación de DTOs
- Validación en servidor (autoritativo)

## Riesgos Identificados

1. **Balance de juego** - Necesita telemetría y ajustes
2. **Escalado WebSocket** - Actualmente en memoria, necesitará Redis pub/sub para escalar
3. **Reconexión** - Implementación básica, necesita mejoras

## Enlaces Útiles

- [Roadmap completo](./roadmap.md)
- [Arquitectura técnica](./arquitectura.md)
- [Contratos WebSocket](./contratos-ws.md)
- [Product Backlog](./product-backlog.md)

