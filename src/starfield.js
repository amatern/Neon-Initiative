import { CONFIG } from './config.js';

export function createStarfield() {
  const tiers = [
    { color: CONFIG.COLOR_STAR_DIM,    speed: CONFIG.STAR_SPEED_DIM,    count: CONFIG.STAR_COUNT_DIM,    size: 1 },
    { color: CONFIG.COLOR_STAR_MID,    speed: CONFIG.STAR_SPEED_MID,    count: CONFIG.STAR_COUNT_MID,    size: 1 },
    { color: CONFIG.COLOR_STAR_BRIGHT, speed: CONFIG.STAR_SPEED_BRIGHT, count: CONFIG.STAR_COUNT_BRIGHT, size: 2 },
  ];

  const stars = [];
  for (const t of tiers) {
    for (let i = 0; i < t.count; i++) {
      stars.push({
        x:     Math.random() * CONFIG.CANVAS_WIDTH,
        y:     Math.random() * CONFIG.CANVAS_HEIGHT,
        speed: t.speed,
        color: t.color,
        size:  t.size,
      });
    }
  }

  return {
    update(dt) {
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > CONFIG.CANVAS_HEIGHT) {
          s.y = 0;
          s.x = Math.random() * CONFIG.CANVAS_WIDTH;
        }
      }
    },

    render(ctx) {
      for (const s of stars) {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    },
  };
}
