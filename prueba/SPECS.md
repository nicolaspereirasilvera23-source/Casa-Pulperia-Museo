# 🥊 Fighting Game Prototype — Especificaciones Técnicas

## Visión General
Prototipo demo de un juego de pelea 2D estilo arcade (1v1 local), construido con HTML5 Canvas, CSS y JavaScript vanilla. El objetivo es validar las mecánicas base de un juego de pelea: movimiento, ataques con distintas propiedades, sistema de hitboxes, barras de vida/super, y game feel.

---

## Controles

### Jugador 1 (Izquierda)
| Acción          | Tecla |
|-----------------|-------|
| Mover Izquierda | A     |
| Mover Derecha   | D     |
| Saltar          | W     |
| Agacharse       | S     |
| Ataque Ligero   | J     |
| Ataque Medio    | K     |
| Ataque Fuerte   | L     |
| Block           | H     |
| Super           | U     |

### Jugador 2 (Derecha)
| Acción          | Tecla     |
|-----------------|-----------|
| Mover Izquierda | ArrowLeft |
| Mover Derecha   | ArrowRight|
| Saltar          | ArrowUp   |
| Agacharse       | ArrowDown |
| Ataque Ligero   | Numpad1   |
| Ataque Medio    | Numpad2   |
| Ataque Fuerte   | Numpad3   |
| Block           | Numpad8   |
| Super           | Numpad0   |

---

## Mecánicas Core

### 1. Movimiento
- **Velocidad base**: 5 px/frame
- **Salto**: Velocidad vertical inicial de -12, gravedad 0.6
- **Agacharse**: Reduce hitbox vertical, no se puede mover lateralmente
- **Límites de pantalla**: Los jugadores no pueden salir del canvas
- **Auto-flip**: Los sprites se voltean según la posición relativa del oponente

### 2. Sistema de Ataques
| Tipo    | Tecla | Daño | Startup (frames) | Active (frames) | Recovery (frames) | Alcance |
|---------|-------|------|-------------------|------------------|--------------------|---------|
| Ligero  | J     | 5    | 3                 | 3                | 5                  | 60px    |
| Medio   | K     | 10   | 5                 | 4                | 8                  | 75px    |
| Fuerte  | L     | 18   | 8                 | 5                | 14                 | 90px    |
| Super   | U     | 35   | 12                | 8                | 20                 | 120px   |

### 3. Sistema de Vida
- **HP máximo**: 100 por jugador
- **Barra de vida**: Parte superior de la pantalla
- **Indicador de daño**: Flash rojo + knockback proporcional

### 4. Barra de Super
- Se llena al golpear (+8/12/15%) y al recibir daño (+5% del daño)
- Máximo: 100%, se vacía al usar Super

### 5. Hit Stun
- Ligero: 8 frames | Medio: 12 | Fuerte: 18 | Super: 25

### 6. Block (Guardia)
- **Tecla**: H (P1) / Numpad8 (P2)
- Mientras se mantiene la tecla, el personaje **caminará hacia atrás** (dirección opuesta al rival) a 60% de la velocidad base, manteniéndose de frente.
- **Daño chip**: los golpes bloqueados solo hacen 20% del daño original.
- Sin knockback ni hit stun; se aplica un *block stun* de 12 frames.
- El atacante gana el mismo super meter al golpear un bloqueo.
- Los ataques pueden cancelar el block; saltar también lo rompe.

### 7. Super — Animación de Láser
- Al activarse, el Super dibuja un **rayo láser** que se extiende desde el personaje a lo largo de la pantalla.
- Startup: el láser se carga y crece desde el cañón.
- Active: haz completo con núcleo blanco, capas de brillo rojo pulsante, destello en la boca del cañón y chispas (muzzle sparks).
- Recovery: el haz se desvanece progresivamente.
- El hitbox de combate se mantiene según SPECS (rango 120px); el láser es puramente visual.

---

## Arquitectura
```
prueba/
├── SPECS.md
├── index.html
├── styles.css
└── game.js
```

## Visual Style
- **Tema**: Cyberpunk/Neon
- **Paleta**: Fondo oscuro, P1 cyan/azul, P2 magenta/rojo
- **Efectos**: Glow, partículas, screen shake
