import { CONFIG } from './config.js';
import { drawMultishotIcon, drawShieldIcon, drawRapidfireIcon } from './powerups.js';

function drawD20Icon(ctx, x, y) {
  const s = 12;
  ctx.save();
  ctx.strokeStyle  = CONFIG.COLOR_JONAS;
  ctx.lineWidth    = 1.5;
  ctx.shadowBlur   = 8;
  ctx.shadowColor  = CONFIG.COLOR_JONAS;
  ctx.beginPath();
  ctx.moveTo(x,     y - s);
  ctx.lineTo(x + s, y + s * 0.6);
  ctx.lineTo(x - s, y + s * 0.6);
  ctx.closePath();
  ctx.stroke();
  ctx.font         = 'bold 8px monospace';
  ctx.fillStyle    = CONFIG.COLOR_JONAS;
  ctx.shadowBlur   = 0;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('20', x, y + 1);
  ctx.restore();
}

// banner: null | { text, timer, duration }  (timer in seconds, counts down)
export function renderHUD(ctx, { score, lives, wave, banner, chadActive, highScore, gustActive, terrorActive, powerup }) {
  ctx.save();

  ctx.font        = 'bold 18px monospace';
  ctx.fillStyle   = CONFIG.COLOR_HUD;
  ctx.shadowBlur  = 8;
  ctx.shadowColor = CONFIG.COLOR_HUD;

  // Score — top left
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score}`, 20, 28);

  // Best score — below score, dim
  if (highScore > 0) {
    ctx.font       = '12px monospace';
    ctx.fillStyle  = 'rgba(0,240,255,0.4)';
    ctx.shadowBlur = 0;
    ctx.fillText(`BEST: ${highScore}`, 20, 46);
    ctx.font       = 'bold 18px monospace';
    ctx.fillStyle  = CONFIG.COLOR_HUD;
    ctx.shadowBlur = 8;
  }

  // D20 icon — shown when CHAD mode is active, right of score text
  if (chadActive) {
    const tw = ctx.measureText(`SCORE: ${score}`).width;
    drawD20Icon(ctx, 20 + tw + 20, 20);
  }

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

  // Wave banner — stays full alpha then fades in last 30%
  if (banner && banner.timer > 0) {
    const fadeThreshold = banner.duration * 0.3;
    const alpha         = banner.timer < fadeThreshold ? banner.timer / fadeThreshold : 1;
    ctx.globalAlpha = alpha;
    ctx.textAlign   = 'center';

    if (banner.seal) {
      // Two-line seal banner
      ctx.font        = 'bold 28px monospace';
      ctx.fillStyle   = banner.seal.color;
      ctx.shadowBlur  = 18;
      ctx.shadowColor = banner.seal.glow;
      ctx.fillText(banner.seal.name, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3 - 20);

      ctx.font        = '17px monospace';
      ctx.fillStyle   = '#ffffff';
      ctx.shadowBlur  = 6;
      ctx.shadowColor = '#ffffff';
      ctx.fillText(banner.lines[0], CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3 + 16);
      ctx.fillText(banner.lines[1], CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3 + 40);
    } else {
      // Normal banner
      ctx.font        = 'bold 40px monospace';
      ctx.fillStyle   = CONFIG.COLOR_BANNER;
      ctx.shadowBlur  = 22;
      ctx.shadowColor = CONFIG.COLOR_BANNER;
      ctx.fillText(banner.text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 3);
    }

    ctx.globalAlpha = 1;
  }

  // Gust warning — subtle horizontal lines
  if (gustActive) {
    ctx.save();
    ctx.globalAlpha  = 0.35;
    ctx.strokeStyle  = '#aaeeff';
    ctx.lineWidth    = 1;
    ctx.shadowBlur   = 4;
    ctx.shadowColor  = '#aaeeff';
    for (let i = 0; i < 5; i++) {
      const y = 80 + i * 110;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (terrorActive) {
    ctx.save();
    const tp        = 0.7 + 0.3 * Math.sin(Date.now() / 80);
    ctx.globalAlpha = tp;
    ctx.font        = 'bold 22px monospace';
    ctx.fillStyle   = '#ff2200';
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#ff2200';
    ctx.textAlign   = 'center';
    ctx.fillText('TERROR', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT - 40);
    ctx.restore();
  }

  if (powerup && powerup.type) {
    const col    = powerup.type === 'multishot' ? CONFIG.COLOR_POWERUP_MULTISHOT
                 : powerup.type === 'shield'    ? CONFIG.COLOR_POWERUP_SHIELD
                 : CONFIG.COLOR_POWERUP_RAPIDFIRE;
    const iconFn = powerup.type === 'multishot' ? drawMultishotIcon
                 : powerup.type === 'shield'    ? drawShieldIcon
                 : drawRapidfireIcon;
    const iconX  = CONFIG.CANVAS_WIDTH - 155;
    const iconY  = CONFIG.CANVAS_HEIGHT - 25;

    ctx.save();
    iconFn(ctx, iconX, iconY, 10);

    if (powerup.type !== 'shield') {
      const duration = powerup.type === 'multishot'
        ? CONFIG.POWERUP_MULTISHOT_DURATION
        : CONFIG.POWERUP_RAPIDFIRE_DURATION;
      const frac  = Math.max(0, powerup.timer / duration);
      const barX  = iconX + 18;
      const barY  = iconY - 6;
      const barW  = 120;
      const barH  = 12;
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 4;
      ctx.shadowColor = col;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle   = col;
      ctx.shadowBlur  = 6;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(barX, barY, barW * frac, barH);
    } else {
      ctx.font         = 'bold 13px monospace';
      ctx.fillStyle    = CONFIG.COLOR_POWERUP_SHIELD;
      ctx.shadowBlur   = 6;
      ctx.shadowColor  = CONFIG.COLOR_POWERUP_SHIELD;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('SHIELD ACTIVE', iconX + 18, iconY);
    }
    ctx.restore();
  }

  ctx.restore();
}
