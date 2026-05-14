# CLAUDE.md — Vector Galaga

## Project overview

A browser-based, Galaga-style fixed shooter built with vanilla HTML5 Canvas and JavaScript. The visual style is **vector/geometric neon-on-black** — think Geometry Wars meets classic Asteroids. No external sprite assets; everything is drawn programmatically with shapes, lines, and particles.

This is a personal project built for my son Jonas. Treat it as a polished hobby game, not a production app — readability and fun matter more than enterprise patterns.

## Tech stack

- **Vanilla JavaScript** (ES modules, no framework)
- **HTML5 Canvas** for all rendering
- **No build step** — open `index.html` in a browser and it runs
- **No external runtime dependencies** — keep `package.json` minimal (dev tooling only if needed)

If a feature seems to require a library, propose it explicitly before adding it.

## File structure

```
/
├── index.html
├── style.css
├── src/
│   ├── main.js          # entry point, game loop
│   ├── game.js          # game state machine
│   ├── player.js        # player ship logic + rendering
│   ├── enemies.js       # enemy types, formations, AI
│   ├── bullets.js       # player + enemy projectiles
│   ├── particles.js     # explosions, thrust, ambient effects
│   ├── input.js         # keyboard handling + key buffer (for easter egg codes)
│   ├── hud.js           # score, lives, wave display
│   ├── starfield.js     # scrolling background
│   ├── audio.js         # WebAudio sound synthesis (no sample files)
│   ├── easter-eggs.js   # all easter egg logic, isolated here
│   └── config.js        # tunable constants (speeds, colors, spawn rates)
└── CLAUDE.md
```

## Coding conventions

- **ES modules** with explicit imports/exports.
- **Functional style preferred** for game objects: factory functions that return `{state, update, render}` over ES6 classes. Classes are fine when state is genuinely complex.
- **Pure functions** wherever possible; isolate mutation in update steps.
- **Constants live in `config.js`** — speeds, colors, hitbox sizes, spawn rates. Don't hardcode tuning values in the middle of game logic.
- **No magic numbers** in rendering code; name colors and dimensions.
- Use `requestAnimationFrame` with a fixed-timestep accumulator pattern for the game loop.
- Delta-time everything — never assume 60fps.

## Visual style

- **Palette:** black background, neon accents. Defaults:
  - Player: cyan (`#00f0ff`)
  - Enemies: magenta/red gradient by type (`#ff007a`, `#ff4444`, `#ffaa00`)
  - Bullets: white with colored glow matching shooter
  - Stars: white, varying brightness
- **Glow effect:** use `ctx.shadowBlur` and `ctx.shadowColor` for that neon look. Apply consistently via a helper.
- **All entities are geometric shapes** — triangles, trapezoids, hexagons, circles, line art. No sprite images.
- **Particle explosions** on every destruction. Aim for "juicy" feel.
- **Screen shake** on player hit and boss explosions (subtle, ~3-5 frames).

## Gameplay direction

Start minimal, expand outward. The MVP is:

1. Player ship moves left/right, shoots upward
2. Grid of enemies that sway side-to-side (classic Galaga formation)
3. Enemies occasionally dive-bomb toward the player
4. Collision detection, lives, score, wave progression

Once that's solid and fun, layer in:
- Multiple enemy types with distinct movement patterns
- Power-ups (multi-shot, shield, etc.)
- Bosses every N waves
- Sound (synthesized via WebAudio, no sample files)
- Persistent high score in localStorage

## Easter eggs — IMPORTANT

The game is built for my son Jonas, whose D&D character is named Chad. Easter eggs are a **core feature**, not throwaway code. Keep them in `src/easter-eggs.js` and reference them from the main game via clearly-named hooks (e.g. `easterEggs.checkTitleScreenCode(input)`).

**Do not "clean up" or remove easter egg code** even if it looks like dead code or a special-case branch. If something seems unused, ask before deleting.

### Active easter eggs

- **JONAS code (title screen):** typing J-O-N-A-S on the title screen turns the player ship gold (`#ffd700`) for the session, with an enhanced glow. Persists across deaths until the page reloads.
- **CHAD mode (title screen):** typing C-H-A-D enables "D&D mode":
  - Player projectile damage is "rolled" — random integer 1–20 instead of fixed
  - On a roll of 20, display "NAT 20!" briefly and deal 20× damage with a burst effect
  - On a roll of 1, display "NAT 1" and the shot fizzles (no damage)
  - HUD shows a small D20 icon when active
- **The Jonas (rare enemy):** ~1% spawn chance per wave after wave 5. A large gold-outlined enemy with erratic movement. Worth 5000 points. Drops a guaranteed power-up.
- **Beholder boss:** every 10th wave. A large circle with 10 vector "eye stalks" that each fire a different bullet pattern. Flavor text on intro: "A Beholder materializes…"
- **Five Seals levels:** waves 5, 15, 25, 35, 45 are themed "seal" waves with unique color palettes and enemy compositions. (Wave 5 = Seal of Fire, red palette; the rest are TBD — ask before inventing them.)
- **Critical hits in normal mode:** 1-in-50 player shots are crits, dealing 3× damage with a brief white flash on the enemy.
- **Pause screen DM tips:** when paused, 20% chance to show a random "DM tip" instead of "PAUSED" — keep the list in `easter-eggs.js`.

### Adding new easter eggs

I may add more over time. When I ask for a new one, put it in `easter-eggs.js`, document it in this file under "Active easter eggs," and wire it in via a minimal hook from the relevant module.

## Working style for Claude Code

- **Iterate in small steps.** Implement one feature, let me test, then move on.
- **Show your reasoning briefly** before large changes — what you're about to do and why.
- **Ask before adding dependencies, build tooling, or new files** outside the structure above.
- **Don't refactor unprompted.** If something needs refactoring, flag it and ask.
- **Commit-sized changes.** After each meaningful feature, suggest a commit message.
- **Test in-browser frequently** — open `index.html` and play, don't assume code works because it parses.
- When stuck on game-feel tuning (speeds, hitboxes, spawn rates), suggest 2–3 values to try rather than guessing one.

## Out of scope (for now)

- Multiplayer / networking
- Mobile touch controls (maybe later)
- Build pipelines, bundlers, TypeScript
- Asset pipelines or sprite loading
- Backend / accounts / leaderboards beyond localStorage
