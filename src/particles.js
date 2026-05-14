import { CONFIG } from './config.js';

export function createParticleSystem() {
  const particles = [];

  return {
    burst(x, y, color, count = CONFIG.PARTICLE_COUNT) {
      for (let i = 0; i < count; i++) {
        const angle    = (Math.PI * 2 * i) / CONFIG.PARTICLE_COUNT + (Math.random() - 0.5) * 0.8;
        const speed    = CONFIG.PARTICLE_SPEED_MIN + Math.random() * (CONFIG.PARTICLE_SPEED_MAX - CONFIG.PARTICLE_SPEED_MIN);
        const lifetime = CONFIG.PARTICLE_LIFETIME_MIN + Math.random() * (CONFIG.PARTICLE_LIFETIME_MAX - CONFIG.PARTICLE_LIFETIME_MIN);
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          lifetime,
          maxLifetime: lifetime,
          color,
        });
      }
    },

    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.lifetime -= dt;
        if (p.lifetime <= 0) particles.splice(i, 1);
      }
    },

    render(ctx) {
      ctx.save();
      for (const p of particles) {
        ctx.globalAlpha = p.lifetime / p.maxLifetime;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = p.color;
        ctx.fillStyle   = p.color;
        ctx.fillRect(
          p.x - CONFIG.PARTICLE_SIZE / 2,
          p.y - CONFIG.PARTICLE_SIZE / 2,
          CONFIG.PARTICLE_SIZE,
          CONFIG.PARTICLE_SIZE
        );
      }
      ctx.restore();
    },
  };
}
