# Configuración de MongoDB

## Estado

✅ **MongoDB integrado y funcionando**

La base de datos MongoDB ha sido completamente integrada en el proyecto usando Mongoose. Todos los servicios han sido migrados de memoria a MongoDB.

## Iniciar MongoDB con Docker Compose

Para iniciar MongoDB, ejecuta:

```bash
# Con docker-compose (versión antigua)
docker-compose up -d mongodb

# O con docker compose (versión nueva)
docker compose up -d mongodb
```

Esto iniciará MongoDB en el puerto **27018** (para evitar conflictos con otras instancias de MongoDB).

## Conexión

La cadena de conexión por defecto es:
```
mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin
```

Puedes configurarla mediante la variable de entorno `MONGODB_URI` en un archivo `.env`:

```env
MONGODB_URI=mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin
```

## Credenciales

- **Usuario:** warpath
- **Contraseña:** warpath123
- **Base de datos:** warpath
- **Puerto:** 27018

## Verificar que MongoDB está corriendo

```bash
# Ver logs del contenedor
docker compose logs mongodb

# Verificar estado
docker compose ps

# Conectar con MongoDB CLI (opcional)
docker compose exec mongodb mongosh -u warpath -p warpath123 --authenticationDatabase admin
```

## Detener MongoDB

```bash
docker compose down
```

Para detener y eliminar los volúmenes (elimina todos los datos):

```bash
docker compose down -v
```

## Esquemas Implementados

### Room (rooms collection)
- `id`: String único
- `mode`: String (tipo de partida)
- `maxPlayers`: Number
- `status`: Enum (WAITING, PICKING, READY, IN_PROGRESS)
- `players`: Array de RoomPlayer (userId, handle, seat, raceId, heroId, ready)
- `creatorId`: String (userId del creador)
- `startedAt`: Date opcional
- `createdAt`, `updatedAt`: Timestamps automáticos

### Match (matches collection)
- `id`: String único
- `roomId`: String
- `seed`: Number
- `startedAt`: Date
- `finishedAt`: Date opcional
- `winnerId`: String opcional
- `turns`: Number
- `createdAt`, `updatedAt`: Timestamps automáticos

### MatchSnapshot (matchsnapshots collection)
- `id`: String único
- `matchId`: String (índice)
- `turn`: Number
- `stateJson`: String (JSON serializado del GameState)
- `createdAt`, `updatedAt`: Timestamps automáticos

### User (users collection)
- `userId`: String único
- `handle`: String
- `gamesPlayed`: Number (default: 0)
- `gamesWon`: Number (default: 0)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Servicios Migrados

- ✅ **RoomsService**: Todos los métodos migrados a async/await con MongoDB
- ✅ **MatchService**: Todos los métodos migrados a async/await con MongoDB
- ✅ **GameService**: Actualizado para usar RoomsService async
- ✅ **Gateways**: Todos los métodos actualizados para async/await

## Configuración

La conexión se configura en `apps/server/src/app.module.ts`:

```typescript
MongooseModule.forRoot(
    process.env.MONGODB_URI || 'mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin',
    {
        retryWrites: true,
        w: 'majority',
    }
)
```

Variable de entorno recomendada en `.env`:
```
MONGODB_URI=mongodb://warpath:warpath123@localhost:27018/warpath?authSource=admin
```

