# Roadmap - MVP Warpath

## Objetivo General

Lanzar en producción un MVP jugable online (web-first) con partidas de 2–4 jugadores, 1 mapa, 6–8 razas con pasiva, 6 Caminos, 8 Jefes, Zonas Especiales, economía de oro, rangos de tropa (d4…d100), servidor autoritativo y telemetría básica.

## Roadmap por Semanas (6 semanas)

### Semana 1 — Fundaciones y "rules-engine"

**Objetivo:** Tener simulador de reglas 100% testeable y DB inicial.

**Tareas principales:**
- Definir GDD técnico y contratos WS/REST
- **rules-engine:**
  - Entidades: Clan, Raza, Jefe, Camino, Territorio, Tropa, Combate, Zona
  - FSM: lobby → deploy → attack → fortify? → end_turn → deploy…
  - RNG seeded y resolución de combate con rangos y modificadores básicos
- **DB & Prisma:** esquemas iniciales
- **NestJS esqueleto:** módulos Auth, Matchmaking, Rooms, Game, Telemetry
- **Mapa:** JSON (territorios + adyacencias + zonas)

**Entregables:**
- ✅ 100+ tests unitarios en rules-engine
- ✅ Script para simular 1k batallas y volcar métricas
- ✅ ERD y migraciones DB aplicadas

---

### Semana 2 — Backend autoritativo (WS) + Lobby

**Objetivo:** Crear/join salas, arranque de partida, turnos y timers.

**Tareas principales:**
- Socket.IO Gateway (namespaces lobby, room:{id})
- **Lobby:** create_room, join_room, leave_room, start_match
- Selección de Raza y Jefe (con validación)
- Timer por turno en servidor (Redis para cron resiliente)
- Snapshots al final de turno (persistencia mínima)
- Reconexión con token

**Entregables:**
- ✅ Partida en memoria de 2–4 jugadores recorre fases sin UI (pruebas integradas)
- ✅ Telemetría server básica (inicio/fin partida, duración turno)

---

### Semana 3 — Frontend mapa + flujo de turno

**Objetivo:** Interfaz jugable mínima.

**Tareas principales:**
- **Pantallas:** Home, Lobby, Sala, Partida, Resultados
- **Render mapa (SVG/Pixi):** color por propietario, número de tropas, highlight de adyacencia
- **Panel lateral:** oro, acciones, camino/raza/jefe, temporizador, log de combate
- **Interacciones:** Desplegar, Atacar, Fortificar, Subir Camino
- Log de combate y toast de errores del servidor
- Autenticación "guest" + handle

**Entregables:**
- ✅ Partida jugable end-to-end entre 2 navegadores locales

---

### Semana 4 — Economía, Zonas y Caminos

**Objetivo:** Profundidad estratégica inicial.

**Tareas principales:**
- **Economía:** +50 oro/territorio por turno + Zonas Especiales
- Implementar 6 Caminos con efectos de N1–N3
- **Zonas:** Oro, Veloz, Batalla, Amurallada, Defensiva, Reclutamiento (según reglas)
- Reglas de nivel de Clan y gates de rangos (Élite/Héroe/Leyenda)
- Balance inicial via balance.json (feature flags)

**Entregables:**
- ✅ Métricas por camino/raza/jefe (winrate, oro/turno, duración)
- ✅ Pruebas de simulación con bots simples

---

### Semana 5 — Pulido, estabilidad y anti-trampas

**Objetivo:** Robustez de red y UX.

**Tareas principales:**
- Reconexión robusta, rate-limiting de acciones, validaciones extra
- Sentry (front/back), tracing básico (OpenTelemetry)
- Modo Bots para rellenar huecos en salas
- Persistir repeticiones (lista de acciones + seed) para debug
- Pruebas de carga: 50–100 salas simultáneas

**Entregables:**
- ✅ Informe de rendimiento y errores críticos resueltos

---

### Semana 6 — Beta pública y despliegue

**Objetivo:** Demo pública con SSL y telemetría.

**Tareas principales:**
- CI/CD a Render/Fly.io (sticky sessions)
- Términos simples y form de feedback
- Tutorial 1 pantalla (tooltips)
- Tablero de métricas: concurrencia, error rate, duración media, abandono

**Entregables:**
- ✅ URL pública con password/clave de acceso (si deseas)

