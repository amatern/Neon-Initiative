import { CONFIG }     from './config.js';
import { createGame }  from './game.js';
import { createInput } from './input.js';

const canvas    = document.getElementById('canvas');
canvas.width    = CONFIG.CANVAS_WIDTH;
canvas.height   = CONFIG.CANVAS_HEIGHT;

const input = createInput();
const game  = createGame(canvas);

let accumulator = 0;
let lastTime    = performance.now();

function loop(now) {
  const rawDt = (now - lastTime) / 1000;
  lastTime    = now;

  // Cap to prevent spiral of death after tab switch / debugger pause
  accumulator += Math.min(rawDt, CONFIG.FIXED_STEP * CONFIG.MAX_STEPS);

  while (accumulator >= CONFIG.FIXED_STEP) {
    game.update(CONFIG.FIXED_STEP, input);
    input.update();
    accumulator -= CONFIG.FIXED_STEP;
  }

  game.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
