export function createInput() {
  const held = new Set();
  const pressed = new Set();

  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }
    if (!held.has(e.code)) pressed.add(e.code);
    held.add(e.code);
  });

  window.addEventListener('keyup', e => {
    held.delete(e.code);
  });

  return {
    isDown(key)    { return held.has(key); },
    wasPressed(key){ return pressed.has(key); },
    update()       { pressed.clear(); },
  };
}
