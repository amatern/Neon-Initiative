# Combo Multiplier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a kill-streak combo multiplier (×1.2 → ×4.0 in +0.4 steps) that resets after a 2-second gap between kills, displayed as a gold timer bar in the bottom-left HUD corner.

**Architecture:** Two integers of state (`comboCount`, `comboTimer`) live in `game.js` alongside all other game state. A `stepCombo()` closure increments the count, resets the window, and returns the multiplier to apply. Every confirmed kill goes through `stepCombo()` before scoring. `renderHUD` receives `{ count, timer }` and derives the display multiplier from `CONFIG` constants.

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas 2D

---

### Task 1: Config constants

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Add constants after the entry animation block**

In `src/config.js`, after the line `ENTRY_LOCK_SPEED: 280,` and before `// Particles`, insert:

```js
  // Combo multiplier
  COMBO_WINDOW: 2.0,    // seconds between kills to keep streak alive
  COMBO_BASE:   1.2,    // multiplier at comboCount = 1
  COMBO_STEP:   0.4,    // multiplier increment per additional kill
  COMBO_MAX:    4.0,    // maximum multiplier (reached at comboCount = 8)
  COLOR_COMBO:  '#ffaa00',
```

- [ ] **Step 2: Verify browser loads cleanly**

Open `index.html`. No console errors. Game works normally.

- [ ] **Step 3: Commit**

```bash
git add src/config.js
git commit -m "feat: add combo multiplier constants to config"
```

---

### Task 2: game.js — combo state, decay, reset, HUD passthrough

**Files:**
- Modify: `src/game.js`

This task wires the combo *plumbing* without changing any score values yet. All kill paths still score at ×1.0.

- [ ] **Step 1: Add state variables**

In `src/game.js`, find this line (around line 43):
```js
  let   rapidFireTimer   = 0;
```

Add immediately after it:
```js
  let comboCount = 0;   // kills in current streak; 0 = inactive
  let comboTimer = 0;   // seconds remaining; counts down each frame
```

- [ ] **Step 2: Add stepCombo() helper**

Find the `addNotification` function (around line 55):
```js
  function addNotification(text, x, y, color) {
    notifications.push({ text, x, y, vy: -60, color, timer: 1.5, maxTimer: 1.5 });
  }
```

Add immediately after it:
```js
  function stepCombo() {
    comboCount++;
    comboTimer = CONFIG.COMBO_WINDOW;
    return Math.min(CONFIG.COMBO_BASE + (comboCount - 1) * CONFIG.COMBO_STEP, CONFIG.COMBO_MAX);
  }
```

- [ ] **Step 3: Add combo decay to the update loop**

Find these two lines in the update loop (around line 289):
```js
      if (invincibilityTimer > 0) invincibilityTimer -= dt;
      if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - dt);
```

Add immediately after them:
```js
      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) { comboTimer = 0; comboCount = 0; }
      }
```

- [ ] **Step 4: Reset on game start**

Find in `startGame()` (around line 100):
```js
    rapidFireTimer = 0;
```

Add immediately after:
```js
    comboCount = 0;
    comboTimer = 0;
```

- [ ] **Step 5: Reset on wave transition**

Find in `spawnNextWave()` (around line 128):
```js
    easterEggs.onWaveStart(wave);
  }
```

Add before the closing brace:
```js
    comboCount = 0;
    comboTimer = 0;
```

- [ ] **Step 6: Pass combo to renderHUD**

Find the renderHUD call (around line 489):
```js
      renderHUD(ctx, { score, lives, wave, banner, chadActive: easterEggs.chadActive, highScore, gustActive, terrorActive, powerup: player.getPowerup() });
```

Replace with:
```js
      renderHUD(ctx, { score, lives, wave, banner, chadActive: easterEggs.chadActive, highScore, gustActive, terrorActive, powerup: player.getPowerup(), combo: { count: comboCount, timer: comboTimer } });
```

- [ ] **Step 7: Verify in browser**

Open `index.html`. Play a wave — kill some enemies. The combo HUD won't show yet (hud.js not updated), but the game should run with no console errors. Score still works normally at this point.

- [ ] **Step 8: Commit**

```bash
git add src/game.js
git commit -m "feat: add combo state, decay, reset, and HUD passthrough to game.js"
```

---

### Task 3: game.js — wire multiplier into all kill paths

**Files:**
- Modify: `src/game.js`

There are two kill branches: the CHAD mode branch and the normal branch. Both call `formation.kill(enemy.ref)`. After a confirmed kill, call `stepCombo()` to advance the streak and get the multiplier, then apply it to the score.

- [ ] **Step 1: Wire combo into the CHAD kill branch**

Find this block (around lines 341–356):
```js
          const killed = formation.kill(enemy.ref);
            if (killed) {
              particles.burst(enemy.x, enemy.y, enemy.color || CONFIG.COLOR_ENEMY);
              if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
                powerups.spawn(enemy.x, enemy.y, randomPowerupType());
              }
              if (roll === 20) {
                score += CONFIG.SCORE_NAT20_BONUS;
                particles.burst(enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                addNotification('NAT 20!', enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                audio.nat20();
              } else {
                score += enemy.score || CONFIG.SCORE_PER_ENEMY;
                audio.enemyKill();
              }
            }
```

Replace with:
```js
          const killed = formation.kill(enemy.ref);
            if (killed) {
              particles.burst(enemy.x, enemy.y, enemy.color || CONFIG.COLOR_ENEMY);
              if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
                powerups.spawn(enemy.x, enemy.y, randomPowerupType());
              }
              const mult = stepCombo();
              if (comboCount >= 2) addNotification('×' + mult.toFixed(1) + '!', enemy.x, enemy.y, CONFIG.COLOR_COMBO);
              if (roll === 20) {
                score += CONFIG.SCORE_NAT20_BONUS * mult;
                particles.burst(enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                addNotification('NAT 20!', enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                audio.nat20();
              } else {
                score += (enemy.score || CONFIG.SCORE_PER_ENEMY) * mult;
                audio.enemyKill();
              }
            }
```

- [ ] **Step 2: Wire combo into the normal kill branch**

Find this block (around lines 359–385) — the `else` branch when `easterEggs.chadActive` is false:
```js
          const killed = formation.kill(enemy.ref);
          if (killed) {
            particles.burst(enemy.x, enemy.y, enemy.color || CONFIG.COLOR_ENEMY);
            if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
              powerups.spawn(enemy.x, enemy.y, randomPowerupType());
            }

            if (Math.random() < CONFIG.CRIT_CHANCE) {
              particles.burst(enemy.x, enemy.y, CONFIG.COLOR_CRIT, CONFIG.CRIT_PARTICLE_COUNT);
              addNotification(`+${CONFIG.CRIT_SCORE} CRIT!`, enemy.x, enemy.y, CONFIG.COLOR_CRIT);
              audio.critHit();
              score += CONFIG.CRIT_SCORE;
              for (const adj of formation.getEnemyRects()) {
                const dx = adj.x - enemy.x;
                const dy = adj.y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) <= CONFIG.CRIT_RADIUS) {
                  if (formation.kill(adj.ref)) {
                    particles.burst(adj.x, adj.y, CONFIG.COLOR_CRIT, 8);
                    score += adj.score || CONFIG.SCORE_PER_ENEMY;
                  }
                }
              }
            } else {
              audio.enemyKill();
              score += enemy.score || CONFIG.SCORE_PER_ENEMY;
            }
          }
```

Replace with:
```js
          const killed = formation.kill(enemy.ref);
          if (killed) {
            particles.burst(enemy.x, enemy.y, enemy.color || CONFIG.COLOR_ENEMY);
            if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
              powerups.spawn(enemy.x, enemy.y, randomPowerupType());
            }
            const mult = stepCombo();
            if (comboCount >= 2) addNotification('×' + mult.toFixed(1) + '!', enemy.x, enemy.y, CONFIG.COLOR_COMBO);

            if (Math.random() < CONFIG.CRIT_CHANCE) {
              particles.burst(enemy.x, enemy.y, CONFIG.COLOR_CRIT, CONFIG.CRIT_PARTICLE_COUNT);
              addNotification(`+${CONFIG.CRIT_SCORE} CRIT!`, enemy.x, enemy.y, CONFIG.COLOR_CRIT);
              audio.critHit();
              score += CONFIG.CRIT_SCORE * mult;
              for (const adj of formation.getEnemyRects()) {
                const dx = adj.x - enemy.x;
                const dy = adj.y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) <= CONFIG.CRIT_RADIUS) {
                  if (formation.kill(adj.ref)) {
                    particles.burst(adj.x, adj.y, CONFIG.COLOR_CRIT, 8);
                    score += (adj.score || CONFIG.SCORE_PER_ENEMY) * mult;
                  }
                }
              }
            } else {
              audio.enemyKill();
              score += (enemy.score || CONFIG.SCORE_PER_ENEMY) * mult;
            }
          }
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Play a wave:
- Kill enemies quickly in succession — score should climb faster than normal
- Wait 2+ seconds between kills — combo should reset (count drops to 0 next kill)
- The combo HUD indicator is not visible yet (Task 4), but check the console: no errors

- [ ] **Step 4: Commit**

```bash
git add src/game.js
git commit -m "feat: apply combo multiplier to all kill paths in game.js"
```

---

### Task 4: hud.js — combo indicator

**Files:**
- Modify: `src/hud.js`

- [ ] **Step 1: Add combo parameter to renderHUD signature**

Find the function signature (line 27):
```js
export function renderHUD(ctx, { score, lives, wave, banner, chadActive, highScore, gustActive, terrorActive, powerup }) {
```

Replace with:
```js
export function renderHUD(ctx, { score, lives, wave, banner, chadActive, highScore, gustActive, terrorActive, powerup, combo }) {
```

- [ ] **Step 2: Draw the combo indicator**

Find the final `ctx.restore();` at the bottom of `renderHUD` (line 185):
```js
  ctx.restore();
}
```

Insert immediately before it:
```js
  if (combo && combo.count > 0) {
    const mult = Math.min(CONFIG.COMBO_BASE + (combo.count - 1) * CONFIG.COMBO_STEP, CONFIG.COMBO_MAX);
    const col  = CONFIG.COLOR_COMBO;
    ctx.save();

    // Multiplier text: ×2.4
    ctx.textAlign    = 'left';
    ctx.font         = 'bold 14px monospace';
    ctx.fillStyle    = col;
    ctx.shadowBlur   = 10;
    ctx.shadowColor  = col;
    ctx.fillText('×' + mult.toFixed(1), 14, CONFIG.CANVAS_HEIGHT - 22);

    // COMBO label
    ctx.font         = '9px monospace';
    ctx.fillStyle    = 'rgba(255,170,0,0.55)';
    ctx.shadowBlur   = 0;
    ctx.fillText('COMBO', 14, CONFIG.CANVAS_HEIGHT - 10);

    // Timer bar
    const frac = Math.max(0, combo.timer / CONFIG.COMBO_WINDOW);
    const barX = 55, barY = CONFIG.CANVAS_HEIGHT - 28, barW = 80, barH = 8;
    ctx.strokeStyle = col;
    ctx.lineWidth   = 1;
    ctx.shadowBlur  = 3;
    ctx.shadowColor = col;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle   = col;
    ctx.globalAlpha = 0.85;
    ctx.shadowBlur  = 5;
    ctx.fillRect(barX, barY, barW * frac, barH);

    ctx.restore();
  }

```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Play a wave:
- Kill the first enemy — bottom-left shows `×1.2` with `COMBO` label and a full gold timer bar
- Kill a second enemy quickly — shows `×1.6` and a floating `×1.6!` notification near the kill
- Let the timer expire — the indicator disappears
- The indicator is absent at the start of a wave before any kills
- Powerup indicator (bottom-right) is unaffected
- No overlap with lives (top-right) or score (top-left)

- [ ] **Step 4: Commit**

```bash
git add src/hud.js
git commit -m "feat: add combo multiplier indicator to bottom-left HUD"
```

---

### Task 5: Push and play-test

- [ ] **Step 1: Push to GitHub Pages**

```bash
git push
```

- [ ] **Step 2: Hard-refresh the GitHub Pages URL (Ctrl+Shift+R)**

- [ ] **Step 3: Play through 2–3 waves and verify**

Check:
- Killing enemies quickly builds the combo (×1.2, ×1.6, ×2.0…)
- Floating `×N.N!` notifications appear from the second kill onward
- Timer bar drains visibly between kills — urgency is clear
- Letting the bar expire resets the indicator on next kill back to ×1.2
- Score climbs noticeably faster during a high combo
- Wave clear, game over, restart all reset the combo cleanly
- Powerups, crits, and NAT 20 all benefit from the multiplier
