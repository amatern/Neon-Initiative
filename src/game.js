import { CONFIG }               from './config.js';
import { createPlayer }         from './player.js';
import { createFormation }      from './enemies.js';
import { createBulletPool }     from './bullets.js';
import { createParticleSystem } from './particles.js';
import { createStarfield }      from './starfield.js';
import { renderHUD }            from './hud.js';
import { easterEggs }           from './easter-eggs.js';

const STATE = { TITLE: 'title', PLAYING: 'playing', GAME_OVER: 'game_over' };

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');

  const starfield = createStarfield();
  const particles = createParticleSystem();
  const player    = createPlayer();
  const bullets   = createBulletPool();

  let state     = STATE.TITLE;
  let score     = 0;
  let lives     = CONFIG.STARTING_LIVES;
  let wave      = 1;
  let formation = null;
  let banner    = null;

  function makeBanner(text) {
    const duration = CONFIG.WAVE_BANNER_DURATION / 1000;
    return { text, timer: duration, duration };
  }

  function startGame() {
    state     = STATE.PLAYING;
    score     = 0;
    lives     = CONFIG.STARTING_LIVES;
    wave      = 1;
    formation = createFormation(wave);
    bullets.clear();
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
  }

  function spawnNextWave() {
    wave++;
    formation = createFormation(wave);
    bullets.clear();
    banner = makeBanner('Roll for initiative!');
    easterEggs.onWaveStart(wave);
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
    ctx.fillText('← → to move   ■ SPACE to fire', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 130);

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

    const pulse     = 0.65 + 0.35 * Math.sin(Date.now() / 420);
    ctx.globalAlpha = pulse;
    ctx.font        = '19px monospace';
    ctx.fillStyle   = '#ffffff';
    ctx.shadowBlur  = 0;
    ctx.fillText('PRESS R TO RETURN TO TITLE', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 92);

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

      easterEggs.checkTitleScreenCode(input);

      if (state === STATE.TITLE) {
        if (input.wasPressed('Space')) startGame();
        return;
      }

      if (state === STATE.GAME_OVER) {
        if (input.wasPressed('KeyR')) state = STATE.TITLE;
        return;
      }

      // ── STATE.PLAYING ──────────────────────────────────────────────────
      player.update(dt, input);

      if (input.wasPressed('Space')) {
        bullets.fire(player.x, player.y - player.height / 2);
      }

      formation.update(dt);
      bullets.update(dt);

      // Collision: bullets vs. enemies
      const hits = bullets.checkCollisions(formation.getEnemyRects());
      for (const { enemy } of hits) {
        formation.kill(enemy.ref);
        particles.burst(enemy.x, enemy.y, CONFIG.COLOR_ENEMY);
        score += CONFIG.SCORE_PER_ENEMY;
      }

      // Wave cleared
      if (formation.allDead()) {
        spawnNextWave();
        return;
      }

      // Enemies reached the bottom → lose a life
      if (formation.getEnemyRects().some(e => e.y + e.hh > CONFIG.ENEMY_DEATH_LINE)) {
        lives--;
        if (lives <= 0) {
          state = STATE.GAME_OVER;
        } else {
          formation = createFormation(wave);
          bullets.clear();
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

      formation.render(ctx);
      player.render(ctx);
      bullets.render(ctx);
      particles.render(ctx);
      renderHUD(ctx, { score, lives, wave, banner });

      if (state === STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        renderGameOver();
      }
    },
  };
}
