# Warpath

4X-lite por turnos en mapa territorial tipo Risk, pero con ADN propio.

## Estructura del Proyecto

Este es un monorepo con las siguientes partes:

- `packages/rules-engine`: Motor de reglas del juego (TypeScript puro, sin I/O)
- `packages/shared`: Tipos y datos compartidos (mapa, etc.)
- `apps/server`: Backend NestJS con Socket.IO
- `apps/client`: Frontend React + TypeScript + Vite con sistema de diseño moderno/retro

## Documentación

La documentación completa del proyecto está en el directorio `docs/`:

- **Arquitectura**: `docs/arquitectura.md` - Stack tecnológico y decisiones de diseño
- **Estado del Proyecto**: `docs/estado-proyecto.md` - Estado actual y progreso
- **Estilos UI**: `docs/estilos-ui.md` - Guía completa del sistema de diseño
- **Roadmap**: `docs/roadmap.md` - Plan de desarrollo
- **Contratos WebSocket**: `docs/contratos-ws.md` - Especificación de eventos
- **Setup MongoDB**: `docs/mongodb-setup.md` - Configuración de base de datos
- **Sentry**: `docs/sentry-setup.md` - Configuración de monitoreo

## Instalación

### Requisitos

- Node.js 18+ o superior
- npm (incluido con Node.js)

### Instalación de dependencias

```bash
npm install
```

## Desarrollo

### Compilar packages

```bash
npm run build
```

### Ejecutar servidores

#### Backend (NestJS + Socket.IO)

```bash
cd apps/server
npm start
```

El servidor se iniciará en `http://localhost:3001` con:
- REST API en el puerto 3001
- WebSocket namespaces:
  - `/` - Auth Gateway
  - `/lobby` - Rooms Gateway
  - `/room/:id` - Game Gateway

**Nota:** Asegúrate de que MongoDB esté corriendo antes de iniciar el servidor:
```bash
docker compose up -d mongodb
```

#### Frontend (React + Vite)

```bash
cd apps/client
npm run dev
```

El frontend se iniciará en `http://localhost:3000` con hot reload activado.

#### Ejecutar ambos en paralelo

En dos terminales separadas:

**Terminal 1 - Backend:**
```bash
cd apps/server && npm start
```

**Terminal 2 - Frontend:**
```bash
cd apps/client && npm run dev
```

### Ejecutar tests

```bash
# Todos los tests
npm test

# Tests del rules-engine específicamente
npm test --workspace=@warpath/rules-engine

# Tests con coverage
npm run test:coverage
```

### Simular batallas

```bash
# Ejecutar script de simulación
npm run test:simulate --workspace=@warpath/rules-engine
```

## Estado del Proyecto

### ✅ Completado

#### Semana 1 - Rules Engine ✅
- [x] Estructura monorepo
- [x] JSON del mapa (18 territorios, 4 spawns, 6 zonas)
- [x] Rules-engine completo:
  - [x] Modelo de datos (GameState, Player, Territory, Unit, Zone, Hero, Path)
  - [x] RNG seeded determinista
  - [x] Resolución de combate (rangos d4-d100, modificadores)
  - [x] Sistema de economía (ingresos, costes, acciones)
  - [x] FSM de turno completo
  - [x] **97 tests unitarios pasando (84.23% coverage)**

#### Semana 2 - Backend Autoritativo ✅
- [x] Estructura NestJS completa
- [x] Módulos: Auth, Users, Rooms, Match, Game, Telemetry
- [x] Socket.IO Gateway (namespaces: `/`, `/lobby`, `/room/:id`)
- [x] Eventos WebSocket implementados (9 C→S, 7 S→C)
- [x] Integración con rules-engine
- [x] Timers en memoria (120s por turno)
- [x] Snapshots por turno
- [x] Telemetría básica
- [x] **Base de datos MongoDB** con Mongoose
- [x] **45 tests actualizados para MongoDB** (pendiente ejecutar)

#### Semana 3 - Frontend ✅
- [x] Estructura React + TypeScript + Vite
- [x] Pantallas: Home, Lobby, Room, Game, Results
- [x] Mapa SVG interactivo con resaltado de adyacencias
- [x] Panel de control completo (GamePanel)
- [x] Integración WebSocket completa
- [x] **Todas las interacciones del juego implementadas:**
  - [x] Desplegar tropas
  - [x] Atacar
  - [x] Fortificar
  - [x] Subir Camino
  - [x] Terminar Turno
- [x] Log de combate (CombatLog)
- [x] Pantalla de Resultados

#### Semana 4 - Economía, Zonas y Caminos ✅
- [x] Todos los caminos implementados (CLAN, TREASURE, POWER, LAND, WAR, LUCK)
- [x] Todas las zonas implementadas (ORO, BATALLA, AMURALLADA, DEFENSIVA, VELOZ, RECLUTAMIENTO)
- [x] Nivel de Clan y efectos
- [x] Balance.json creado

#### Semana 5 - Pulido y Estabilidad ⏳
- [x] Base de datos MongoDB migrada
- [x] Reconexión robusta (reconexión automática, restauración de estado, notificaciones)
- [x] Rate-limiting (protección contra spam, límites por acción)
- [x] Sentry (monitoreo de errores front/back, Session Replay, Performance)
- [ ] Modo Bots
- [ ] Pruebas de carga

### ⏳ Pendiente

- [ ] Pulido y estabilidad - Semana 5 (en progreso)
- [ ] Beta pública - Semana 6

Ver [docs/estado-proyecto.md](./docs/estado-proyecto.md) para detalles completos.

### Estado de Tests

- **Rules Engine:** ✅ 97/97 tests pasando (100%)
- **Backend:** ✅ 45/45 tests actualizados para MongoDB (pendiente ejecutar)
- **Frontend:** ⏳ Tests no implementados aún

### Base de Datos

- **MongoDB:** ✅ Integrada con Mongoose
- **Docker Compose:** ✅ Configurado (puerto 27018)
- **Esquemas:** Room, Match, MatchSnapshot, User
- Ver [docs/mongodb-setup.md](./docs/mongodb-setup.md) para más detalles

Ver [docs/test-results.md](./docs/test-results.md) para detalles completos de los tests.

## Documentación

Ver `docs/` para documentación completa del proyecto.
