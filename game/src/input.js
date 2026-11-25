// input.js — mouse (and a little keyboard) input, translated to game actions.
// Canvas coordinates are fixed at 1280x800; the canvas element is scaled by
// CSS, so pointer positions are mapped back into game space here.

import { LAYOUT, VIEW_W, VIEW_H, binRect, ticketRect } from './kitchen.js';
import { INGREDIENTS } from './recipes.js';

export function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Work out what a click means. Returns an action object for main.js, or null.
// Order matters: overlays first, then stations/pass, tickets, buttons, bins.
export function pickAction(state, x, y) {
  if (state.phase === 'over') {
    if (pointInRect(x, y, LAYOUT.restartButton)) return { type: 'restart' };
    return null;
  }
  if (state.phase !== 'play') return null;

  for (const key of Object.keys(LAYOUT.stations)) {
    if (pointInRect(x, y, LAYOUT.stations[key])) return { type: 'station', station: key };
  }
  if (pointInRect(x, y, LAYOUT.pass)) return { type: 'pass' };
  for (let i = 0; i < state.tickets.length; i += 1) {
    if (pointInRect(x, y, ticketRect(i))) return { type: 'ticket', index: i };
  }
  if (pointInRect(x, y, LAYOUT.cookButton)) return { type: 'cook' };
  if (pointInRect(x, y, LAYOUT.trashButton)) return { type: 'trash' };
  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    if (pointInRect(x, y, binRect(i))) return { type: 'bin', index: i };
  }
  return null;
}

export function bindInput(canvas, onAction) {
  canvas.addEventListener('pointerdown', (ev) => {
    const p = toGameCoords(canvas, ev.clientX, ev.clientY);
    const action = pickAction(window.__warungState, p.x, p.y);
    if (action) onAction(action);
  });
  window.addEventListener('keydown', (ev) => {
    const state = window.__warungState;
    if (!state) return;
    if (ev.key === 'Enter' && state.phase === 'over') onAction({ type: 'restart' });
    if (ev.key === 'c' || ev.key === 'C') onAction({ type: 'cook' });
    if (ev.key === 'Backspace') { ev.preventDefault(); onAction({ type: 'trash' }); }
    const n = parseInt(ev.key, 10);
    if (n >= 1 && n <= INGREDIENTS.length) onAction({ type: 'bin', index: n - 1 });
  });
}
