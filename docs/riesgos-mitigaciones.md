# Riesgos y Mitigaciones - MVP Warpath

## Riesgos Identificados

### 🔴 Balance (Alto)

**Riesgo:** Desequilibrio entre razas, jefes o caminos que haga el juego injusto o aburrido.

**Mitigación:**
- Telemetría desde día 1 (winrate por raza/jefe/camino)
- Balance configurable via `balance.json` (feature flags)
- Simulaciones offline con bots para detectar desequilibrios
- Iteración rápida de valores numéricos sin deploy

---

### 🟡 Net/Latencia (Medio)

**Riesgo:** Alta latencia o desconexiones frecuentes arruinan la experiencia.

**Mitigación:**
- Servidor autoritativo (única fuente de verdad)
- Paquetes pequeños y delta state (solo cambios)
- Sistema robusto de reconexión con token de sala
- Pausa automática si jugador activo se desconecta
- Optimización de payloads WebSocket

---

### 🟡 Escalado WS (Medio)

**Riesgo:** WebSocket no escala bien con muchas salas simultáneas.

**Mitigación:**
- Sticky sessions en Render/Fly.io
- Redis pub/sub para sharding de salas
- Arquitectura horizontal (múltiples instancias)
- Pruebas de carga tempranas (50–100 salas)
- Monitoreo de conexiones concurrentes

---

### 🟡 Ambigüedad de Reglas (Medio)

**Riesgo:** Reglas mal definidas causan bugs o inconsistencias.

**Mitigación:**
- GDD versionada y mantenida
- Tests de contrato para reglas críticas
- Rules-engine 100% testeable (determinista)
- Documentación clara de edge cases
- Revisión de reglas antes de implementar

---

### 🟢 Arte/UI (Bajo)

**Riesgo:** Falta de assets o UI pobre afecta la primera impresión.

**Mitigación:**
- Tema minimal y símbolos claros al inicio
- Priorizar funcionalidad sobre estética en MVP
- Usar colores y formas simples pero distintivas
- Iterar UI basado en feedback de beta

---

## Plan de Contingencia

### Si el Balance es Crítico
1. Activar feature flags para deshabilitar razas/jefes problemáticos
2. Ajustar valores en `balance.json` y redeploy rápido
3. Analizar telemetría para identificar patrones
4. Hotfix en <24h si es necesario

### Si hay Problemas de Escalado
1. Reducir límite de salas simultáneas temporalmente
2. Optimizar queries y reducir payloads
3. Escalar horizontalmente (más instancias)
4. Considerar migración a arquitectura diferente si es necesario

### Si hay Bugs Críticos en Producción
1. Rollback inmediato a versión anterior estable
2. Análisis de logs y Sentry
3. Fix y testing en staging
4. Deploy con feature flags para activación gradual

---

## Monitoreo Continuo

### Métricas Clave a Vigilar
- **Error rate:** <1% de acciones fallidas
- **Latencia p95:** <200ms
- **Tasa de desconexión:** <10%
- **Winrate por raza:** entre 40–60% (balance)
- **Duración de partida:** 20–35 min (objetivo)

### Alertas Configuradas
- Error rate >5%
- Latencia p95 >500ms
- Crash rate >1%
- Conexiones concurrentes >80% de capacidad

