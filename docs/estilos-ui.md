# Guía de Estilos UI - Warpath

Última actualización: 2025-01-27

## Visión General

Warpath utiliza un sistema de diseño moderno/retro con un tema oscuro futurista que combina elementos de juegos retro con una estética moderna. El diseño es consistente en todas las páginas de la aplicación.

## Paleta de Colores

### Colores Principales

```css
/* Fondos */
--bg-dark: #0a0a0f;        /* Fondo principal de la aplicación */
--bg-darker: #050508;       /* Fondos secundarios más oscuros */
--bg-panel: #1a1a2e;        /* Fondos de paneles */
--bg-panel-hover: #16213e;  /* Hover de paneles */

/* Acentos */
--accent: #00d4ff;           /* Cyan principal (títulos, enlaces) */
--accent-dark: #0099cc;     /* Cyan oscuro (hover) */
--accent-gold: #ffd700;     /* Dorado (destacados, victorias) */
--accent-gold-dark: #ffb300; /* Dorado oscuro */

/* Texto */
--text-primary: #ffffff;    /* Texto principal */
--text-secondary: #b0b0b0;   /* Texto secundario */
--text-muted: #707070;      /* Texto deshabilitado */

/* Bordes */
--border: #2a2a3e;          /* Bordes principales */
--border-light: #3a3a4e;   /* Bordes claros */

/* Estados */
--success: #00ff88;         /* Éxito, victoria */
--danger: #ff4444;          /* Error, derrota */
--warning: #ffaa00;         /* Advertencia */
```

## Tipografía

### Fuentes

- **Orbitron**: Títulos, encabezados, botones, elementos destacados
  - Pesos: 400, 600, 700, 900
  - Uso: Títulos principales, botones, labels importantes
  
- **Rajdhani**: Texto del cuerpo, contenido general
  - Pesos: 300, 400, 600, 700
  - Uso: Párrafos, descripciones, información secundaria

### Tamaños y Jerarquía

```css
/* Títulos */
h1: font-['Orbitron'] text-5xl font-bold text-[#00d4ff]
h2: font-['Orbitron'] text-4xl font-bold text-[#00d4ff]
h3: font-['Orbitron'] text-2xl font-bold text-[#00d4ff]

/* Subtítulos */
.subtitle: font-['Orbitron'] text-sm uppercase tracking-wider text-[#00d4ff]

/* Texto del cuerpo */
body: font-['Rajdhani'] text-base text-[#b0b0b0]
```

## Componentes

### Paneles Modernos

```css
.modern-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
```

**Uso**: Contenedores principales, secciones de contenido, cards.

### Botones Modernos

#### Botón Principal
```css
.modern-button {
  font-family: 'Orbitron', sans-serif;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
  border: 2px solid var(--accent);
  color: var(--bg-dark);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  min-height: 40px;
}
```

#### Variantes

- **`.modern-button.active`**: Estado activo (dorado)
- **`.modern-button.secondary`**: Botón secundario (gris oscuro)
- **`.modern-button.success`**: Acción exitosa (verde)
- **`.modern-button.danger`**: Acción destructiva (rojo)
- **`:disabled`**: Estado deshabilitado (opacidad reducida)

**Uso**: Acciones principales, navegación, confirmaciones.

### Inputs Modernos

```css
.modern-input {
  background: var(--bg-darker);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  transition: all 0.2s ease;
}

.modern-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2);
}
```

**Uso**: Formularios, búsquedas, campos de entrada.

### Headers de Panel

```css
.modern-panel-header {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

**Uso**: Títulos de secciones dentro de paneles.

## Layouts

### Página Completa

```tsx
<div className="min-h-screen bg-[#0a0a0f] p-4">
  {/* Contenido */}
</div>
```

### Grid de Dos Columnas

```tsx
<div className="grid md:grid-cols-2 gap-6">
  <div className="modern-panel p-6">
    {/* Columna 1 */}
  </div>
  <div className="modern-panel p-6">
    {/* Columna 2 */}
  </div>
</div>
```

### Panel Centrado

```tsx
<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
  <div className="modern-panel p-8 w-full max-w-md">
    {/* Contenido centrado */}
  </div>
</div>
```

## Estados y Feedback

### Mensajes de Error

```tsx
<div className="bg-[#ff4444]/20 border-2 border-[#ff4444] text-[#ffaaaa] px-4 py-2 rounded-lg">
  Mensaje de error
</div>
```

### Mensajes de Éxito

```tsx
<div className="bg-[#00ff88]/20 border-2 border-[#00ff88] text-[#88ffcc] px-4 py-2 rounded-lg">
  Mensaje de éxito
</div>
```

### Estados de Carga

```tsx
<div className="text-[#00d4ff] font-['Orbitron']">
  Cargando...
</div>
```

## Animaciones

### Slide In

```css
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in {
  animation: slide-in 0.3s ease-out;
}
```

**Uso**: Aparición de paneles, elementos nuevos.

### Pulse Glow

```css
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.8);
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Uso**: Elementos destacados, notificaciones importantes.

## Scrollbar Personalizado

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-darker);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 4px;
  border: 2px solid var(--bg-darker);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-gold);
}
```

## Páginas Específicas

### Home / Login
- Panel centrado con formulario
- Título grande con emoji
- Botones de acción principales

### Lobby
- Grid de dos columnas
- Paneles para crear/unirse a salas
- Formularios con inputs modernos

### Room
- Grid de dos columnas
- Panel de selección de raza
- Lista de jugadores con estados visuales
- Botones de acción contextuales

### Game
- Layout de grid complejo
- Mapa central (70-80% de pantalla)
- Paneles flotantes laterales
- Barra de acciones inferior
- HUD contextual

### Admin
- Panel de administración completo
- Formularios editables anidados
- Secciones organizadas por categorías
- Feedback visual de cambios

### Results
- Panel de resultados centrado
- Clasificación con badges
- Estados visuales (victoria/derrota)
- Botones de navegación

## Mejores Prácticas

1. **Consistencia**: Usar siempre las clases predefinidas (`modern-panel`, `modern-button`, etc.)
2. **Contraste**: Asegurar suficiente contraste entre texto y fondo
3. **Espaciado**: Usar padding y margin consistentes (múltiplos de 4px)
4. **Responsive**: Usar breakpoints de Tailwind (`md:`, `lg:`, etc.)
5. **Accesibilidad**: Mantener estados de hover y focus visibles
6. **Performance**: Evitar animaciones pesadas en elementos que se renderizan frecuentemente

## Variables de Entorno

El sistema de estilos utiliza variables CSS definidas en `apps/client/src/index.css`. Estas variables pueden ser sobrescritas mediante variables de entorno si es necesario para temas personalizados.

## Referencias

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Google Fonts**: Orbitron, Rajdhani
- **Colores**: Basados en paletas de juegos retro/modernos

