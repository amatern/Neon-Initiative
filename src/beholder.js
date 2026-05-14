import { CONFIG }          from './config.js';
import { createFormation } from './enemies.js';

const FIRE_INTERVALS = {
  aimed:       2.0,
  spread:      2.5,
  spiral:      0.6,
  burst:       4.0,
  fastDown:    1.5,
  slowArc:     1.0,
  paired:      2.0,
  bouncing:    3.0,
  homing:      4.0,
  suppression: 0.8,
};

const PATTERNS = [
  'aimed', 'spread', 'spiral', 'burst', 'fastDown',
  'slowArc', 'paired', 'bouncing', 'homing', 'suppression',
];

function createBeholderCore(enemyBullets) {
  let x = CONFIG.CANVAS_WIDTH / 2;
  let y = -(CONFIG.BEHOLDER_RADIUS + 30);

  const eyes = PATTERNS.map((pattern, i) => ({
    angle:       (Math.PI * 2 * i) / 10 - Math.PI / 2,
    alive:       true,
    pattern,
    fireTimer:   i * 0.3,
    spiralAngle: Math.PI / 2,
    arcAngle:    0,
    arcDir:      1,
  }));

  function eyeX(e) {
    return x + Math.cos(e.angle) * (CONFIG.BEHOLDER_RADIUS + CONFIG.BEHOLDER_STALK_LENGTH);
  }
  function eyeY(e) {
    return y + Math.sin(e.angle) * (CONFIG.BEHOLDER_RADIUS + CONFIG.BEHOLDER_STALK_LENGTH);
  }

  function fireEye(eye, playerX, playerY) {
    const ex  = eyeX(eye);
    const ey  = eyeY(eye);
    const spd = 200;

    switch (eye.pattern) {
      case 'aimed': {
        const dx = playerX - ex, dy = playerY - ey;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        enemyBullets.fire(ex, ey, dx / d * spd, dy / d * spd);
        break;
      }
      case 'spread': {
        const base = Math.atan2(playerY - ey, playerX - ex);
        for (let k = -1; k <= 1; k++) {
          const a = base + k * (Math.PI / 12);
          enemyBullets.fire(ex, ey, Math.cos(a) * spd, Math.sin(a) * spd);
        }
        break;
      }
      case 'spiral': {
        enemyBullets.fire(ex, ey, Math.cos(eye.spiralAngle) * spd, Math.sin(eye.spiralAngle) * spd);
        eye.spiralAngle += Math.PI / 6;
        break;
      }
      case 'burst': {
        for (let k = 0; k < 8; k++) {
          const a = (Math.PI * 2 * k) / 8;
          enemyBullets.fire(ex, ey, Math.cos(a) * spd, Math.sin(a) * spd);
        }
        break;
      }
      case 'fastDown': {
        enemyBullets.fire(ex, ey, 0, 380);
        break;
      }
      case 'slowArc': {
        const arcSpd = 100;
        const vx     = Math.cos(eye.arcAngle) * arcSpd;
        const vy     = Math.abs(Math.sin(eye.arcAngle)) * arcSpd + 60;
        enemyBullets.fire(ex, ey, vx, vy);
        eye.arcAngle += (Math.PI / 8) * eye.arcDir;
        if (Math.abs(eye.arcAngle) >= Math.PI / 2) eye.arcDir *= -1;
        break;
      }
      case 'paired': {
        const dx = playerX - ex, dy = playerY - ey;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const vx = dx / d * spd, vy = dy / d * spd;
        const px = -dy / d * 14,  py = dx / d * 14;
        enemyBullets.fire(ex + px, ey + py, vx, vy);
        enemyBullets.fire(ex - px, ey - py, vx, vy);
        break;
      }
      case 'bouncing': {
        const dir = Math.random() < 0.5 ? 1 : -1;
        enemyBullets.fire(ex, ey, dir * 160, 160, 'bouncing', 2);
        break;
      }
      case 'homing': {
        enemyBullets.fire(ex, ey, 0, 100, 'homing');
        break;
      }
      case 'suppression': {
        enemyBullets.fire(ex, ey, 0, 280);
        break;
      }
    }
  }

  return {
    update(dt, playerX, playerY) {
      if (y < CONFIG.BEHOLDER_REST_Y) {
        y = Math.min(CONFIG.BEHOLDER_REST_Y, y + CONFIG.BEHOLDER_DESCENT_SPEED * dt);
      }

      for (const eye of eyes) {
        if (!eye.alive) continue;
        eye.fireTimer -= dt;
        if (eye.fireTimer <= 0) {
          fireEye(eye, playerX, playerY);
          eye.fireTimer = FIRE_INTERVALS[eye.pattern];
        }
      }
    },

    allDead() { return eyes.every(e => !e.alive); },

    getEnemyRects() {
      return eyes.filter(e => e.alive).map(e => ({
        x:     eyeX(e),
        y:     eyeY(e),
        hw:    CONFIG.BEHOLDER_EYE_RADIUS,
        hh:    CONFIG.BEHOLDER_EYE_RADIUS,
        ref:   e,
        score: CONFIG.BEHOLDER_SCORE_PER_EYE,
        color: CONFIG.COLOR_BEHOLDER_EYE,
      }));
    },

    kill(ref) { ref.alive = false; },

    render(ctx) {
      ctx.save();

      // Body
      ctx.strokeStyle = CONFIG.COLOR_BEHOLDER;
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = CONFIG.COLOR_BEHOLDER;
      ctx.beginPath();
      ctx.arc(x, y, CONFIG.BEHOLDER_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle   = CONFIG.COLOR_BEHOLDER;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eye stalks and eyes
      for (const eye of eyes) {
        const baseX = x + Math.cos(eye.angle) * CONFIG.BEHOLDER_RADIUS;
        const baseY = y + Math.sin(eye.angle) * CONFIG.BEHOLDER_RADIUS;
        const tipX  = eyeX(eye);
        const tipY  = eyeY(eye);
        const color = eye.alive ? CONFIG.COLOR_BEHOLDER_EYE : 'rgba(120,60,120,0.3)';

        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur  = eye.alive ? 10 : 0;
        ctx.lineWidth   = 2;

        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tipX, tipY, eye.alive ? 8 : 4, 0, Math.PI * 2);
        ctx.stroke();
        if (eye.alive) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle   = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    },
  };
}

export function createBossWave(wave, enemyBullets) {
  const escort   = createFormation(wave, 2);
  const beholder = createBeholderCore(enemyBullets);
  let   diveLaunched = false;

  return {
    update(dt, playerX, playerY) {
      diveLaunched = false;
      escort.update(dt, playerX);
      if (escort.wasDiveLaunched()) diveLaunched = true;
      beholder.update(dt, playerX, playerY);
    },

    wasDiveLaunched() { return diveLaunched; },

    getEnemyRects() {
      return [...escort.getEnemyRects(), ...beholder.getEnemyRects()];
    },

    getDiverRects() { return escort.getDiverRects(); },

    kill(ref) {
      if ('pattern' in ref) beholder.kill(ref);
      else escort.kill(ref);
    },

    allDead() { return escort.allDead() && beholder.allDead(); },

    render(ctx) {
      escort.render(ctx);
      beholder.render(ctx);
    },
  };
}
