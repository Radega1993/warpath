# Configuración de Administrador

## Crear Usuario Administrador

### Opción 1: Script Directo (Recomendado)

```bash
cd apps/server
npx ts-node src/scripts/create-admin-direct.ts [email] [password] [handle]
```

Ejemplo:
```bash
npx ts-node src/scripts/create-admin-direct.ts admin@warpath.com admin123 Admin
```

Este script crea el usuario directamente en MongoDB sin necesidad de compilar el servidor.

### Opción 2: Desde el Frontend

1. Inicia el servidor: `npm start`
2. Ve a `http://localhost:5173/login`
3. Regístrate con un email y contraseña
4. Luego ejecuta el script para convertir el usuario a admin:

```bash
npx ts-node src/scripts/create-admin-direct.ts tu-email@ejemplo.com tu-password Admin
```

## Acceder al Panel de Administración

1. Inicia sesión en `http://localhost:5173/login` con las credenciales de admin
2. Serás redirigido automáticamente a `/admin`
3. Desde ahí puedes modificar:
   - Economía (ingresos base, bonos)
   - Costos de unidades
   - Límites de unidades
   - Configuración de combate
   - Zonas especiales
   - Caminos de desarrollo

## Cambiar Contraseña

Por seguridad, cambia la contraseña después del primer login. Puedes hacerlo modificando el usuario en MongoDB o creando un nuevo usuario admin.

## Notas

- El token JWT expira en 7 días
- Los cambios en el balance se guardan en `packages/rules-engine/balance.json`
- Se crea un backup automático antes de cada modificación
- Solo usuarios con rol `admin` pueden acceder al panel

