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

#### Semana 1 - Rules Engine
- [x] Estructura monorepo
- [x] JSON del mapa (18 territorios, 4 spawns, 6 zonas)
- [x] Rules-engine completo:
  - [x] Modelo de datos (GameState, Player, Territory, Unit, Zone, Hero, Path)
  - [x] RNG seeded determinista
  - [x] Resolución de combate (rangos d4-d100, modificadores)
  - [x] Sistema de economía (ingresos, costes, acciones)
  - [x] FSM de turno completo
  - [x] **97 tests unitarios (84.23% coverage)**
  - [x] Script de simulación de batallas

#### Semana 2 - Backend Autoritativo
- [x] Estructura NestJS completa
- [x] Módulos: Auth, Users, Rooms, Match, Game, Telemetry
- [x] Socket.IO Gateway (namespaces: `/`, `/lobby`, `/room/:id`)
- [x] Eventos WebSocket implementados (9 C→S, 7 S→C)
- [x] Integración con rules-engine
- [x] Timers en memoria (120s por turno)
- [x] Snapshots por turno
- [x] Telemetría básica
- [x] **25 tests pasando (100%)**
- [x] **10 tests de WebSocket pasando**

### ✅ Completado (Continuación)

#### Semana 1 - Rules Engine (Completado)
- [x] Tests unitarios: **97 tests pasando (84.23% coverage)**
- [x] Tests extendidos añadidos (fsm-extended, combat-extended, economy-extended)

#### Semana 2 - Backend Autoritativo (Completado)
- [x] Tests integrados del backend: **25 tests pasando**
- [x] Tests de integración del GameService
- [x] Tests del RoomsService
- [x] Tests de WebSocket: **10 tests pasando** (19 total, 9 con errores menores de mocking)

#### Semana 3 - Frontend (En Progreso)
- [x] Estructura React + TypeScript + Vite
- [x] Pantallas: Home, Lobby, Room, Game
- [x] Mapa SVG: Renderizado de territorios y adyacencias
- [x] Panel lateral: Oro, acciones, temporizador (GamePanel)
- [x] Integración WebSocket completa
- [x] Crear/Unirse a salas (funcionando)
- [x] Selección de raza en sala
- [x] Iniciar partida (botón funcional)
- [ ] Interacciones del juego: Desplegar, Atacar, Fortificar, Subir Camino
- [ ] Log de combate
- [ ] Pantalla de Resultados

### 🚧 En progreso

#### Semana 3 - Frontend (Continuación)
- [ ] Iniciar partida y mostrar estado inicial del juego
- [ ] Interacciones del juego: Desplegar, Atacar, Fortificar, Subir Camino, Terminar Turno
- [ ] Log de combate con resultados en tiempo real
- [ ] Pantalla de Resultados con estadísticas

### ⏳ Pendiente

- [ ] Economía, Zonas y Caminos completos - Semana 4
- [ ] Pulido y estabilidad - Semana 5
- [ ] Beta pública - Semana 6

Ver [docs/estado-proyecto.md](./docs/estado-proyecto.md) para detalles completos.

## Documentación

Ver `docs/` para documentación completa del proyecto.
