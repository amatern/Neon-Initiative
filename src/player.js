import { CONFIG } from './config.js';

export function createPlayer() {
  const s = {
    x:      CONFIG.CANVAS_WIDTH / 2,
    y:      CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET,
    width:  CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    color:  CONFIG.COLOR_PLAYER,
  };

  return {
    get x()      { return s.x; },
    get y()      { return s.y; },
    get width()  { return s.width; },
    get height() { return s.height; },

    update(dt, input) {
      if (input.isDown('ArrowLeft'))  s.x -= CONFIG.PLAYER_SPEED * dt;
      if (input.isDown('ArrowRight')) s.x += CONFIG.PLAYER_SPEED * dt;
      s.x = Math.max(s.width / 2, Math.min(CONFIG.CANVAS_WIDTH - s.width / 2, s.x));
    },

    render(ctx) {
      ctx.save();
      ctx.shadowBlur  = CONFIG.PLAYER_GLOW;
      ctx.shadowColor = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(s.x,               s.y - s.height / 2); // tip
      ctx.lineTo(s.x + s.width / 2, s.y + s.height / 2); // bottom-right
      ctx.lineTo(s.x - s.width / 2, s.y + s.height / 2); // bottom-left
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle   = s.color;
      ctx.fill();
      ctx.restore();
    },

    getHitbox() {
      const hw = (s.width  * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      const hh = (s.height * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      return { x: s.x - hw, y: s.y - hh, w: hw * 2, h: hh * 2 };
    },

    setColor(color) { s.color = color; },
  };
}
