// main.js — Warung Senja game loop and state.
// Loop: tickets arrive -> stack ingredients on the plate -> MASAK sends the
// matched dish to its station -> click the finished station to move it to
// the pass -> click the pass (or the ticket) to serve -> coins, score and
// combo. The shift lasts 150 seconds; then the day ends and can restart.

import { INGREDIENTS, matchRecipe, bestPartialMatch } from './recipes.js';
import { newTicket, tickTickets } from './orders.js';
import { emptyStations, startCooking, tickStations } from './kitchen.js';
import { drawScene } from './art.js';
import { sfx } from './audio.js';
import { bindInput } from './input.js';
import { applyShot, shotNameFromUrl, seededRng } from './shots.js';

const SHIFT_SECONDS = 150;
const MAX_TICKETS = 4;
const MAX_PLATE = 6;

export function createState(rng) {
  return {
    phase: 'play',
    shotMode: false,
    animT: 0,
    score: 0,
    coins: 0,
    combo: 0,
    servedCount: 0,
    timeLeft: SHIFT_SECONDS,
    tickets: [],
    plate: [],
    stations: emptyStations(),
    ready: [],
    popups: [],
    servedFlash: 0,
    hintText: '',
    spawnIn: 1.2,
    rng: rng || Math.random,
  };
}

const state = createState(Math.random);
window.__warungState = state;

function addPopup(x, y, text, color) {
  state.popups.push({ x, y, text, t: 1.6, color });
}

function refreshHint() {
  if (state.plate.length === 0) { state.hintText = ''; return; }
  const exact = matchRecipe(state.plate);
  if (exact) { state.hintText = `Pas! Ini ${exact.name} — klik MASAK`; return; }
  const partial = bestPartialMatch(state.plate);
  state.hintText = partial
    ? `${partial.recipe.name}: ${partial.have}/${partial.total} bahan di piring`
    : 'Kombinasi ini tidak ada di menu — BUANG dan coba lagi';
}

function spawnTicket(fraction) {
  if (state.tickets.length >= MAX_TICKETS) return;
  state.tickets.push(newTicket(state.rng, undefined, fraction));
}

function serveDish(dish) {
  const at = state.tickets.findIndex((t) => t.recipeId === dish.id);
  if (at < 0) {
    addPopup(1132, 560, 'Tidak ada pesanan!', '#e63946');
    sfx.fail();
    return false;
  }
  const ticket = state.tickets[at];
  state.tickets.splice(at, 1);
  state.combo += 1;
  const patienceBonus = Math.round(20 * Math.max(0, ticket.patience / ticket.patienceMax));
  const comboBonus = Math.min(30, (state.combo - 1) * 6);
  const gained = dish.price + patienceBonus + comboBonus;
  state.coins += dish.price;
  state.score += gained * 10;
  state.servedCount += 1;
  state.servedFlash = 1;
  addPopup(1132, 540, `+${gained} KOIN!`, '#b8860b');
  if (state.combo >= 2) addPopup(640, 430, `KOMBO x${state.combo}!`, '#d6336c');
  sfx.serve(); sfx.coin();
  spawnTicket(1);
  return true;
}

export function handleAction(action) {
  if (!action) return;
  if (action.type === 'restart') {
    const fresh = createState(state.rng);
    Object.assign(state, fresh);
    spawnTicket(1); spawnTicket(0.95);
    return;
  }
  if (state.phase !== 'play') return;

  if (action.type === 'bin') {
    if (state.plate.length >= MAX_PLATE) { addPopup(548, 440, 'Piring penuh!', '#e63946'); return; }
    state.plate.push(INGREDIENTS[action.index].id);
    sfx.add();
    refreshHint();
  } else if (action.type === 'trash') {
    if (state.plate.length) { state.plate = []; sfx.trash(); refreshHint(); }
  } else if (action.type === 'cook') {
    const recipe = matchRecipe(state.plate);
    if (!recipe) { addPopup(548, 440, 'Belum pas resepnya!', '#e63946'); sfx.fail(); return; }
    if (!startCooking(state.stations, recipe)) { addPopup(548, 440, 'Stasiun sibuk!', '#e63946'); sfx.fail(); return; }
    state.plate = [];
    refreshHint();
    sfx.cook();
  } else if (action.type === 'station') {
    const slot = state.stations[action.station];
    if (slot.dish && slot.done) {
      state.ready.push(slot.dish);
      slot.dish = null; slot.elapsed = 0; slot.done = false;
      addPopup(1132, 560, 'Ke PASS!', '#2f9e44');
      sfx.ready();
    } else if (slot.dish) {
      addPopup(400, 440, 'Masih memasak…', '#e8590c');
    }
  } else if (action.type === 'pass') {
    if (state.ready.length) {
      const dish = state.ready[0];
      if (serveDish(dish)) state.ready.shift();
    }
  } else if (action.type === 'ticket') {
    const ticket = state.tickets[action.index];
    if (!ticket) return;
    const at = state.ready.findIndex((d) => d.id === ticket.recipeId);
    if (at >= 0) { const [dish] = state.ready.splice(at, 1); serveDish(dish); }
    else addPopup(400, 250, 'Hidangan belum siap!', '#e63946');
  }
}

function update(dt) {
  state.animT += dt;
  if (!state.shotMode) {
    for (const pop of state.popups) pop.t -= dt * 0.7;
    state.popups = state.popups.filter((p) => p.t > 0);
    if (state.servedFlash > 0) state.servedFlash = Math.max(0, state.servedFlash - dt * 1.4);
  }
  if (state.shotMode || state.phase !== 'play') return;

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) { state.timeLeft = 0; state.phase = 'over'; return; }

  state.spawnIn -= dt;
  if (state.spawnIn <= 0) { spawnTicket(1); state.spawnIn = 6 + state.rng() * 4; }

  const left = tickTickets(state.tickets, dt);
  if (left.length) {
    state.tickets = state.tickets.filter((t) => t.patience > 0);
    state.combo = 0;
    addPopup(300, 250, 'Pelanggan pergi! 😠', '#e63946');
    sfx.fail();
  }
  const finished = tickStations(state.stations, dt);
  if (finished.length) sfx.ready();
}

// ---- boot ----
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const shot = shotNameFromUrl();
if (shot) {
  state.rng = seededRng(1);
  if (applyShot(state, shot)) refreshHint();
} else {
  spawnTicket(1);
  spawnTicket(0.92);
  refreshHint();
}

bindInput(canvas, handleAction);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  drawScene(ctx, state);
  if (statusEl) {
    statusEl.textContent = `Warung Senja. Skor ${state.score}, koin ${state.coins}, sisa shift ${Math.ceil(state.timeLeft)} detik, ${state.tickets.length} pesanan menunggu.`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
