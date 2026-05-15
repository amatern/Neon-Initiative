# Enemy Variety — Design Spec

**Date:** 2026-05-15  
**Status:** Approved

## Goal

Normal-wave enemies (non-seal, non-boss) currently all share one shape (hexagon) and one color (`#ff007a`). This spec adds per-enemy random shapes and wave-scoped color palettes so every wave looks visually distinct.

## Decisions

| Question | Decision |
|----------|----------|
| Shape variety | Fully random per enemy (each enemy in a formation gets its own shape) |
| Color variety | Random per enemy, drawn from the wave's 2-color palette |
| Palette scope | Cycles every 5 waves; seal waves unaffected (they bypass `createFormation`) |
| Determinism | Fresh random each session — no seeding |
| Shape pool | 6 shapes: hexagon, triangle, diamond, shield, chevron/arrow, cross |

## Shape Pool

All shapes use the same `(ctx, x, y, size)` signature as `drawHexagon`.

| Name | Description |
|------|-------------|
| `drawHexagon` | Existing default — flat-top regular hexagon |
| `drawTriangle` | Upward-pointing equilateral triangle |
| `drawDiamond` | Tall 4-point diamond/rhombus |
| `drawShield` | Wide-base pentagon (shield crest) |
| `drawArrow` | Downward-pointing chevron |
| `drawCross` | Plus/cross shape |

Collected in a module-private `NORMAL_SHAPES` array.

## Wave Palettes

Defined in `config.js` as `WAVE_PALETTES: Array<[string, string]>`, indexed by `Math.floor((wave - 1) / 5) % WAVE_PALETTES.length`.

```
Index 0 (waves 1–5):   ['#ff007a', '#ff4444']   hot pink / red
Index 1 (waves 6–10):  ['#00cfff', '#00ff88']   cyan / mint
Index 2 (waves 11–15): ['#ffaa00', '#ffd700']   amber / gold
Index 3 (waves 16–20): ['#aa44ff', '#ff44ff']   purple / violet
Index 4 (waves 21+):   ['#00f0ff', '#44ffaa']   electric teal
```

## Data Model Changes

Each enemy object in `base[]` gains two fields when created without `opts.drawEnemy`:

```js
{
  // existing fields...
  draw:  Function | null,   // one of NORMAL_SHAPES, null for seal/boss waves
  color: string   | null,   // from wave palette, null for seal/boss waves
}
```

`null` values fall back to the existing `drawEnemy` / `COL_ENEMY` captured from opts/config, so seal and boss waves are automatically unaffected.

## `createFormation` Changes

**Trigger condition:** `opts.drawEnemy` is absent → randomize. Present → uniform (existing behavior).

**At base array construction:**
```js
const randomize = !opts.drawEnemy;
const palette   = randomize
  ? CONFIG.WAVE_PALETTES[Math.floor((wave - 1) / 5) % CONFIG.WAVE_PALETTES.length]
  : null;

// inside the loop:
draw:  randomize ? NORMAL_SHAPES[Math.floor(Math.random() * NORMAL_SHAPES.length)] : null,
color: randomize ? palette[Math.floor(Math.random() * palette.length)] : null,
```

## Render Loop Changes

**Formation enemies** — `strokeStyle`/`shadowColor`/`fillStyle` move inside the loop, resolved per enemy:

```js
const col    = e.color ?? COL_ENEMY;
const drawFn = e.draw  ?? drawEnemy;
ctx.strokeStyle = col;
ctx.shadowColor = col;
drawFn(ctx, actualX(e), actualY(e), CONFIG.ENEMY_SIZE);
ctx.stroke();
ctx.globalAlpha = e.isDecoy ? 0.06 : 0.12;
ctx.fillStyle   = col;
ctx.fill();
ctx.globalAlpha = 1;
```

`lineWidth` and `shadowBlur` are set once before the loop (unchanged).

**Divers** — same pattern, inheriting from ref:

```js
const col    = d.ref.color ?? COL_DIVER;
const drawFn = d.ref.draw  ?? drawEnemy;
ctx.strokeStyle = col;
ctx.shadowColor = col;
drawFn(ctx, d.x, d.y, CONFIG.ENEMY_SIZE);
```

## Files Changed

| File | Change |
|------|--------|
| `src/config.js` | Add `WAVE_PALETTES` array |
| `src/enemies.js` | Add 5 draw functions + `NORMAL_SHAPES`; randomize in `createFormation`; per-enemy render |

No changes to `game.js`, `hud.js`, `seal-waves.js`, or any other file.

## Out of Scope

- Seal wave enemies (handled by `createSealWave` with explicit opts)
- Boss/Beholder (separate code path)
- "The Jonas" rare enemy (already has custom rendering)
- Per-enemy size variation
- Animated shapes
