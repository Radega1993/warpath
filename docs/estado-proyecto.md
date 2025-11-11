# Estado del Proyecto - Warpath

Última actualización: 2025-01-27

**Nota reciente:** Se ha completado la estandarización de estilos UI en todas las páginas (Home, Login, Lobby, Room, Game, Admin, Results) con un sistema de diseño moderno/retro consistente. Ver `docs/estilos-ui.md` para detalles.

**Nota:** La Semana 3 y Semana 4 están completamente finalizadas. Todos los caminos y zonas están implementados y funcionando. La migración a MongoDB está completada y el código compila correctamente. Los tests han sido actualizados para usar mocks de MongoDB (pendiente resolver configuración de ts-jest para ejecutarlos).

## Resumen Ejecutivo

El proyecto Warpath está en desarrollo activo. Se ha completado la **Semana 1** (Rules Engine), la **Semana 2** (Backend Autoritativo) y la **Semana 3** (Frontend) del roadmap. El frontend está completamente funcional con todas las interacciones del juego implementadas: desplegar tropas, atacar, fortificar, subir caminos, log de combate y pantalla de resultados. Los jugadores pueden crear salas, unirse, seleccionar razas, iniciar partidas y jugar partidas completas end-to-end. El rules-engine está funcional con 97 tests pasando (84.23% coverage) y el backend autoritativo está operativo con 45 tests pasando (100%).

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
- [x] Pantallas: Home, Lobby, Sala (Room), Partida (Game), Resultados (Results)
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
- [x] Interacciones completas: Desplegar, Atacar, Fortificar, Subir Camino
- [x] Log de combate (CombatLog component)
- [x] Pantalla de Resultados (Results page)

#### Semana 4 - Economía, Zonas y Caminos ✅ COMPLETADA
- [x] Implementación completa de Caminos:
  - [x] CLAN (N1-N3): N1→N2, N2→N3, N3→+1 Acción
  - [x] TREASURE (N1-N3): N1→+25 oro/territorio, N2→+125, N3→+300
  - [x] POWER (N1-N3): N1→Élites, N2→Héroes, N3→Leyendas
  - [x] LAND (N1-N3): N1→-10% coste, N2→-15% coste, N3→-20% coste + +1 tropa gratis en Reclutamiento
  - [x] WAR (N1-N3): N1→Eficacia, N2→+1 Acción, N3→Permite hasta 2 jefes simultáneos
  - [x] LUCK (N1-N3): N1→+1 reroll atacante, N2→+1 defensa defensor, N3→+1 boost élites
- [x] Implementación completa de Zonas:
  - [x] ORO: +150 oro por turno
  - [x] BATALLA: Eficacia para defensor
  - [x] AMURALLADA: +2 defensa
  - [x] DEFENSIVA: Límite 10 tropas por bando
  - [x] VELOZ: +1 Acción (aplicado en endTurn)
  - [x] RECLUTAMIENTO: +1 tropa gratis al desplegar (+2 con LAND N3)
- [x] Reglas de nivel de Clan (N1→N2, N2→N3)
- [x] Efecto Nivel 3: +1 al dado atacando (implementado)
- [x] Balance inicial via balance.json (creado)

#### Semana 5 - Pulido y Estabilidad
- [x] **Base de datos MongoDB**: Migración completada
- [x] **Sistema de estilos UI**: Estandarización completada
  - [x] Sistema de diseño moderno/retro implementado
  - [x] Paleta de colores consistente (cyan/dorado)
  - [x] Componentes reutilizables (paneles, botones, inputs)
  - [x] Estilos aplicados en todas las páginas
  - [x] Documentación de estilos creada (`docs/estilos-ui.md`)
- [x] **Reconexión robusta**: Implementada con exponential backoff
- [x] **Rate-limiting**: Implementado para acciones WebSocket
- [x] **Sentry**: Integrado para monitoreo de errores (frontend y backend)
  - [x] Docker Compose con MongoDB (puerto 27018)
  - [x] Esquemas Mongoose (Room, Match, MatchSnapshot, User)
  - [x] Servicios migrados (RoomsService, MatchService)
  - [x] Gateways actualizados (métodos async)
- [x] **Reconexión robusta**: Implementada
  - [x] Reconexión automática con exponential backoff (1s → 5s máximo)
  - [x] Hasta 10 intentos de reconexión por socket
  - [x] Distingue desconexión manual vs error de red
  - [x] Restauración automática del estado del juego al reconectar
  - [x] Componente `ConnectionStatus` con notificaciones visuales
  - [x] Preservación del userId entre reconexiones
  - [x] Manejo independiente por namespace (auth, lobby, game)
- [x] **Rate-limiting de acciones**: Implementado
  - [x] Servicio `RateLimitService` con tracking por userId y tipo de acción
  - [x] Guard `RateLimitGuard` aplicado a todos los handlers WebSocket
  - [x] Límites configurables por acción:
    - Acciones de juego: place (10/5s), attack (5/3s), fortify (8/5s), move (3/5s), etc.
    - Acciones de lobby: create_room (5/min), join_room (10/30s), etc.
    - Límite global: 50 acciones totales por 10 segundos
  - [x] Limpieza automática de entradas expiradas
  - [x] Mensajes de error informativos con tiempo de espera
- [x] **Sentry (front/back)**: Implementado
  - [x] Configuración de Sentry en backend (NestJS)
  - [x] Configuración de Sentry en frontend (React)
  - [x] Captura automática de errores en gateways WebSocket
  - [x] Error Boundary en React para capturar errores de componentes
  - [x] Session Replay para sesiones con errores
  - [x] Performance monitoring (10% en producción, 100% en desarrollo)
  - [x] Helper para captura de errores WebSocket con contexto
  - [x] Documentación de setup en `docs/sentry-setup.md`
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
- **Tests:** 45 pasando (100%) ✅
  - Tests unitarios: 23 pasando
  - Tests de integración: 2 pasando
  - Tests de Gateway: 20 pasando (GameGateway: 13/13 ✅, RoomsGateway: 19/19 ✅)
- **Nota:** Todos los tests fueron corregidos exitosamente. Los mocks fueron actualizados para reflejar correctamente el comportamiento del código de producción.

## Próximos Pasos Inmediatos

### Base de Datos ✅ COMPLETADA
- [x] **Migración a MongoDB**: Completada
  - [x] Docker Compose configurado
  - [x] Esquemas Mongoose implementados
  - [x] Servicios migrados de memoria a MongoDB
  - [x] Tests actualizados para usar mocks de MongoDB
  - [x] Código compila correctamente

### Semana 3 - Frontend ✅ COMPLETADA

1. ✅ **Iniciar partida y mostrar estado inicial** - Completado: Conectar con Game Gateway y mostrar estado del juego
2. ✅ **Interacciones del juego** - Completado:
   - ✅ **Desplegar tropas** - Selector de unidades con costes, desplegar en territorios propios
   - ✅ **Atacar** - Selección de territorio origen/destino, resaltado de adyacencias, selector de unidades
   - ✅ **Fortificar** - Mover tropas entre territorios propios con validación
   - ✅ **Subir Camino** - Botones para mejorar caminos del clan
   - ✅ **Terminar Turno** - Botón para pasar al siguiente jugador
3. ✅ **Log de combate** - Componente CombatLog que muestra resultados de batallas en tiempo real
4. ✅ **Pantalla de Resultados** - Pantalla Results con estadísticas, clasificación y navegación

### Semana 4 - Economía, Zonas y Caminos

**Estado actual:** Implementación parcial completada. Faltan algunos efectos específicos.

1. ✅ **Caminos básicos implementados:**
   - ✅ CLAN (N1-N3): Sistema de niveles funcionando
   - ✅ TREASURE (N1-N3): Bonificaciones de oro implementadas
   - ✅ POWER (N1-N3): Desbloqueo de rangos funcionando
   - ✅ LAND (N1): Reducción de costes implementada
   - ✅ WAR (N1-N2): Eficacia y acciones implementadas
   - ⏳ LUCK (N1-N3): Pendiente (rerolls, defensa, boost élites)
   - ⏳ LAND (N2-N3): Pendiente (doble uso Zonas, +1 tropa gratis)
   - ⏳ WAR (N3): Pendiente (2 Jefes simultáneos)

2. ✅ **Zonas básicas implementadas:**
   - ✅ ORO: +150 oro por turno
   - ✅ BATALLA: Eficacia para defensor
   - ✅ AMURALLADA: +2 defensa
   - ✅ DEFENSIVA: Límite 10 tropas
   - ⏳ VELOZ: +1 Acción (definido, falta aplicar en endTurn)
   - ⏳ RECLUTAMIENTO: Pendiente (+1 tropa gratis al desplegar)

3. ✅ **Nivel de Clan:** Implementado (N1→N2, N2→N3)
   - ⏳ Efecto Nivel 3: +1 al dado atacando (pendiente)

4. ⏳ **Balance inicial via balance.json:** Pendiente

**Tareas completadas de Semana 4:**
- ✅ Implementado Camino LUCK completo (N1-N3): rerolls, defensa extra, boost élites
- ✅ Completado LAND N2-N3: reducción de costes escalada, +1 tropa gratis en Reclutamiento
- ✅ Aplicado efecto Zona VELOZ (+1 Acción) en endTurn
- ✅ Implementado Zona RECLUTAMIENTO (+1 tropa gratis, +2 con LAND N3)
- ✅ Implementado efecto Nivel 3 (+1 al dado atacando)
- ✅ Creado balance.json con valores configurables

**Completado:**
- ✅ WAR N3 (2 Jefes simultáneos): Implementado. Permite tener hasta 2 jefes simultáneamente si el jugador tiene WAR N3, de lo contrario solo 1.

## Notas Técnicas

### Dependencias Circulares
- Resueltas usando `forwardRef()` entre GameModule y RoomsModule

### Timers
- Implementados en memoria (sin Redis por ahora)
- 120 segundos por turno con auto-end

### Persistencia
- **Base de datos**: ✅ MongoDB implementada con Mongoose
  - ✅ Docker Compose configurado (puerto 27018 para evitar conflictos)
  - ✅ Esquemas de Mongoose creados: Room, Match, MatchSnapshot, User
  - ✅ RoomsService migrado a MongoDB (métodos async)
  - ✅ MatchService migrado a MongoDB (métodos async)
  - ✅ Conexión configurada en app.module.ts con `MONGODB_URI`
  - ✅ Todos los gateways actualizados para usar métodos async
  - ✅ Documentación de setup en `docs/mongodb-setup.md`
- **Snapshots**: Persistidos en MongoDB (MatchSnapshot collection)
- **Autenticación**: Guest mode con IDs únicos generados en servidor
- **Migración**: Completada desde memoria a MongoDB
- **Estado**: Código compila correctamente, tests actualizados (pendiente resolver ts-jest para ejecutar)

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
- [Configuración MongoDB](./mongodb-setup.md)

