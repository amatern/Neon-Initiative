let jonasActive = false;
let chadActive  = false;
let keyBuffer   = '';

const DM_TIPS = [
  "Never split the party.",
  "When in doubt, add more goblins.",
  "A nat 20 on Persuasion can solve almost anything.",
  "Every villain thinks they're the hero of their own story.",
  "Your players remember the NPCs you name, not the ones you planned.",
  "Rule of cool beats rule as written. Usually.",
  "A dungeon without traps is just a corridor.",
  "If the fighter rolls a nat 1, something interesting should happen.",
  "Prep situations, not scripts.",
  "The best sessions end with everyone wanting more.",
  "The map is not the territory. The territory has more wolves.",
  "Describe what the character senses, not what the player sees.",
  "Let the dice tell the story sometimes.",
  "A well-placed secret door beats a locked one.",
  "The monsters have feelings too. Except the skeletons.",
];

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

  getPauseTip() {
    return Math.random() < 0.2 ? DM_TIPS[Math.floor(Math.random() * DM_TIPS.length)] : null;
  },

  onWaveStart(_wave) {},
  onPlayerShoot()    { return null; },
};
