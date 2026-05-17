# Formation Patterns + Entry Animation — Design Spec

## Goal

Add five new enemy formation shapes (diamond, arc, stagger, clusters, spiral) alongside the existing rectangular grid, selected randomly each normal wave. Add a conga-line entry animation where enemies stream in from off-screen along a curved path and peel off to lock into their formation slots before gameplay begins.

## Scope

- Applies only to normal waves (`createFormation` in `enemies.js`)
- Seal waves (`createSealWave`) and boss waves (`createBossWave`) are unchanged
- No new files — all changes in `enemies.js` and `config.js`
- Player can shoot enemies during entry (intentional "shooting gallery" window)
- Sway and dive-launching are suppressed until all enemies are active

## Layout Functions

Six pure functions at the top of `enemies.js`, each with signature `(wave) => [{baseX, baseY}]`. Enemy count varies naturally by shape (~18–28 enemies). Layouts scale gently with wave number so later waves feel denser.

| Name | Shape | ~Count |
|------|-------|--------|
| **Grid** | Existing rectangular rows × cols | 20–30 |
| **Diamond** | Rotated square, wide in the middle | 21 |
| **Arc** | Two concentric arcs curving across the upper screen | 18–22 |
| **Stagger** | Offset rows (brick pattern), denser feel | 24–28 |
| **Clusters** | 4–5 tight groups spread across the screen | 24–30 |
| **Spiral** | Enemies along an outward spiral from center | 20 |

`pickLayout(wave)` randomly selects from all six each wave.

All positions are absolute canvas coordinates (no dependency on ENEMY_COLS/ENEMY_ROWS for the new shapes). Use `CONFIG.CANVAS_WIDTH` and `CONFIG.CANVAS_HEIGHT` to center layouts.

## Entry Animation — Conga Line

### Per-enemy state machine

Each enemy object gains:

```
entryDelay  — seconds before this enemy starts moving (index * ENTRY_STAGGER)
entryT      — current parameter along conga path, 0→1
peelT       — the t value where this enemy peels off toward its slot (precomputed)
state       — 'entering' | 'locking' | 'active'
ex, ey      — current animated position (used instead of baseX/baseY during entry)
```

### Conga path

A cubic Bezier curve defined by four control points. Entry side alternates left/right each wave:

- **Left entry:** P0 = (-20, H*0.38), P1 = (W*0.25, H*0.05), P2 = (W*0.75, H*0.05), P3 = (W+20, H*0.38)
- **Right entry:** mirror P0/P3 horizontally

`bezierPoint(t, p0, p1, p2, p3)` — standard cubic Bezier formula, returns `{x, y}`.

`peelT` for each enemy is precomputed at formation creation: sample the path at ~40 points, find the `t` value where the Bezier point is closest to the enemy's `(baseX, baseY)`. This gives a natural peel-off point as each enemy's path passes near its slot.

### State transitions

**`entering`** — active while `entryDelay > 0` (countdown) then while `entryT < peelT`:
- Count down `entryDelay` each frame. While `entryDelay > 0`, enemy stays off-screen at P0.
- Once delay reaches 0, advance `entryT += dt / ENTRY_TRAVEL_TIME`.
- Set `ex, ey = bezierPoint(entryT)`.
- When `entryT >= peelT`, transition to `locking`.

**`locking`** — fly straight toward `(baseX, baseY)` at `ENTRY_LOCK_SPEED` px/s (sway is suppressed during entry so `groupOffsetX` is always 0 here):
- Compute direction vector, move along it each frame.
- When distance to slot < 4px, snap `ex = baseX`, `ey = baseY`, transition to `active`.

**`active`** — normal formation enemy. Uses `actualX(e)` / `actualY(e)` (baseX + groupOffsetX).

### Formation behavior during entry

```js
function allActive() { return base.every(e => e.state === 'active'); }
```

- **Sway** (`groupOffsetX` update) only runs when `allActive()` is true
- **Dive launching** only triggers when `allActive()` is true
- `getEnemyRects()` uses `ex/ey` for entering/locking enemies, `actualX/Y` for active ones
- `getDiverRects()` unchanged — divers can't launch during entry anyway

### Rendering during entry

Entering and locking enemies render using `ex/ey` for position. Same draw function, same color — no visual distinction. `actualX/Y` is only used for active enemies.

## Config Constants

Add to `config.js` after the existing enemy constants:

```js
// Formation entry animation
ENTRY_STAGGER:      0.08,   // seconds between each enemy's launch
ENTRY_TRAVEL_TIME:  1.4,    // seconds for an enemy to traverse the full conga path
ENTRY_LOCK_SPEED:   280,    // px/s when flying from peel-off point to slot
```

## Files Changed

| File | Change |
|------|--------|
| `config.js` | Add 3 entry animation constants |
| `enemies.js` | Add 5 layout functions + `pickLayout()`, add `bezierPoint()`, update `createFormation` to use layouts and entry state machine |

## Out of Scope

- Entry animations for seal or boss waves
- Per-formation-type entry path variations (all use the same Bezier, alternating side)
- Sound effects during entry (could be a nice addition later)
- Making enemies invincible during entry
