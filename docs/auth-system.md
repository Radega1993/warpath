# Sistema de Autenticación - Warpath

## Resumen

Se ha implementado un sistema completo de autenticación que permite:
- **Modo Invitado (Guest)**: Los jugadores pueden jugar sin registrarse (como antes)
- **Usuarios Registrados**: Los jugadores pueden crear cuenta y guardar su progreso
- **Rol Administrador**: Para modificar valores de balance del juego

## Características

### 1. Autenticación JWT
- Tokens JWT con expiración de 7 días
- Passport.js para validación de tokens
- Guards para proteger rutas

### 2. Roles de Usuario
- **GUEST**: Usuario invitado (sin registro)
- **USER**: Usuario registrado
- **ADMIN**: Administrador (puede modificar balance)

### 3. Endpoints REST

#### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener perfil del usuario autenticado

#### Usuario
- `GET /users/me/history` - Historial de partidas del usuario
- `GET /users/me/stats` - Estadísticas del usuario

#### Administración (requiere rol ADMIN)
- `GET /admin/balance` - Obtener balance actual
- `PUT /admin/balance` - Actualizar balance completo
- `PUT /admin/balance/:section` - Actualizar sección específica del balance

## Uso

### Crear Usuario Administrador

```bash
cd apps/server
npx ts-node src/scripts/create-admin.ts [email] [password] [handle]
```

Ejemplo:
```bash
npx ts-node src/scripts/create-admin.ts admin@warpath.com admin123 Admin
```

### Registrar Usuario Normal

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "handle": "MyHandle"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Respuesta:
```json
{
  "user": {
    "userId": "...",
    "email": "user@example.com",
    "handle": "MyHandle",
    "role": "user",
    "isGuest": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usar Token en Requests

```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Modificar Balance (Admin)

```bash
curl -X PUT http://localhost:3001/admin/balance \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @balance.json
```

## Esquemas de Base de Datos

### User Schema
```typescript
{
  userId: string (único)
  handle: string
  email?: string (único, solo para usuarios registrados)
  passwordHash?: string (solo para usuarios registrados)
  role: 'guest' | 'user' | 'admin'
  isGuest: boolean
  gamesPlayed: number
  gamesWon: number
  totalGoldEarned: number
  totalTerritoriesConquered: number
  lastSeen?: Date
}
```

### Match Schema (actualizado)
```typescript
{
  id: string
  roomId: string
  seed: number
  startedAt: Date
  finishedAt?: Date
  winnerId?: string
  turns: number
  players?: Array<{
    userId: string
    playerId: string
    raceId?: string
    heroId?: string
    finalGold: number
    territories: number
    won: boolean
  }>
}
```

## Modo Invitado

El modo invitado sigue funcionando como antes:
- Se genera un `userId` único automáticamente
- Se crea un usuario `GUEST` en la BD
- No requiere autenticación
- Las partidas se guardan pero no se vinculan a un usuario permanente

## Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- JWT tokens con expiración
- Validación de roles en endpoints de administración
- Guards para proteger rutas sensibles

## Variables de Entorno

Añadir al `.env`:
```
JWT_SECRET=tu-secret-key-super-segura-aqui
```

**IMPORTANTE**: Cambiar el JWT_SECRET en producción.

