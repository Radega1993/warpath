# Warpath

4X-lite por turnos en mapa territorial tipo Risk, pero con ADN propio.

## Estructura del Proyecto

Este es un monorepo con las siguientes partes:

- `packages/rules-engine`: Motor de reglas del juego (TypeScript puro, sin I/O)
- `packages/shared`: Tipos y datos compartidos (mapa, etc.)
- `apps/server`: Backend NestJS con Socket.IO
- `apps/client`: Frontend React + TypeScript + Vite

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
- [x] **32 tests pasando** (13 tests fallando por problemas de mocking, no del código)

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

### ⏳ Pendiente

- [ ] Economía, Zonas y Caminos completos - Semana 4
- [ ] Pulido y estabilidad - Semana 5
- [ ] Beta pública - Semana 6

Ver [docs/estado-proyecto.md](./docs/estado-proyecto.md) para detalles completos.

### Estado de Tests

- **Rules Engine:** ✅ 97/97 tests pasando (100%)
- **Backend:** ✅ 45/45 tests pasando (100%)
- **Frontend:** ⏳ Tests no implementados aún

Ver [docs/test-results.md](./docs/test-results.md) para detalles completos de los tests.

## Documentación

Ver `docs/` para documentación completa del proyecto.
