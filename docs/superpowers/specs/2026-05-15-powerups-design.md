# Power-ups — Design Spec

**Date:** 2026-05-15  
**Status:** Approved

## Goal

Add collectible power-ups that drop from killed enemies and fall toward the player. Three types: multi-shot, shield, rapid fire. New pickup overrides the current active power-up.

## Decisions

| Question | Decision |
|----------|----------|
| Types | Multi-shot, Shield, Rapid Fire (no bomb) |
| On new pickup | Override — replaces current effect immediately |
| Architecture | New `src/powerups.js` module (falling item pool) |
| HUD style | Icon + draining timer bar, bottom-right corner |
| Drop rate | 15% per normal kill; The Jonas = guaranteed drop |
| Wave persistence | Active effects persist across wave transitions |

## Power-up Types

| Type | Effect | Duration |
|------|--------|----------|
| `multishot` | 3 spread bullets per shot (one straight, two at ±15°) | 8s |
| `shield` | Absorbs one hit, then breaks — no damage, no shake | Until hit |
| `rapidfire` | Auto-fires at 3× normal rate (every 0.22s) | 6s |

## Architecture

### `src/powerups.js` (new)

A falling-item pool modelled after `bullets.js`.

```
createPowerupPool()
  spawn(x, y, type)          — called at enemy kill site
  update(dt, playerX, playerY) — moves items down, ages lifetime timer
  checkPickup(playerHitbox)  — returns type string if player overlaps item, removes it; null otherwise
  render(ctx)                — draws each item as a neon icon with glow
  clear()                    — called on wave start / game reset
```

Each item object:
```javascript
{ x, y, type, vy: CONFIG.POWERUP_FALL_SPEED, lifetime: CONFIG.POWERUP_ITEM_LIFETIME }
```

Items fall at `POWERUP_FALL_SPEED` px/s and disappear after `POWERUP_ITEM_LIFETIME` seconds if not collected. Items that fall off the bottom of the screen are also removed.

**Draw functions** — exported, one per type, same `(ctx, x, y, size)` signature as enemy draw functions:
- `multishot` → three spread lines (cyan `#00f0ff`)
- `shield` → small hexagon ring (mint `#00ff88`)
- `rapidfire` → three stacked bullet lines (amber `#ffaa00`)

### `src/player.js` changes

New internal state:
```javascript
let powerupType  = null;   // 'multishot' | 'shield' | 'rapidfire' | null
let powerupTimer = 0;      // seconds remaining (unused for shield)
let shieldActive = false;
```

New methods on the returned object:
```javascript
activate(type)       // sets powerupType + timer; sets shieldActive if type === 'shield'; overrides any current effect
hasShield()          // returns shieldActive
consumeShield()      // sets shieldActive = false, powerupType = null
getPowerup()         // returns { type: powerupType, timer: powerupTimer } — used by HUD and game.js
clearPowerup()       // resets all powerup state (called on startGame)
```

`player.update(dt, input)` counts down `powerupTimer`; when it reaches 0, clears `powerupType` (except shield, which has no timer).

### `src/bullets.js` changes

`fire(x, y, vx = 0)` — add optional `vx` parameter stored on the bullet. `update` applies `bullet.x += bullet.vx * dt`. Backward-compatible (existing calls with no `vx` continue to work).

### `src/game.js` changes

**Spawn on kill:** At each kill site (both CHAD and normal paths), after `particles.burst(...)`:
```javascript
if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
  powerups.spawn(enemy.x, enemy.y, randomPowerupType());
}
```
`randomPowerupType()` picks uniformly from `['multishot', 'shield', 'rapidfire']`.

**Pickup detection** (in the PLAYING update loop, after bullet collision):
```javascript
const picked = powerups.checkPickup(player.getHitbox());
if (picked) {
  player.activate(picked);
  audio.powerupPickup();
}
```

**Firing — multi-shot:** When `player.getPowerup().type === 'multishot'`, fire 3 bullets:
```javascript
bullets.fire(player.x, player.y - player.height / 2, 0);
bullets.fire(player.x, player.y - player.height / 2, -Math.tan(CONFIG.POWERUP_MULTISHOT_ANGLE) * CONFIG.BULLET_SPEED);
bullets.fire(player.x, player.y - player.height / 2,  Math.tan(CONFIG.POWERUP_MULTISHOT_ANGLE) * CONFIG.BULLET_SPEED);
```

**Firing — rapid fire:** A `rapidFireTimer` variable in game state counts down each frame when rapidfire is active. When it hits 0, fires one bullet and resets to `CONFIG.POWERUP_RAPIDFIRE_INTERVAL`. Manual spacebar shots still work normally during rapid fire.

**Shield intercept** in `hitPlayer()`:
```javascript
function hitPlayer() {
  if (player.hasShield()) {
    player.consumeShield();
    audio.shieldBreak();
    particles.burst(player.x, player.y, '#00ff88', 20);
    shakeTimer = 0.15; // brief shake to confirm the block
    return;
  }
  // ... existing damage logic
}
```

**`startGame()` reset:** call `player.clearPowerup()`, `powerups.clear()`, reset `rapidFireTimer = 0`.

**`spawnNextWave()` reset:** call `powerups.clear()` to remove uncollected drops from the previous wave.

### `src/hud.js` changes

New `powerup` param added to `renderHUD(ctx, { ..., powerup })`.

Bottom-right corner indicator when `powerup.type` is non-null:
- Draw the type's icon — import the draw functions exported from `powerups.js`
- If type is not `shield`: draw a glowing rect outline as the bar background, filled rect scaled to `powerup.timer / CONFIG.POWERUP_[TYPE]_DURATION`
- If type is `shield`: draw icon + "SHIELD ACTIVE" text in mint green, no bar

### `src/config.js` changes

```javascript
// Power-ups
POWERUP_DROP_CHANCE:          0.15,
POWERUP_FALL_SPEED:           80,     // px/s
POWERUP_ITEM_LIFETIME:        8,      // seconds before uncollected item disappears
POWERUP_MULTISHOT_DURATION:   8,      // seconds
POWERUP_MULTISHOT_ANGLE:      0.26,   // radians (~15°) for spread bullets
POWERUP_RAPIDFIRE_DURATION:   6,      // seconds
POWERUP_RAPIDFIRE_INTERVAL:   0.22,   // seconds between auto-shots
COLOR_POWERUP_MULTISHOT:      '#00f0ff',
COLOR_POWERUP_SHIELD:         '#00ff88',
COLOR_POWERUP_RAPIDFIRE:      '#ffaa00',
```

## Files Changed

| File | Change |
|------|--------|
| `src/config.js` | Add powerup constants |
| `src/powerups.js` | **NEW** — falling item pool, draw functions |
| `src/player.js` | Add activate/hasShield/consumeShield/getPowerup/clearPowerup; timer countdown in update |
| `src/bullets.js` | Add optional `vx` to fire(); apply in update |
| `src/game.js` | Import powerups; spawn on kill; pickup detection; multi-shot firing; rapid fire timer; shield intercept in hitPlayer; reset on startGame/spawnNextWave |
| `src/audio.js` | Add `powerupPickup()` and `shieldBreak()` synth sounds |
| `src/hud.js` | Powerup indicator (icon + timer bar) in bottom-right |

## Out of Scope

- Stacking multiple active power-ups
- Smart bomb / screen-clear power-up
- Power-up rarity tiers
- Sound effects beyond pickup chime and shield break (those two are in scope; other powerup sounds are not)
- "The Jonas" guaranteed drop wiring (power-up system provides the hook; Jonas spawn logic is in easter-eggs.js and is a separate task)
