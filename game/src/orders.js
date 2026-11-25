// orders.js — customers and their order tickets.
// A ticket is one customer asking for one dish, with a patience budget that
// drains in real time. Serving the matching finished dish pays coins; letting
// patience empty loses the customer and breaks the combo.

import { RECIPES } from './recipes.js';

const FIRST_NAMES = ['Bu Sari', 'Pak Budi', 'Mbak Rina', 'Pak Dedi', 'Bu Tini', 'Mas Arif', 'Bu Wulan', 'Pak Joko'];
const SHIRT_COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261', '#6a4c93', '#2f9e44', '#d6336c'];
const SKIN_TONES = ['#f2c79b', '#e0ac7e', '#c98d5f', '#a96f3f', '#8a5427'];

let ticketSeq = 0;

// Deterministic-ish pick helper (seeded scenes pass their own rng).
export function makeTicket(rng, forcedRecipeId) {
  ticketSeq += 1;
  const recipe = forcedRecipeId
    ? RECIPES.find((r) => r.id === forcedRecipeId)
    : RECIPES[Math.floor(rng() * RECIPES.length)];
  const who = Math.floor(rng() * FIRST_NAMES.length);
  return {
    seq: ticketSeq,
    recipeId: recipe.id,
    dishName: recipe.name,
    price: recipe.price,
    customer: FIRST_NAMES[who],
    shirt: SHIRT_COLORS[who % SHIRT_COLORS.length],
    skin: SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)],
    hair: ['#2b2118', '#4a2f1d', '#15100c', '#5d4037'][Math.floor(rng() * 4)],
    patienceMax: 46 + rng() * 16,
    patience: 0, // set by caller to patienceMax (or a staged fraction)
    served: false,
  };
}

export function newTicket(rng, forcedRecipeId, patienceFraction) {
  const t = makeTicket(rng, forcedRecipeId);
  t.patience = t.patienceMax * (patienceFraction ?? 1);
  return t;
}

// Drain patience; returns the tickets that just walked away angry.
export function tickTickets(tickets, dt) {
  const left = [];
  for (const t of tickets) {
    t.patience -= dt;
    if (t.patience <= 0) left.push(t);
  }
  return left;
}

export function patienceFraction(ticket) {
  return Math.max(0, ticket.patience / ticket.patienceMax);
}
