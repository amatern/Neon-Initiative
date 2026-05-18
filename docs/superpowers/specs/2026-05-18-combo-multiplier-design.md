# Combo Multiplier — Design Spec

## Goal

Add a kill-streak combo multiplier that rewards fast, consecutive kills. Each kill within a 2-second window steps the multiplier up by ×0.4, starting at ×1.2 and capping at ×4.0. The multiplier is displayed in the bottom-left corner of the HUD with a draining timer bar.

## Scope

- Normal kills, crits, and NAT 20 bonuses all go through the multiplier
- Reset trigger: timer only — the 2-second window expires with no kill
- No reset on player hit, no reset on missing shots
- No new files — all changes in `config.js`, `game.js`, `hud.js`

## Multiplier Formula

```
multiplier = min(COMBO_BASE + (comboCount - 1) × COMBO_STEP, COMBO_MAX)
           = min(1.2 + (comboCount - 1) × 0.4, 4.0)
```

| comboCount | multiplier |
|-----------|-----------|
| 0 | 1.0× (inactive, no display) |
| 1 | 1.2× |
| 2 | 1.6× |
| 3 | 2.0× |
| 4 | 2.4× |
| 5 | 2.8× |
| 6 | 3.2× |
| 7 | 3.6× |
| 8+ | 4.0× (capped) |

## State (game.js)

```js
let comboCount = 0;   // kills in current streak; 0 = inactive
let comboTimer = 0;   // seconds remaining in window; counts down each frame
```

Reset both to 0 in `startGame()` and `spawnNextWave()`.

## Per-Kill Logic

On every confirmed kill (after `formation.kill(ref)` returns `true`):

1. `comboCount++`
2. `comboTimer = CONFIG.COMBO_WINDOW`
3. Compute `multiplier = Math.min(CONFIG.COMBO_BASE + (comboCount - 1) * CONFIG.COMBO_STEP, CONFIG.COMBO_MAX)`
4. Apply to score: `score += basePoints * multiplier`
5. If `comboCount >= 2`: call `addNotification('×' + multiplier.toFixed(1) + '!', enemy.x, enemy.y, CONFIG.COLOR_COMBO)` to show the new multiplier floating near the kill

The multiplier is computed **before** applying to score but **after** incrementing comboCount, so the first kill in a streak already benefits from ×1.2.

### Special kill paths

- **Normal kill:** `basePoints = enemy.score || CONFIG.SCORE_PER_ENEMY`
- **Crit kill:** `basePoints = CONFIG.CRIT_SCORE` (splash kills also multiplied)
- **NAT 20:** `basePoints = CONFIG.SCORE_NAT20_BONUS`

Each path applies the same `* multiplier` factor.

## Per-Frame Update

```js
if (comboTimer > 0) {
  comboTimer -= dt;
  if (comboTimer <= 0) {
    comboTimer = 0;
    comboCount = 0;
  }
}
```

This runs every frame regardless of game state (paused check already exists above in the update loop).

## HUD (hud.js)

`renderHUD` receives a new `combo` parameter: `{ count, timer }`.

When `combo.count > 0`, draw in the bottom-left corner:

- **Multiplier text:** `×2.4` — bold 14px monospace, color `CONFIG.COLOR_COMBO` (`#ffaa00`), with glow
- **Label:** `COMBO` — 9px monospace, dim gold below the multiplier text
- **Timer bar:** 80px wide, same style as powerup bar on the right — stroked rect, filled rect at `timer / CONFIG.COMBO_WINDOW` fraction

When `combo.count === 0`, nothing is drawn in that corner.

## Config Constants

Add to `config.js` after the powerup constants:

```js
// Combo multiplier
COMBO_WINDOW: 2.0,   // seconds between kills to keep streak alive
COMBO_BASE:   1.2,   // multiplier at comboCount = 1
COMBO_STEP:   0.4,   // multiplier increment per additional kill
COMBO_MAX:    4.0,   // maximum multiplier
COLOR_COMBO:  '#ffaa00',
```

## Files Changed

| File | Change |
|------|--------|
| `config.js` | Add 5 combo constants |
| `game.js` | Add `comboCount`/`comboTimer` state; per-kill multiplier logic; per-frame timer decay; pass `combo` to `renderHUD` |
| `hud.js` | Accept `combo` param; draw bottom-left indicator when active |

## Out of Scope

- Combo reset on player hit or missed shots
- "COMBO LOST" flash when timer expires
- Screen pulse on reaching 4.0×
- Combo bonus on wave clear
- Separate combo tracking for seal or boss waves (they use the same kill path, so they benefit naturally)
