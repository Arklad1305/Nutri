# Paleta de Colores NutriTracker

## Colores Base

### Oscuros
- `bg-dark-bg` / `#000000` - Fondo principal (negro puro)
- `bg-dark-card` / `#0a0a0a` - Tarjetas y contenedores
- `bg-dark-hover` / `#151515` - Estados hover
- `border-dark-border` / `#1f1f1f` - Bordes

### Blancos
- `text-dark-text` / `#ffffff` - Texto principal (blanco puro)
- `text-neutral-200` / `#e5e5e5` - Texto secundario
- `text-neutral-400` / `#a3a3a3` - Texto deshabilitado

## Colores Principales

### Cyan (Primary)
```css
bg-primary-500  /* #06b6d4 - Cyan principal */
bg-primary-400  /* #22d3ee - Cyan claro */
bg-primary-600  /* #0891b2 - Cyan oscuro */
```

### Electric Blue
```css
bg-electric-500 /* #3b82f6 - Azul eléctrico */
bg-electric-400 /* #60a5fa - Azul claro */
bg-electric-600 /* #2563eb - Azul oscuro */
```

### Neon Green
```css
bg-neon-500     /* #10b981 - Verde neón */
bg-neon-400     /* #34d399 - Verde claro */
bg-neon-600     /* #059669 - Verde oscuro */
```

### Amber (Naranja/Amarillo)
```css
bg-amber-500    /* #f59e0b - Naranja/Amber */
bg-amber-400    /* #fbbf24 - Amber claro */
bg-amber-600    /* #d97706 - Amber oscuro */
```

### Magenta (Rosa)
```css
bg-magenta-500  /* #ec4899 - Magenta */
bg-magenta-400  /* #f472b6 - Magenta claro */
bg-magenta-600  /* #db2777 - Magenta oscuro */
```

## Gradientes Predefinidos

### Background Gradients
```jsx
// Gradiente Cyber (Cyan → Blue → Green)
<div className="bg-gradient-cyber">

// Gradiente Neon (Green → Cyan)
<div className="bg-gradient-neon">

// Gradiente Fire (Amber → Magenta)
<div className="bg-gradient-fire">

// Gradiente Electric (Blue → Cyan)
<div className="bg-gradient-electric">

// Gradiente para tarjetas (sutil)
<div className="bg-gradient-card">
```

### Text Gradients
```jsx
// Texto con gradiente Cyber
<h1 className="text-gradient-cyber">

// Texto con gradiente Neon
<h2 className="text-gradient-neon">

// Texto con gradiente Fire
<h3 className="text-gradient-fire">
```

## Efectos Visuales

### Sombras con Glow
```jsx
// Sombra verde neón
<div className="shadow-neon">

// Sombra azul eléctrica
<div className="shadow-electric">

// Sombra cyan
<div className="shadow-cyan">

// Glow más intenso
<div className="shadow-glow">

// Sombras de tarjeta
<div className="shadow-card">
<div className="shadow-card-hover">
```

### Animaciones
```jsx
// Efecto de glow pulsante
<div className="animate-glow">

// Pulse lento
<div className="animate-pulse-slow">
```

### Bordes con Gradiente
```jsx
// Borde con gradiente multicolor
<div className="gradient-border">
  Contenido
</div>
```

## Ejemplos de Uso

### Tarjeta con gradiente sutil
```jsx
<div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-card hover:shadow-card-hover bg-gradient-card">
  <h3 className="text-gradient-cyber text-xl font-semibold">
    Título
  </h3>
  <p className="text-neutral-400">
    Descripción
  </p>
</div>
```

### Botón con efecto neon
```jsx
<button className="bg-neon-500 hover:bg-neon-600 text-white px-6 py-3 rounded-lg shadow-neon hover:shadow-glow transition-all">
  Guardar
</button>
```

### Botón con gradiente
```jsx
<button className="bg-gradient-electric hover:opacity-90 text-white px-6 py-3 rounded-lg shadow-electric transition-all">
  Enviar
</button>
```

### Badge con color
```jsx
<span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-sm border border-amber-500/20">
  Advertencia
</span>
```

### Input con borde animado
```jsx
<input
  className="bg-dark-card border border-dark-border focus:border-primary-500 focus:shadow-cyan rounded-lg px-4 py-2 text-dark-text"
  placeholder="Escribe algo..."
/>
```

## Variables CSS Disponibles

```css
/* Colores sólidos */
--black: #000000
--white: #ffffff
--primary: #06b6d4
--electric: #3b82f6
--neon: #10b981
--amber: #f59e0b
--magenta: #ec4899

/* Gradientes */
--gradient-cyber: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)
--gradient-neon: linear-gradient(135deg, #10b981 0%, #06b6d4 100%)
--gradient-fire: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)
--gradient-electric: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)
```

## Tips de Diseño

1. **Contraste:** Usa siempre texto blanco (#ffffff) sobre fondos oscuros para máxima legibilidad
2. **Gradientes:** Úsalos con moderación en elementos destacados (CTA, títulos importantes)
3. **Sombras:** Los efectos glow funcionan mejor en modo oscuro
4. **Hover states:** Combina cambios de color con sombras para feedback visual rico
5. **Consistency:** Mantén una paleta de 2-3 colores por vista para evitar sobrecarga visual
