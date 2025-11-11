# Criterios de Aceptación - MVP Warpath

## Criterios Funcionales

### ✅ Crear y Unir Sala
- Crear sala con modo y número máximo de jugadores
- Unir 2–4 jugadores a una sala
- Iniciar partida cuando todos estén listos
- Completar partida sin errores críticos

### ✅ Flujo de Turno Completo
- Sistema de acciones por turno funcional
- Economía: cobro de oro por territorio y bonificaciones
- Compra y despliegue de tropas
- Ataque entre territorios adyacentes
- Fortificación de territorios
- Subida de nivel de Caminos

### ✅ Zonas y Caminos (Completado)
- ✅ Zonas implementadas: ORO, BATALLA, AMURALLADA, DEFENSIVA, VELOZ, RECLUTAMIENTO
- ✅ Caminos completos operativos: CLAN (N1-N3), TREASURE (N1-N3), POWER (N1-N3), LAND (N1-N3), WAR (N1-N3), LUCK (N1-N3)
- ✅ Efectos implementados se aplican correctamente
- ✅ Efecto Nivel 3 (+1 al dado atacando) implementado
- ✅ WAR N3 (hasta 2 jefes simultáneos) implementado

### ✅ Razas y Jefes
- Al menos 6 razas operativas con pasivas
- 8 Jefes operativos con bonos/perks
- Pasivas y bonos se aplican correctamente

### ✅ Telemetría
- Winrate por raza
- Winrate por jefe
- Duración media de partida
- Ratio de abandono

### ✅ Reconexión
- Reconexión durante tu turno
- Reconexión fuera de tu turno
- Estado de partida se restaura correctamente

### ✅ Pruebas de Carga
- 50 salas simultáneas en staging sin timeouts

---

## KPIs de Éxito (Beta)

### Día 1
- ≥20 partidas completas sin crash (internas/equipo)

### Estabilidad
- **Crash-free sessions:** ≥99%
- **Duración media:** 20–35 min (MVP)
- **Churn por desconexión:** <10%
- **Bug blocker:** 0 en producción

---

## Métricas de Rendimiento

### Latencia
- Latencia <150ms en LAN
- Reconexión <3s

### Rendimiento Frontend
- FPS estable en mapa (≥30 FPS)
- 0 errores en consola
- Carga inicial <3s

### Rendimiento Backend
- Procesamiento de acciones <100ms
- Broadcast de estado <50ms
- Sin memory leaks en sesiones largas

---

## Calidad de Código

### Testing
- 95% coverage en rules-engine
- Tests integrados para flujos críticos
- Tests de carga con Artillery/k6

### Determinismo
- Misma seed produce mismos resultados
- Replays reproducibles

### Observabilidad
- Logs estructurados (JSON)
- Sentry configurado (front/back)
- Health endpoints operativos
- Dashboard básico de métricas

