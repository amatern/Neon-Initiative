import { CONFIG } from './config.js';

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createBulletPool() {
  const bullets = [];

  return {
    // x, y = tip of player ship (firing origin)
    fire(x, y) {
      bullets.push({ x, y });
    },

    update(dt) {
      for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= CONFIG.BULLET_SPEED * dt;
        if (bullets[i].y < 0) bullets.splice(i, 1);
      }
    },

    render(ctx) {
      ctx.save();
      ctx.strokeStyle = CONFIG.COLOR_BULLET;
      ctx.lineWidth   = CONFIG.BULLET_WIDTH;
      ctx.shadowBlur  = CONFIG.BULLET_GLOW;
      ctx.shadowColor = CONFIG.COLOR_BULLET;
      ctx.lineCap     = 'round';
      for (const b of bullets) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y - CONFIG.BULLET_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();
    },

    // enemyRects: [{x, y, hw, hh, ref}]
    // Returns [{enemy}] for each hit; removes the colliding bullet.
    checkCollisions(enemyRects) {
      const hits    = [];
      const hitRefs = new Set();

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b  = bullets[i];
        const bx = b.x - CONFIG.BULLET_WIDTH / 2;
        const by = b.y - CONFIG.BULLET_HEIGHT;

        for (const e of enemyRects) {
          if (hitRefs.has(e.ref)) continue;
          if (aabb(bx, by, CONFIG.BULLET_WIDTH, CONFIG.BULLET_HEIGHT, e.x - e.hw, e.y - e.hh, e.hw * 2, e.hh * 2)) {
            hits.push({ enemy: e });
            hitRefs.add(e.ref);
            bullets.splice(i, 1);
            break;
          }
        }
      }

      return hits;
    },

    clear() { bullets.length = 0; },
  };
}

export function createEnemyBulletPool() {
  const bullets = [];

  return {
    // vx/vy in pixels-per-second — supports any direction for Beholder eye patterns
    fire(x, y, vx, vy) {
      bullets.push({ x, y, vx, vy });
    },

    update(dt) {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y > CONFIG.CANVAS_HEIGHT + 20 || b.y < -20 ||
            b.x < -20 || b.x > CONFIG.CANVAS_WIDTH + 20) {
          bullets.splice(i, 1);
        }
      }
    },

    // Returns true if any bullet hit the player; removes that bullet.
    checkPlayerCollision(phb) {
      const hw = CONFIG.ENEMY_BULLET_WIDTH  / 2;
      const hh = CONFIG.ENEMY_BULLET_HEIGHT / 2;
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (aabb(b.x - hw, b.y - hh, hw * 2, hh * 2, phb.x, phb.y, phb.w, phb.h)) {
          bullets.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    render(ctx) {
      ctx.save();
      ctx.fillStyle   = CONFIG.COLOR_ENEMY_BULLET;
      ctx.shadowBlur  = CONFIG.ENEMY_BULLET_GLOW;
      ctx.shadowColor = CONFIG.COLOR_ENEMY_BULLET;
      for (const b of bullets) {
        ctx.fillRect(
          b.x - CONFIG.ENEMY_BULLET_WIDTH  / 2,
          b.y - CONFIG.ENEMY_BULLET_HEIGHT / 2,
          CONFIG.ENEMY_BULLET_WIDTH,
          CONFIG.ENEMY_BULLET_HEIGHT,
        );
      }
      ctx.restore();
    },

    clear() { bullets.length = 0; },
  };
}
