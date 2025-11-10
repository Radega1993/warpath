# Contratos WebSocket - Warpath

## Cliente → Servidor

### create_room
```typescript
{
  mode: string,
  maxPlayers: number
}
```

### join_room
```typescript
{
  roomId: string,
  handle: string
}
```

### pick_faction
```typescript
{
  raceId: string
}
```

### pick_hero
```typescript
{
  heroId: string
}
```

### place
```typescript
{
  territoryId: string,
  units: {
    d4: number,    // Exploradores
    d6: number,    // Guerreros
    d8: number,    // Élites
    d12: number,   // Héroes
    d20: number,   // Jefe
    d100: number   // Leyendas
  }
}
```

### attack
```typescript
{
  fromId: string,
  toId: string,
  commit: {
    d4: number,
    d6: number,
    d8: number,
    d12: number,
    d20: number,
    d100: number
  }
}
```

### fortify
```typescript
{
  fromId: string,
  toId: string,
  units: {
    d4: number,
    d6: number,
    d8: number,
    d12: number,
    d20: number,
    d100: number
  }
}
```

### upgrade_path
```typescript
{
  pathId: string
}
```

### end_turn
```typescript
{}
```

---

## Servidor → Cliente

### room_update
```typescript
{
  players: Array<{
    userId: string,
    handle: string,
    seat: number,
    raceId?: string,
    heroId?: string
  }>,
  status: 'waiting' | 'picking' | 'ready' | 'in_progress'
}
```

### game_state
```typescript
{
  turn: number,
  phase: 'deploy' | 'attack' | 'fortify' | 'end',
  gold: number,
  actionsLeft: number,
  owners: Record<string, string>, // territoryId -> userId
  troopsByTerritory: Record<string, {
    d4: number,
    d6: number,
    d8: number,
    d12: number,
    d20: number,
    d100: number
  }>,
  paths: Record<string, number>, // pathId -> level (0-3)
  zones: Record<string, string>, // territoryId -> zoneId
  timers: {
    turnSecondsLeft: number
  }
}
```

### combat_result
```typescript
{
  rolls: {
    attacker: Array<{ unit: string, roll: number }>,
    defender: Array<{ unit: string, roll: number }>
  },
  modifiersApplied: {
    attacker: Array<string>,
    defender: Array<string>
  },
  losses: {
    attacker: { d4: number, d6: number, ... },
    defender: { d4: number, d6: number, ... }
  },
  conquest?: boolean // true si el territorio cambió de dueño
}
```

### economy_update
```typescript
{
  goldChange: number,
  reason: string // 'territory_income' | 'zone_bonus' | 'path_bonus' | 'hero_bonus'
}
```

### ability_result
```typescript
{
  abilityId: string,
  effect: any,
  success: boolean
}
```

### timer_tick
```typescript
{
  secondsLeft: number
}
```

### game_over
```typescript
{
  winnerId: string,
  stats: {
    duration: number,
    turns: number,
    players: Array<{
      userId: string,
      finalGold: number,
      territories: number,
      paths: Record<string, number>
    }>
  }
}
```

### error
```typescript
{
  code: string,
  message: string
}
```

