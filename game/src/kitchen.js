// kitchen.js — screen layout constants and the cooking stations' state.
// The wok and the grill each hold one dish at a time; the drink corner is a
// third, faster slot. A dish cooks over cookTime seconds, then waits in the
// station until the player clicks it onto the serving pass.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// Clickable layout shared by the renderer (art.js) and input (input.js).
export const LAYOUT = {
  binsY: 692,
  binsH: 96,
  binW: 104,
  binGap: 9,
  binX0: 22,
  cookButton: { x: 462, y: 624, w: 150, h: 42 },
  trashButton: { x: 628, y: 624, w: 118, h: 42 },
  plate: { x: 548, y: 538, r: 76 },
  stations: {
    wok:   { x: 36,  y: 478, w: 300, h: 196, label: 'WOK' },
    grill: { x: 788, y: 478, w: 216, h: 196, label: 'PANGGANG' },
    drink: { x: 1020, y: 478, w: 224, h: 100, label: 'ES TEH' },
  },
  pass: { x: 1020, y: 590, w: 224, h: 84 },
  ticketX0: 22,
  ticketY: 82,
  ticketW: 196,
  ticketH: 106,
  ticketGap: 10,
  restartButton: { x: 490, y: 500, w: 300, h: 64 },
};

export function binRect(index) {
  return { x: LAYOUT.binX0 + index * (LAYOUT.binW + LAYOUT.binGap), y: LAYOUT.binsY, w: LAYOUT.binW, h: LAYOUT.binsH };
}

export function ticketRect(index) {
  return { x: LAYOUT.ticketX0 + index * (LAYOUT.ticketW + LAYOUT.ticketGap), y: LAYOUT.ticketY, w: LAYOUT.ticketW, h: LAYOUT.ticketH };
}

export function emptyStations() {
  return {
    wok:   { dish: null, elapsed: 0, done: false },
    grill: { dish: null, elapsed: 0, done: false },
    drink: { dish: null, elapsed: 0, done: false },
  };
}

// Start cooking a matched recipe in its station if that station is free.
export function startCooking(stations, recipe) {
  const slot = stations[recipe.station];
  if (!slot || slot.dish) return false;
  slot.dish = recipe;
  slot.elapsed = 0;
  slot.done = false;
  return true;
}

// Advance every busy station; returns the station keys that finished now.
export function tickStations(stations, dt) {
  const finished = [];
  for (const key of Object.keys(stations)) {
    const slot = stations[key];
    if (slot.dish && !slot.done) {
      slot.elapsed += dt;
      if (slot.elapsed >= slot.dish.cookTime) { slot.done = true; finished.push(key); }
    }
  }
  return finished;
}

export function cookFraction(slot) {
  if (!slot.dish) return 0;
  return Math.min(1, slot.elapsed / slot.dish.cookTime);
}
