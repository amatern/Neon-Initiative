let jonasActive = false;
let chadActive  = false;
let keyBuffer   = '';

// Listener always accumulates keypresses; activation only happens in checkTitleScreenCode(),
// which game.js calls exclusively from the title-state block.
window.addEventListener('keydown', e => {
  if (e.key.length === 1) {
    keyBuffer = (keyBuffer + e.key.toUpperCase()).slice(-10);
  }
});

export const easterEggs = {
  get jonasActive() { return jonasActive; },
  get chadActive()  { return chadActive;  },

  checkTitleScreenCode() {
    if (keyBuffer.includes('JONAS')) { jonasActive = true; keyBuffer = ''; }
    if (keyBuffer.includes('CHAD'))  { chadActive  = true; keyBuffer = ''; }
  },

  // Returns {roll: 1–20}. Called by game.js on every bullet hit when chadActive.
  rollForHit() {
    return { roll: Math.floor(Math.random() * 20) + 1 };
  },

  onWaveStart(_wave) {},
  onPlayerShoot()    { return null; },
};
