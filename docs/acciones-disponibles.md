# Acciones Disponibles - Estado de Implementación

## ✅ Acciones Implementadas

### 1. **Atacar** ✅
- **Descripción**: Ataque con tropas del Clan a un Territorio adyacente (1 acción/ataque)
- **Estado**: ✅ **IMPLEMENTADO**
- **Archivos**:
  - `apps/server/src/game/game.gateway.ts` - `handleAttack()`
  - `packages/rules-engine/src/fsm.ts` - `attackTerritory()`
- **Evento WebSocket**: `attack`
- **Validaciones**: ✅ Territorio adyacente, tropas suficientes, fase ATTACK

### 2. **Desplegar** ✅
- **Descripción**: Compra tropas (aparece una o múltiples tropas en cualquier territorio del Clan)
- **Estado**: ✅ **IMPLEMENTADO**
- **Archivos**:
  - `apps/server/src/game/game.gateway.ts` - `handlePlace()`
  - `packages/rules-engine/src/fsm.ts` - `deployTroops()`
- **Evento WebSocket**: `place`
- **Validaciones**: ✅ Coste, límites de unidades, fase DEPLOY, territorio propio
- **Bonificaciones**: ✅ Zona de Reclutamiento (1 tropa gratis), Camino Tierra N3

### 3. **Mejorar** ✅
- **Descripción**: Compra mejoras del clan (1 Acción por Mejora del Clan)
- **Estado**: ✅ **IMPLEMENTADO**
- **Archivos**:
  - `apps/server/src/game/game.gateway.ts` - `handleUpgradePath()`
  - `packages/rules-engine/src/fsm.ts` - `upgradePath()`
- **Evento WebSocket**: `upgrade_path`
- **Validaciones**: ✅ Oro suficiente, nivel máximo (3), fase DEPLOY o ATTACK
- **Caminos disponibles**: ✅ Clan, Tesoro, Poder, Suerte, Tierra, Guerra

### 4. **Fortificar** ✅ (Parcial)
- **Descripción**: Mover tropas entre territorios propios
- **Estado**: ✅ **IMPLEMENTADO** (pero diferente de "Mover")
- **Archivos**:
  - `apps/server/src/game/game.gateway.ts` - `handleFortify()`
  - `packages/rules-engine/src/fsm.ts` - `fortify()`
- **Evento WebSocket**: `fortify`
- **Validaciones**: ✅ Territorios propios, tropas suficientes, fase FORTIFY
- **Nota**: Esto es diferente de la acción "Mover" que permite mover TODAS las tropas hasta 4 territorios

---

## ❌ Acciones NO Implementadas

### 5. **Mover** ❌
- **Descripción**: Todas las tropas se mueven hasta **4 territorios** de tu Clan. (1 Acción/Todas las tropas a voluntad del Clan)
- **Estado**: ❌ **NO IMPLEMENTADO**
- **Diferencia con Fortificar**:
  - **Fortificar**: Mover tropas específicas entre 2 territorios (1 acción)
  - **Mover**: Mover TODAS las tropas hasta 4 territorios en una sola acción
- **Requisitos**:
  - Seleccionar hasta 4 territorios destino
  - Distribuir todas las tropas disponibles entre esos territorios
  - Coste: 1 acción total (no por territorio)
- **Archivos a crear/modificar**:
  - `apps/server/src/game/game.gateway.ts` - `handleMove()`
  - `packages/rules-engine/src/fsm.ts` - `moveTroops()`
  - `apps/client/src/components/GamePanel.tsx` - UI para seleccionar múltiples destinos

### 6. **Reforzar** ❌
- **Descripción**: +1 a dados (Eficacia) de defensa (**hasta que el Clan pierda el territorio**). (1 Acción / 1 Territorio del Clan)
- **Estado**: ❌ **NO IMPLEMENTADO**
- **Requisitos**:
  - Aplicar bonificación de eficacia (+1 a dados) al territorio
  - Persistir hasta que el territorio sea conquistado
  - Coste: 1 acción por territorio
- **Archivos a crear/modificar**:
  - `packages/rules-engine/src/types.ts` - Añadir `reinforcedTerritories: string[]` a `TerritoryState` o `Player`
  - `packages/rules-engine/src/fsm.ts` - `reinforceTerritory()`
  - `packages/rules-engine/src/combat.ts` - Aplicar bonificación en `calculateCombatModifiers()`
  - `apps/server/src/game/game.gateway.ts` - `handleReinforce()`
  - `apps/client/src/components/GamePanel.tsx` - Botón "Reforzar"

### 7. **Utilizar** ❌
- **Descripción**: Activa Zonas Especiales (Únicas Zonas Especiales Activables: Zona de Oro y Zona de Reclutamiento)
- **Estado**: ❌ **NO IMPLEMENTADO**
- **Requisitos**:
  - Zona de Oro: Activar para obtener bonificación de oro (¿una vez por turno? ¿por partida?)
  - Zona de Reclutamiento: Ya se aplica automáticamente al desplegar, pero podría necesitar activación explícita
  - Coste: 1 acción por zona
- **Nota**: Actualmente la Zona de Reclutamiento se aplica automáticamente. Necesitamos aclarar si requiere activación explícita.
- **Archivos a crear/modificar**:
  - `packages/rules-engine/src/types.ts` - Añadir `usedZones: string[]` a `Player` o tracking de zonas usadas
  - `packages/rules-engine/src/fsm.ts` - `useZone()`
  - `packages/rules-engine/src/economy.ts` - Aplicar bonificación de Zona de Oro
  - `apps/server/src/game/game.gateway.ts` - `handleUseZone()`
  - `apps/client/src/components/GamePanel.tsx` - Botón "Utilizar Zona"

### 8. **Consolidar** ❌
- **Descripción**: +2 dados (Dos Exploradores aparecen en el Territorio controlado) en la próxima defensa (**hasta que el Clan pierda el territorio**). (1 Acción / 1 Territorio del Clan)
- **Estado**: ❌ **NO IMPLEMENTADO**
- **Requisitos**:
  - Añadir +2 dados (equivalente a 2 exploradores) en la próxima defensa
  - Persistir hasta que el territorio sea conquistado
  - Coste: 1 acción por territorio
- **Archivos a crear/modificar**:
  - `packages/rules-engine/src/types.ts` - Añadir `consolidatedTerritories: string[]` a `TerritoryState` o `Player`
  - `packages/rules-engine/src/fsm.ts` - `consolidateTerritory()`
  - `packages/rules-engine/src/combat.ts` - Aplicar +2 dados en defensa (como 2 exploradores adicionales)
  - `apps/server/src/game/game.gateway.ts` - `handleConsolidate()`
  - `apps/client/src/components/GamePanel.tsx` - Botón "Consolidar"

---

## Resumen

| Acción | Estado | Prioridad |
|--------|--------|-----------|
| Atacar | ✅ Implementado | - |
| Desplegar | ✅ Implementado | - |
| Mejorar | ✅ Implementado | - |
| Fortificar | ✅ Implementado | - |
| **Mover** | ✅ **IMPLEMENTADO** | - |
| **Reforzar** | ✅ **IMPLEMENTADO** | - |
| **Utilizar** | ✅ **IMPLEMENTADO** | - |
| **Consolidar** | ✅ **IMPLEMENTADO** | - |

## ✅ Todas las acciones están implementadas

Todas las acciones disponibles según la documentación han sido implementadas:

1. ✅ **Mover** - `moveTroops()` en FSM, handler `handleMove()` en gateway
2. ✅ **Reforzar** - `reinforceTerritory()` en FSM, handler `handleReinforce()` en gateway
3. ✅ **Utilizar** - `useZone()` en FSM, handler `handleUseZone()` en gateway
4. ✅ **Consolidar** - `consolidateTerritory()` en FSM, handler `handleConsolidate()` en gateway

**Nota**: La UI del cliente aún necesita ser actualizada para exponer estas acciones al usuario. Los métodos están disponibles en `wsService`.

---

## Notas Técnicas

### Sobre "Fortificar" vs "Mover"
- **Fortificar** (implementado): Mover tropas específicas entre 2 territorios (1 acción)
- **Mover** (faltante): Mover TODAS las tropas hasta 4 territorios en una sola acción

### Sobre "Utilizar Zonas"
- Actualmente la Zona de Reclutamiento se aplica automáticamente al desplegar
- La Zona de Oro podría necesitar activación explícita
- Necesitamos aclarar con el diseño si estas zonas requieren activación o son automáticas

### Sobre Bonificaciones Persistentes
- **Reforzar** y **Consolidar** requieren tracking de territorios con bonificaciones activas
- Estas bonificaciones deben persistir hasta que el territorio sea conquistado
- Se deben limpiar cuando el territorio cambia de dueño

