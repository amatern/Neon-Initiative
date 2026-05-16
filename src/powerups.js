import { CONFIG } from './config.js';

export function drawMultishotIcon(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLOR_POWERUP_MULTISHOT;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = CONFIG.COLOR_POWERUP_MULTISHOT;
  ctx.lineCap     = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x, y - size); ctx.stroke();
  ctx.globalAlpha = 0.65;
  ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x - size * 0.7, y - size * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + size); ctx.lineTo(x + size * 0.7, y - size * 0.6); ctx.stroke();
  ctx.restore();
}

export function drawShieldIcon(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLOR_POWERUP_SHIELD;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = CONFIG.COLOR_POWERUP_SHIELD;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a  = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle   = CONFIG.COLOR_POWERUP_SHIELD;
  ctx.fill();
  ctx.restore();
}

export function drawRapidfireIcon(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLOR_POWERUP_RAPIDFIRE;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 6;
  ctx.shadowColor = CONFIG.COLOR_POWERUP_RAPIDFIRE;
  ctx.lineCap     = 'round';
  [-size * 0.55, 0, size * 0.55].forEach(dx => {
    ctx.beginPath();
    ctx.moveTo(x + dx, y + size);
    ctx.lineTo(x + dx, y - size);
    ctx.stroke();
  });
  ctx.globalAlpha = 0.45;
  [-size * 0.55, 0, size * 0.55].forEach(dx => {
    ctx.beginPath();
    ctx.moveTo(x + dx, y + size * 0.2);
    ctx.lineTo(x + dx, y - size * 1.3);
    ctx.stroke();
  });
  ctx.restore();
}

const DRAW_FNS = {
  multishot: drawMultishotIcon,
  shield:    drawShieldIcon,
  rapidfire: drawRapidfireIcon,
};

const TYPES = ['multishot', 'shield', 'rapidfire'];

export function randomPowerupType() {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

export function createPowerupPool() {
  const items = [];

  return {
    spawn(x, y, type) {
      items.push({ x, y, type, lifetime: CONFIG.POWERUP_ITEM_LIFETIME });
    },

    update(dt) {
      for (let i = items.length - 1; i >= 0; i--) {
        items[i].y        += CONFIG.POWERUP_FALL_SPEED * dt;
        items[i].lifetime -= dt;
        if (items[i].lifetime <= 0 || items[i].y > CONFIG.CANVAS_HEIGHT + 20) {
          items.splice(i, 1);
        }
      }
    },

    checkPickup(playerHitbox) {
      const cx = playerHitbox.x + playerHitbox.w / 2;
      const cy = playerHitbox.y + playerHitbox.h / 2;
      for (let i = items.length - 1; i >= 0; i--) {
        const dx = items[i].x - cx;
        const dy = items[i].y - cy;
        if (Math.sqrt(dx * dx + dy * dy) <= CONFIG.POWERUP_PICKUP_RADIUS) {
          const type = items[i].type;
          items.splice(i, 1);
          return type;
        }
      }
      return null;
    },

    render(ctx) {
      const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 300);
      for (const item of items) {
        ctx.globalAlpha = pulse;
        DRAW_FNS[item.type](ctx, item.x, item.y, 10);
      }
      ctx.globalAlpha = 1;
    },

    clear() { items.length = 0; },
  };
}
