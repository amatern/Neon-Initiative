import { CONFIG } from './config.js';

export function createPlayer() {
  const s = {
    x:      CONFIG.CANVAS_WIDTH / 2,
    y:      CONFIG.CANVAS_HEIGHT - CONFIG.PLAYER_START_Y_OFFSET,
    width:  CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    color:  CONFIG.COLOR_PLAYER,
  };

  let powerupType  = null;
  let powerupTimer = 0;
  let shieldActive = false;

  return {
    get x()      { return s.x; },
    get y()      { return s.y; },
    get width()  { return s.width; },
    get height() { return s.height; },
    get color()  { return s.color; },

    update(dt, input) {
      if (input.isDown('ArrowLeft'))  s.x -= CONFIG.PLAYER_SPEED * dt;
      if (input.isDown('ArrowRight')) s.x += CONFIG.PLAYER_SPEED * dt;
      s.x = Math.max(s.width / 2, Math.min(CONFIG.CANVAS_WIDTH - s.width / 2, s.x));

      if (powerupTimer > 0) {
        powerupTimer -= dt;
        if (powerupTimer <= 0) {
          powerupType  = null;
          powerupTimer = 0;
        }
      }
    },

    render(ctx) {
      ctx.save();
      ctx.shadowBlur  = CONFIG.PLAYER_GLOW;
      ctx.shadowColor = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(s.x,               s.y - s.height / 2);
      ctx.lineTo(s.x + s.width / 2, s.y + s.height / 2);
      ctx.lineTo(s.x - s.width / 2, s.y + s.height / 2);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle   = s.color;
      ctx.fill();
      ctx.restore();

      if (shieldActive) {
        ctx.save();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#00ff88';
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 150);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    },

    getHitbox() {
      const hw = (s.width  * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      const hh = (s.height * CONFIG.PLAYER_HITBOX_SCALE) / 2;
      return { x: s.x - hw, y: s.y - hh, w: hw * 2, h: hh * 2 };
    },

    setColor(color) { s.color = color; },

    nudge(dx) {
      s.x = Math.max(s.width / 2, Math.min(CONFIG.CANVAS_WIDTH - s.width / 2, s.x + dx));
    },

    activate(type) {
      powerupType  = type;
      shieldActive = type === 'shield';
      powerupTimer = type === 'multishot' ? CONFIG.POWERUP_MULTISHOT_DURATION
                   : type === 'rapidfire' ? CONFIG.POWERUP_RAPIDFIRE_DURATION
                   : 0;
    },

    hasShield()     { return shieldActive; },

    consumeShield() {
      shieldActive = false;
      powerupType  = null;
    },

    getPowerup()    { return { type: powerupType, timer: powerupTimer }; },

    clearPowerup()  {
      powerupType  = null;
      powerupTimer = 0;
      shieldActive = false;
    },
  };
}
