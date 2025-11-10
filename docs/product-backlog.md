# Product Backlog - MVP Warpath

## Priorización

- **M (Must):** Crítico para MVP
- **S (Should):** Importante pero no bloqueante
- **C (Could):** Nice to have

Estimación orientativa en puntos (Story Points).

---

## Épica A — Rules Engine (M)

### Modelo de datos in-memory (8 pts, M)
- Estructuras de GameState, Player, Territory, Unit, Zone, Hero, Path

### FSM de turno (13 pts, M)
- Validaciones de fase/turno/acciones
- Timers virtuales

### RNG seeded (3 pts, M)
- Seed por match + contador de tiradas

### Resolución de combate (13 pts, M)
- Rango→dado (d4–d100)
- Eficacia
- Reglas de empate
- Límites Defensiva/Amurallada
- Daño≥8 regla de corte

### Economía y costes (5 pts, M)
- Oro por territorio
- Compra/despliegue
- Pérdida de refuerzos al perder territorio

### Caminos y Jefes (13 pts, S)
- Implementar N1–N3
- 8 Jefes con efectos y cooldowns (si aplica)

### Zonas especiales (8 pts, M)
- Trigger inmediato y persistente
- Doble uso (si tienes esa mecánica)

### Bots simples (5 pts, C)
- Heurística: captura zonas → expansión segura → ataque favorable

**Definition of Done:**
- ✅ 95% coverage
- ✅ Determinismo con misma seed
- ✅ Profilers sin memory leaks

---

## Épica B — Backend Autoritativo (M)

### NestJS módulos (5 pts, M)
- Auth, Users, Rooms, Match, Game, Telemetry

### WS Gateway (8 pts, M)
- Namespaces
- Middlewares
- Validación Zod

### Eventos WS (contrato) (13 pts, M)

**C→S:**
- create_room
- join_room
- pick_faction
- pick_hero
- place
- attack
- fortify
- upgrade_path
- end_turn

**S→C:**
- room_update
- game_state
- combat_result
- economy_update
- ability_result
- timer_tick
- game_over
- error

### Timers y reconexión (8 pts, M)
- Token sala
- Pausa si jugador activo cae

### Persistencia (8 pts, M)
- Snapshots por turno
- Replay actions
- Resultados

### Anti-abuso (5 pts, S)
- Rate limit
- Anti-spam
- Verificación de integridad en servidor

### Telemetry (5 pts, S)
- Winrate por raza/jefe/camino
- Duración
- APM

**Definition of Done:**
- ✅ Pruebas integradas (Supertest + ws tests)
- ✅ Latencia <150ms LAN
- ✅ Reconexión <3s

---

## Épica C — Datos y Esquemas (M)

### Prisma Modelos

**User**
- id, handle, createdAt

**Room**
- id, status, createdAt

**Match**
- id, roomId, mapId, seed, startedAt, finishedAt

**MatchPlayer**
- matchId, userId, seat, raceId, heroId, result, gold, actionsUsed

**Territory**
- id, mapId, name, neighbors int[]

**MatchSnapshot**
- id, matchId, turn, stateJson, createdAt

**CatalogRace**
- id, name, passiveCode, configJson

**CatalogHero**
- id, name, effectsJson

**CatalogPath**
- id, name, levelsJson

**CatalogZone**
- id, name, effectsJson

### Semillas de catálogo (M)
- Razas
- Jefes
- Caminos
- Zonas

**Definition of Done:**
- ✅ Migraciones aplicadas
- ✅ Seeds reproducibles

---

## Épica D — Frontend Cliente (M)

### Rutas y layout (5 pts, M)
- Home, Lobby, Sala, Partida, Resultados

### Estado y sincronización (8 pts, M)
- Zustand + React Query + WS client

### Mapa (13 pts, M)
- Render de territorios
- Selección/hover
- Adyacencias
- Numeración de tropas

### Panel de control (8 pts, M)
- Oro
- Acciones
- Caminos
- Jefe/raza
- Temporizador

### Flujos (13 pts, M)
- **Desplegar:** compra y asignación
- **Atacar:** selección origen/destino, preview, confirmación
- **Fortificar**
- **Subir camino**

### Log de combate (5 pts, M)
- Visualización de resultados

### Animación de dados (5 pts, S)
- Feedback visual de tiradas

### UX y accesibilidad (5 pts, S)
- Tooltips
- Atajos
- Feedback de errores

### Tutorial 1-pantalla (3 pts, S)
- Onboarding básico

**Definition of Done:**
- ✅ Partida jugable E2E
- ✅ 0 errores console
- ✅ FPS estable en mapa

---

## Épica E — DevOps, Seguridad y Calidad (M)

### CI/CD (5 pts, M)
- Lint, tests, build, deploy a staging

### Docker (3 pts, M)
- Compose dev (db, redis, api, client)

### Observabilidad (5 pts, S)
- Sentry front/back
- Health endpoints
- Logs JSON

### Pruebas de carga (5 pts, S)
- Artillery/k6 con 100 jugadores concurrentes

### Backups (3 pts, S)
- Snapshots diarios DB

**Definition of Done:**
- ✅ Pipeline verde
- ✅ Rollback sencillo
- ✅ Dashboard básico

