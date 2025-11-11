# Migración de Configuración a Base de Datos

## Resumen

Se ha migrado toda la configuración hardcodeada del juego a MongoDB, permitiendo ajustes dinámicos sin necesidad de redeploy.

## Cambios Realizados

### 1. Esquema de Base de Datos

**`GameConfig` Schema** (`apps/server/src/schemas/game-config.schema.ts`)
- Almacena toda la configuración del juego
- Incluye: economía, zonas, caminos, costos, límites, combate, settings, dados

### 2. Servicio de Configuración

**`ConfigService`** (`apps/server/src/config/config.service.ts`)
- Carga automática desde BD al iniciar
- Migración automática desde `balance.json` si no existe
- Caché para mejor rendimiento
- Endpoint público `/config` para el cliente

### 3. Rules Engine Actualizado

**Cambios en `packages/rules-engine/`:**
- `src/config.ts` - Nueva interfaz `GameConfig` y `DEFAULT_CONFIG`
- `src/economy.ts` - Funciones ahora aceptan `config` como parámetro
- `src/combat.ts` - Usa `config` para dados y umbrales
- `src/fsm.ts` - `GameFSM` ahora acepta y usa `config`
- Todas las funciones mantienen compatibilidad hacia atrás con valores por defecto

### 4. Servidor Actualizado

**`GameService`** ahora:
- Carga configuración desde BD al iniciar partida
- Convierte formato BD a formato `GameConfig`
- Pasa configuración al `GameFSM`

**`TimerService`** ahora:
- Lee `defaultTurnTime` desde BD

**`AdminService`** ahora:
- Lee/escribe desde BD en lugar de solo archivo
- Mantiene sincronización con `balance.json` para compatibilidad

### 5. Cliente Actualizado

**`GamePanel.tsx`** ahora:
- Carga `unitCosts` desde el servidor
- Usa valores dinámicos en lugar de hardcodeados

**Nuevo `config.service.ts`**:
- Servicio para cargar configuración del servidor
- Caché de 5 minutos
- Fallback a valores por defecto si falla

## Valores Migrados

### Desde `balance.json`:
- ✅ `economy.baseIncomePerTerritory`
- ✅ `economy.merchantHeroBonus`
- ✅ `zones.*` (todas las zonas)
- ✅ `paths.*` (todos los caminos)
- ✅ `clanLevels.*`
- ✅ `unitCosts.*`
- ✅ `unitLimits.*`
- ✅ `combat.damageThreshold`
- ✅ `combat.tieRule`

### Desde código hardcodeado:
- ✅ `DEFAULT_TURN_TIME` (120s) → `gameSettings.defaultTurnTime`
- ✅ `UNIT_COSTS` en `types.ts` → `unitCosts` en BD
- ✅ `UNIT_LIMITS` en `types.ts` → `unitLimits` en BD
- ✅ `RANK_DICE` en `types.ts` → `rankDice` en BD
- ✅ Oro inicial (200) → `gameSettings.startingGold`
- ✅ Acciones iniciales (1) → `gameSettings.startingActions`
- ✅ Valores hardcodeados en `economy.ts` (50 oro, 150 zona oro, etc.)
- ✅ Valores hardcodeados en `combat.ts` (damageThreshold = 8)

## Uso

### Para Administradores

1. **Acceder al panel**: `/admin` (requiere login como admin)
2. **Modificar valores**: Todos los valores son editables en tiempo real
3. **Guardar**: Los cambios se aplican inmediatamente
4. **Backup automático**: Se crea backup de `balance.json` antes de cada cambio

### Para Desarrolladores

**Cargar configuración en el servidor:**
```typescript
const config = await configService.getConfig();
const gameConfig = this.convertDbConfigToGameConfig(config);
const fsm = new GameFSM(gameState, gameConfig);
```

**Cargar configuración en el cliente:**
```typescript
const config = await configService.getConfig();
const unitCosts = config.unitCosts;
```

## Migración Automática

Al iniciar el servidor por primera vez:
1. Si no existe configuración en BD, se crea desde `balance.json`
2. Si `balance.json` no existe, se usan valores por defecto
3. La configuración se carga en caché para mejor rendimiento

## Compatibilidad

- ✅ **Backward compatible**: Si no se proporciona `config`, se usan valores por defecto
- ✅ **balance.json sincronizado**: Se actualiza automáticamente cuando cambias en BD
- ✅ **Sin breaking changes**: El código existente sigue funcionando

## Endpoints

- `GET /config` - Obtener configuración pública (sin auth)
- `GET /admin/balance` - Obtener balance completo (admin)
- `PUT /admin/balance` - Actualizar balance completo (admin)
- `PUT /admin/balance/:section` - Actualizar sección específica (admin)

## Próximos Pasos

1. ✅ Configuración en BD
2. ✅ Rules-engine usando BD
3. ✅ Panel de admin completo
4. ⏳ Tests actualizados para usar config
5. ⏳ Documentación de todos los valores configurables

