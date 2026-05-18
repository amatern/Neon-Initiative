import { CONFIG }               from './config.js';
import { createPlayer }         from './player.js';
import { createFormation }      from './enemies.js';
import { createBossWave }       from './beholder.js';
import { createBulletPool, createEnemyBulletPool } from './bullets.js';
import { createParticleSystem } from './particles.js';
import { createStarfield }      from './starfield.js';
import { renderHUD }            from './hud.js';
import { easterEggs }           from './easter-eggs.js';
import { audio }               from './audio.js';
import { createSealWave, getSealData, isSealWave } from './seal-waves.js';
import { createPowerupPool, randomPowerupType } from './powerups.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused', GAME_OVER: 'game_over' };

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');

  const starfield     = createStarfield();
  const particles     = createParticleSystem();
  const player        = createPlayer();
  const bullets       = createBulletPool();
  const enemyBullets  = createEnemyBulletPool();
  const notifications = [];

  let state          = STATE.TITLE;
  let score          = 0;
  let lives          = CONFIG.STARTING_LIVES;
  let wave           = 1;
  let formation      = null;
  let banner         = null;
  let pauseTip       = null;
  let highScore      = parseInt(localStorage.getItem('neon-initiative-hs') || '0', 10);
  let newBest            = false;
  let defeatSeal         = null;
  let invincibilityTimer = 0;
  let shakeTimer         = 0;
  const powerups         = createPowerupPool();
  let   rapidFireTimer   = 0;
  let comboCount = 0;   // kills in current streak; 0 = inactive
  let comboTimer = 0;   // seconds remaining; counts down each frame

  function makeBanner(text) {
    const duration = CONFIG.WAVE_BANNER_DURATION / 1000;
    return { text, timer: duration, duration };
  }

  function makeSealBanner(sealData, type) {
    const duration = CONFIG.SEAL_BANNER_DURATION / 1000;
    return { seal: sealData, lines: sealData.narrator[type], timer: duration, duration };
  }

  function addNotification(text, x, y, color) {
    notifications.push({ text, x, y, vy: -60, color, timer: 1.5, maxTimer: 1.5 });
  }

  function stepCombo() {
    comboCount++;
    comboTimer = CONFIG.COMBO_WINDOW;
    return Math.min(CONFIG.COMBO_BASE + (comboCount - 1) * CONFIG.COMBO_STEP, CONFIG.COMBO_MAX);
  }

  function triggerGameOver() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('neon-initiative-hs', String(highScore));
      newBest = true;
    }
    defeatSeal = getSealData(wave);
    comboCount = 0;
    comboTimer = 0;
    state = STATE.GAME_OVER;
  }

  function hitPlayer() {
    if (player.hasShield()) {
      player.consumeShield();
      audio.shieldBreak();
      particles.burst(player.x, player.y, '#00ff88', 20);
      shakeTimer = 0.15;
      return;
    }
    particles.burst(player.x, player.y, player.color, 36);
    particles.burst(player.x, player.y, '#ffffff', 16);
    audio.playerHit();
    shakeTimer = 0.35;
    lives--;
    invincibilityTimer = 1.5;
    if (lives <= 0) triggerGameOver();
  }

  function startGame() {
    state              = STATE.PLAYING;
    score              = 0;
    lives              = CONFIG.STARTING_LIVES;
    wave               = 1;
    newBest            = false;
    defeatSeal         = null;
    invincibilityTimer = 0;
    shakeTimer         = 0;
    formation          = createFormation(wave);
    bullets.clear();
    enemyBullets.clear();
    powerups.clear();
    player.clearPowerup();
    rapidFireTimer = 0;
    comboCount = 0;
    comboTimer = 0;
    notifications.length = 0;
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
    if (easterEggs.jonasActive) player.setColor(CONFIG.COLOR_JONAS);
  }

  function spawnNextWave() {
    wave++;
    const isBoss = wave % 5 === 0;
    const seal   = isSealWave(wave) ? getSealData(wave) : null;
    if (isBoss) {
      formation = createBossWave(wave, enemyBullets);
    } else if (seal) {
      formation = createSealWave(wave, enemyBullets);
    } else {
      formation = createFormation(wave);
    }
    bullets.clear();
    enemyBullets.clear();
    powerups.clear();
    if (seal) {
      banner = makeSealBanner(seal, 'start');
    } else if (isBoss) {
      banner = makeBanner('A Beholder materializes...');
    } else {
      banner = makeBanner('Roll for initiative!');
    }
    easterEggs.onWaveStart(wave);
    comboCount = 0;
    comboTimer = 0;
  }

  function renderTitle() {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font        = 'bold 66px monospace';
    ctx.fillStyle   = '#00f0ff';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText('NEON', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 55);

    ctx.font        = 'bold 66px monospace';
    ctx.fillStyle   = '#ffd700';
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillText('INITIATIVE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '21px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    ctx.fillText('PRESS SPACE TO START', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 90);

    ctx.globalAlpha = 1;
    ctx.font        = '15px monospace';
    ctx.fillStyle   = 'rgba(255,255,255,0.45)';
    ctx.fillText('← → to move   SPACE to fire   P to pause', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 130);

    ctx.restore();
  }

  function renderPause() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.textAlign = 'center';

    if (pauseTip) {
      ctx.font        = 'bold 16px monospace';
      ctx.fillStyle   = CONFIG.COLOR_BANNER;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = CONFIG.COLOR_BANNER;
      ctx.fillText('DM TIP:', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);
      ctx.font        = '18px monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowBlur  = 6;
      ctx.shadowColor = '#ffffff';
      ctx.fillText(pauseTip, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
    } else {
      ctx.font        = 'bold 48px monospace';
      ctx.fillStyle   = CONFIG.COLOR_HUD;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = CONFIG.COLOR_HUD;
      ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    }

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '16px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    ctx.fillText('PRESS P TO RESUME', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 60);
    ctx.restore();
  }

  function renderGameOver() {
    ctx.save();
    ctx.textAlign = 'center';

    ctx.font        = 'bold 54px monospace';
    ctx.fillStyle   = '#ff007a';
    ctx.shadowBlur  = 22;
    ctx.shadowColor = '#ff007a';
    ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

    ctx.font        = '26px monospace';
    ctx.fillStyle   = '#00f0ff';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText(`FINAL SCORE: ${score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);

    if (newBest) {
      ctx.font        = 'bold 22px monospace';
      ctx.fillStyle   = CONFIG.COLOR_BANNER;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = CONFIG.COLOR_BANNER;
      ctx.fillText('NEW BEST!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 72);
    } else if (highScore > 0) {
      ctx.font        = '16px monospace';
      ctx.fillStyle   = 'rgba(0,240,255,0.55)';
      ctx.shadowBlur  = 0;
      ctx.fillText(`BEST: ${highScore}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 72);
    }

    if (defeatSeal) {
      ctx.font        = 'bold 14px monospace';
      ctx.fillStyle   = defeatSeal.color;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = defeatSeal.glow;
      ctx.fillText(defeatSeal.narrator.defeat[0], CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 92);
      ctx.font        = '14px monospace';
      ctx.fillStyle   = 'rgba(255,255,255,0.75)';
      ctx.shadowBlur  = 0;
      ctx.fillText(defeatSeal.narrator.defeat[1], CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 112);
    }

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '19px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    const restartY = defeatSeal ? CONFIG.CANVAS_HEIGHT / 2 + 138 : CONFIG.CANVAS_HEIGHT / 2 + 108;
    ctx.fillText('PRESS R TO RETURN TO TITLE', CONFIG.CANVAS_WIDTH / 2, restartY);

    ctx.restore();
  }

  return {
    update(dt, input) {
      starfield.update(dt);
      particles.update(dt);

      if (banner) {
        banner.timer -= dt;
        if (banner.timer <= 0) banner = null;
      }

      // Notifications float upward and fade
      for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i];
        n.y     += n.vy * dt;
        n.timer -= dt;
        if (n.timer <= 0) notifications.splice(i, 1);
      }

      if (state === STATE.TITLE) {
        easterEggs.checkTitleScreenCode(); // only active on title screen
        if (input.wasPressed('Space')) startGame();
        return;
      }

      if (state === STATE.GAME_OVER) {
        if (input.wasPressed('KeyR')) state = STATE.TITLE;
        return;
      }

      if (state === STATE.PAUSED) {
        if (input.wasPressed('KeyP')) state = STATE.PLAYING;
        return;
      }

      // ── STATE.PLAYING ──────────────────────────────────────────────────
      if (input.wasPressed('KeyP')) {
        state    = STATE.PAUSED;
        pauseTip = easterEggs.getPauseTip();
        return;
      }

      if (invincibilityTimer > 0) invincibilityTimer -= dt;
      if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - dt);
      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) { comboTimer = 0; comboCount = 0; }
      }

      player.update(dt, input);

      if (input.wasPressed('Space')) {
        const dawnRef = formation.getMechanics?.();
        if (!dawnRef?.terrorActive) {
          const tip = player.y - player.height / 2;
          if (player.getPowerup().type === 'multishot') {
            bullets.fire(player.x, tip, 0);
            bullets.fire(player.x, tip, -Math.tan(CONFIG.POWERUP_MULTISHOT_ANGLE) * CONFIG.BULLET_SPEED);
            bullets.fire(player.x, tip,  Math.tan(CONFIG.POWERUP_MULTISHOT_ANGLE) * CONFIG.BULLET_SPEED);
          } else {
            bullets.fire(player.x, tip);
          }
          audio.shoot();
        }
      }

      if (player.getPowerup().type === 'rapidfire') {
        rapidFireTimer -= dt;
        if (rapidFireTimer <= 0) {
          const dawnRef = formation.getMechanics?.();
          if (!dawnRef?.terrorActive) {
            bullets.fire(player.x, player.y - player.height / 2);
            audio.shoot();
          }
          rapidFireTimer = CONFIG.POWERUP_RAPIDFIRE_INTERVAL;
        }
      }

      formation.update(dt, player.x, player.y);
      const mech = formation.getMechanics?.();
      if (mech?.getGustDelta) {
        const delta = mech.getGustDelta(dt);
        if (delta !== 0) player.nudge(delta);
      }
      if (formation.wasDiveLaunched()) audio.diverLaunch();
      bullets.update(dt);
      enemyBullets.update(dt, player.x);
      powerups.update(dt);

      // Collision: bullets vs. enemies (formation + divers)
      const hits = bullets.checkCollisions(formation.getEnemyRects());
      for (const { enemy } of hits) {
        if (easterEggs.chadActive) {
          const { roll } = easterEggs.rollForHit();
          if (roll === 1) {
            // Nat 1: shot fizzles — bullet consumed but enemy survives
            addNotification('NAT 1', enemy.x, enemy.y, '#888888');
          } else {
            const killed = formation.kill(enemy.ref);
            if (killed) {
              particles.burst(enemy.x, enemy.y, enemy.color || CONFIG.COLOR_ENEMY);
              if (Math.random() < CONFIG.POWERUP_DROP_CHANCE) {
                powerups.spawn(enemy.x, enemy.y, randomPowerupType());
              }
              const mult = stepCombo();
              if (comboCount >= 2) addNotification('×' + mult.toFixed(1) + '!', enemy.x, enemy.y, CONFIG.COLOR_COMBO);
              if (roll === 20) {
                score += Math.round(CONFIG.SCORE_NAT20_BONUS * mult);
                particles.burst(enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                addNotification('NAT 20!', enemy.x, enemy.y, CONFIG.COLOR_BANNER);
                audio.nat20();
              } else {
                score += Math.round((enemy.score || CONFIG.SCORE_PER_ENEMY) * mult);
                audio.enemyKill();
              }
            }
          }
        } else {
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
              addNotification(`+${Math.round(CONFIG.CRIT_SCORE * mult)} CRIT!`, enemy.x, enemy.y, CONFIG.COLOR_CRIT);
              audio.critHit();
              score += Math.round(CONFIG.CRIT_SCORE * mult);
              for (const adj of formation.getEnemyRects()) {
                const dx = adj.x - enemy.x;
                const dy = adj.y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) <= CONFIG.CRIT_RADIUS) {
                  if (formation.kill(adj.ref)) {
                    particles.burst(adj.x, adj.y, CONFIG.COLOR_CRIT, 8);
                    score += Math.round((adj.score || CONFIG.SCORE_PER_ENEMY) * mult);
                  }
                }
              }
            } else {
              audio.enemyKill();
              score += Math.round((enemy.score || CONFIG.SCORE_PER_ENEMY) * mult);
            }
          }
        }
      }

      const picked = powerups.checkPickup(player.getHitbox());
      if (picked) {
        player.activate(picked);
        audio.powerupPickup();
        if (picked === 'rapidfire') rapidFireTimer = CONFIG.POWERUP_RAPIDFIRE_INTERVAL;
      }

      // Wave cleared
      if (formation.allDead()) {
        audio.waveClear();
        const clearedSeal = isSealWave(wave) ? getSealData(wave) : null;
        spawnNextWave();
        // Override next wave's start banner with victory line if a seal was just cleared
        if (clearedSeal) banner = makeSealBanner(clearedSeal, 'victory');
        return;
      }

      // Enemy bullet → player collision
      const phb = player.getHitbox();
      if (invincibilityTimer <= 0 && enemyBullets.checkPlayerCollision(phb)) {
        hitPlayer();
      }

      // Diver → player collision
      if (invincibilityTimer <= 0) {
        for (const d of formation.getDiverRects()) {
          if (rectsOverlap(d.x - d.hw, d.y - d.hh, d.hw * 2, d.hh * 2, phb.x, phb.y, phb.w, phb.h)) {
            if (formation.kill(d.ref)) particles.burst(d.x, d.y, CONFIG.COLOR_DIVER);
            hitPlayer();
            break; // one hit per frame
          }
        }
      }

      // Acid pool → player collision (Dawn seal)
      if (invincibilityTimer <= 0) {
        const dawnMech = formation.getMechanics?.();
        if (dawnMech?.acidPools) {
          const phbCenter = { x: phb.x + phb.w / 2, y: phb.y + phb.h / 2 };
          for (const pool of dawnMech.acidPools) {
            const dx = phbCenter.x - pool.x;
            const dy = phbCenter.y - pool.y;
            if (Math.sqrt(dx * dx + dy * dy) < CONFIG.SEAL_DAWN_ACID_RADIUS) {
              hitPlayer();
              if (lives <= 0) return;
              break;
            }
          }
        }
      }
    },

    render() {
      ctx.fillStyle = CONFIG.COLOR_BG;
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      starfield.render(ctx);

      if (state === STATE.TITLE) {
        particles.render(ctx);
        renderTitle();
        return;
      }

      // World layer — shakes on player hit, player blinks during invincibility
      ctx.save();
      if (shakeTimer > 0) {
        const mag = (shakeTimer / 0.35) * CONFIG.PLAYER_SHAKE_MAG;
        ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
      }

      formation.render(ctx);
      if (invincibilityTimer <= 0 || Math.sin(Date.now() / 50) > 0) {
        player.render(ctx);
      }
      bullets.render(ctx);
      enemyBullets.render(ctx);
      powerups.render(ctx);
      particles.render(ctx);

      // Floating NAT roll notifications
      if (notifications.length > 0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font      = 'bold 20px monospace';
        for (const n of notifications) {
          ctx.globalAlpha = n.timer / n.maxTimer;
          ctx.fillStyle   = n.color;
          ctx.shadowBlur  = 10;
          ctx.shadowColor = n.color;
          ctx.fillText(n.text, n.x, n.y);
        }
        ctx.restore();
      }

      ctx.restore(); // end world shake

      const mechRef      = formation.getMechanics?.();
      const gustActive   = mechRef?.gustActive   ?? false;
      const terrorActive = mechRef?.terrorActive ?? false;
      renderHUD(ctx, { score, lives, wave, banner, chadActive: easterEggs.chadActive, highScore, gustActive, terrorActive, powerup: player.getPowerup(), combo: { count: comboCount, timer: comboTimer } });

      if (state === STATE.PAUSED) {
        renderPause();
      }

      if (state === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        renderGameOver();
      }
    },
  };
}
