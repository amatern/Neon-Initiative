import { CONFIG } from './config.js';

// banner: null | { text, timer, duration }  (timer in seconds, counts down)
export function renderHUD(ctx, { score, lives, wave, banner }) {
  ctx.save();

  ctx.font        = 'bold 18px monospace';
  ctx.fillStyle   = CONFIG.COLOR_HUD;
  ctx.shadowBlur  = 8;
  ctx.shadowColor = CONFIG.COLOR_HUD;

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 28);

  // Wave — top center
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave}`, CONFIG.CANVAS_WIDTH / 2, 28);

  // Lives — top right as small triangle icons
  const ts          = 11;
  const lifeSpacing = 28;
  const lifeY       = 18;
  const lifeStartX  = CONFIG.CANVAS_WIDTH - 20 - (lives - 1) * lifeSpacing;

  ctx.strokeStyle = CONFIG.COLOR_HUD;
  ctx.lineWidth   = 1.5;
  for (let i = 0; i < lives; i++) {
    const lx = lifeStartX + i * lifeSpacing;
    ctx.beginPath();
    ctx.moveTo(lx,      lifeY - ts);
    ctx.lineTo(lx + ts, lifeY + ts);
    ctx.lineTo(lx - ts, lifeY + ts);
    ctx.closePath();
    ctx.stroke();
  }

  // Wave banner — centered, stays full alpha then fades in last 30%
  if (banner && banner.timer > 0) {
    const fadeThreshold = banner.duration * 0.3;
    const alpha         = banner.timer < fadeThreshold ? banner.timer / fadeThreshold : 1;
    ctx.globalAlpha = alpha;
    ctx.font        = 'bold 40px monospace';
    ctx.fillStyle   = CONFIG.COLOR_BANNER;
    ctx.shadowBlur  = 22;
    ctx.shadowColor = CONFIG.COLOR_BANNER;
    ctx.textAlign   = 'center';
    ctx.fillText(banner.text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3);
  }

  ctx.restore();
}
