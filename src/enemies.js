import { CONFIG } from './config.js';

function drawHexagon(ctx, x, y, size) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a  = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function createFormation(wave) {
  const formationWidth = (CONFIG.ENEMY_COLS - 1) * CONFIG.ENEMY_SPACING_X;
  const startX         = (CONFIG.CANVAS_WIDTH - formationWidth) / 2;

  const base = [];
  for (let row = 0; row < CONFIG.ENEMY_ROWS; row++) {
    for (let col = 0; col < CONFIG.ENEMY_COLS; col++) {
      base.push({
        baseX:  startX + col * CONFIG.ENEMY_SPACING_X,
        baseY:  CONFIG.ENEMY_TOP_MARGIN + row * CONFIG.ENEMY_SPACING_Y,
        alive:  true,
      });
    }
  }

  let groupOffsetX = 0;
  let dir          = 1;
  const swaySpeed  = CONFIG.ENEMY_SWAY_BASE + (wave - 1) * CONFIG.ENEMY_SWAY_INCREMENT;

  const actualX = e => e.baseX + groupOffsetX;
  const actualY = e => e.baseY;

  return {
    getEnemyRects() {
      return base
        .filter(e => e.alive)
        .map(e => ({
          x:   actualX(e),
          y:   actualY(e),
          hw:  CONFIG.ENEMY_HITBOX,
          hh:  CONFIG.ENEMY_HITBOX,
          ref: e,
        }));
    },

    kill(ref) { ref.alive = false; },

    allDead() { return base.every(e => !e.alive); },

    update(dt) {
      const live = base.filter(e => e.alive);
      if (live.length === 0) return;

      groupOffsetX += swaySpeed * dir * dt;

      const leftmost  = Math.min(...live.map(e => actualX(e)));
      const rightmost = Math.max(...live.map(e => actualX(e)));

      if (dir ===  1 && rightmost + CONFIG.ENEMY_SIZE >= CONFIG.CANVAS_WIDTH - CONFIG.ENEMY_EDGE_PADDING) dir = -1;
      if (dir === -1 && leftmost  - CONFIG.ENEMY_SIZE <= CONFIG.ENEMY_EDGE_PADDING)                       dir =  1;
    },

    render(ctx) {
      ctx.save();
      ctx.strokeStyle = CONFIG.COLOR_ENEMY;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = CONFIG.ENEMY_GLOW;
      ctx.shadowColor = CONFIG.COLOR_ENEMY;

      for (const e of base) {
        if (!e.alive) continue;
        const x = actualX(e);
        const y = actualY(e);
        drawHexagon(ctx, x, y, CONFIG.ENEMY_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle   = CONFIG.COLOR_ENEMY;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    },
  };
}
