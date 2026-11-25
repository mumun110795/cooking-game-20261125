// shots.js — deterministic screenshot staging.
// With ?shot=<name>&seed=1 in the URL the game freezes gameplay and composes
// one rich, fixed scene so the maker's screenshots are real renders of the
// game itself, identical on every load. No staging in normal play.

import { newTicket } from './orders.js';
import { RECIPE_BY_ID } from './recipes.js';
import { startCooking } from './kitchen.js';

// Small seeded rng so staged scenes never drift between loads.
export function seededRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function shotNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}

function putCooking(state, recipeId, fraction, done) {
  const recipe = RECIPE_BY_ID[recipeId];
  startCooking(state.stations, recipe);
  const slot = state.stations[recipe.station];
  slot.elapsed = recipe.cookTime * fraction;
  slot.done = !!done;
}

function baseScene(state) {
  state.phase = 'play';
  state.shotMode = true;
  state.score = 1240;
  state.coins = 86;
  state.combo = 3;
  state.servedCount = 9;
  state.timeLeft = 98;
}

// The cover: everything the judge must see, all in one frame.
function stageCover(state, rng) {
  baseScene(state);
  state.tickets = [
    newTicket(rng, 'nasgor', 0.82),
    newTicket(rng, 'sate', 0.64),
    newTicket(rng, 'esteh', 0.91),
  ];
  state.plate = ['nasi', 'telur', 'ayam']; // nasi goreng, mid-assembly
  putCooking(state, 'migor', 0.55, false); // wok busy, timer running
  state.ready = [RECIPE_BY_ID.sate];       // one finished dish on the pass
  state.popups = [{ x: 1132, y: 462, text: 'SIAP SAJI!', t: 1, color: '#2f9e44' }];
}

function stageCook(state, rng) {
  baseScene(state);
  state.score = 860; state.coins = 54; state.combo = 2; state.timeLeft = 121;
  state.tickets = [newTicket(rng, 'nasgor', 0.77), newTicket(rng, 'bakso', 0.88)];
  state.plate = ['mie', 'telur'];
  putCooking(state, 'nasgor', 0.72, false); // wok front and centre, flames up
  putCooking(state, 'sate', 1, true);       // grill finished, waiting
  state.popups = [{ x: 190, y: 440, text: '72% MATANG', t: 1, color: '#e8590c' }];
}

function stagePlate(state, rng) {
  baseScene(state);
  state.score = 1730; state.coins = 128; state.combo = 4; state.timeLeft = 76;
  state.tickets = [newTicket(rng, 'gado', 0.7), newTicket(rng, 'migor', 0.85)];
  state.plate = ['sayur', 'telur', 'bumbu'];
  state.ready = [RECIPE_BY_ID.nasgor, RECIPE_BY_ID.esteh];
  putCooking(state, 'bakso', 0.4, false);
  state.popups = [
    { x: 1132, y: 462, text: '+42 KOIN!', t: 1, color: '#b8860b' },
    { x: 700, y: 300, text: 'KOMBO x4', t: 1, color: '#d6336c' },
  ];
  state.servedFlash = 1;
}

function stageRush(state, rng) {
  baseScene(state);
  state.score = 2210; state.coins = 167; state.combo = 5; state.timeLeft = 23;
  state.tickets = [
    newTicket(rng, 'nasgor', 0.34),
    newTicket(rng, 'migor', 0.22),
    newTicket(rng, 'sate', 0.48),
    newTicket(rng, 'esteh', 0.58),
  ];
  state.plate = ['nasi', 'telur', 'ayam', 'cabai'];
  putCooking(state, 'migor', 0.8, false);
  putCooking(state, 'sate', 0.45, false);
  state.ready = [RECIPE_BY_ID.bakso];
  state.popups = [
    { x: 330, y: 440, text: 'CEPAT!', t: 1, color: '#e63946' },
    { x: 900, y: 440, text: 'KOMBO x5', t: 1, color: '#d6336c' },
  ];
}

export function applyShot(state, name) {
  const rng = seededRng(1);
  if (name === 'cover') stageCover(state, rng);
  else if (name === 'cook') stageCook(state, rng);
  else if (name === 'plate') stagePlate(state, rng);
  else if (name === 'rush') stageRush(state, rng);
  else return false;
  return true;
}
