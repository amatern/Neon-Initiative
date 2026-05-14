import { CONFIG } from './config.js';

export const SEAL_DATA = {
  3: {
    name:    'SEAL OF FIRE',
    color:   '#ff3300',
    glow:    '#ff6600',
    narrator: {
      start:   ['Crimson Peak burns.', 'The Seal of Fire is yours to defend.'],
      victory: ['The Seal of Fire holds.', "The dragon's body stays bound in stone."],
      defeat:  ['The Ruby goes dark.', 'Infernadax flexes against his chains.'],
    },
  },
  8: {
    name:    'SEAL OF THE DEEP',
    color:   '#0077cc',
    glow:    '#44aaff',
    narrator: {
      start:   ['Thessalmar floods the Weeping Depths.', 'Guard the Sapphire.'],
      victory: ['The Seal of the Deep holds.', 'Infernadax bleeds and cannot heal.'],
      defeat:  ['The Sapphire drowns.', "The dragon's wounds begin to close."],
    },
  },
  13: {
    name:    'SEAL OF STORM',
    color:   '#ffdd00',
    glow:    '#aaeeff',
    narrator: {
      start:   ['Silvaclaw circles Stormcrest Spire.', 'Hold the Topaz.'],
      victory: ['The Seal of Storm holds.', 'Infernadax stays grounded in the dark.'],
      defeat:  ['The Topaz falls silent.', 'The dragon remembers his wings.'],
    },
  },
  18: {
    name:    'SEAL OF DAWN',
    color:   '#ffd700',
    glow:    '#ffffff',
    narrator: {
      start:   ['Vexmire poisons the Radiant Temple.', 'Shield the Diamond.'],
      victory: ['The Seal of Dawn holds.', "The dragon's fear stays caged in light."],
      defeat:  ['The Diamond turns grey.', "The dragon's terror spills across the coast."],
    },
  },
  23: {
    name:    'SEAL OF SHADOW',
    color:   '#aa44ff',
    glow:    '#00ff88',
    narrator: {
      start:   ['Nyx coils in the Umbral Vault.', 'Guard the last Seal — and what it hides.'],
      victory: ['The Seal of Shadow holds.', 'All five endure — now hunt the phylactery.'],
      defeat:  ['The Emerald goes black.', 'His magic wakes, and his hidden heart beats on.'],
    },
  },
};

export function getSealData(wave) {
  return SEAL_DATA[wave] ?? null;
}

export function isSealWave(wave) {
  return wave % 5 === 3 && wave <= 23;
}
