// art.js — every pixel of Warung Senja, drawn in code on a 2D canvas.
// Warm warung palette: cream walls, terracotta, teak counters, chalk menu.
// Nothing here loads an image; food, people, steam and signage are shapes.

import { INGREDIENT_BY_ID, RECIPES } from './recipes.js';
import { LAYOUT, binRect, ticketRect, cookFraction } from './kitchen.js';
import { patienceFraction } from './orders.js';

export const COLORS = {
  wall: '#f3dfba', wallLow: '#e8cfa0', floor: '#c98d5f', wood: '#8a5a33',
  woodDark: '#6f4525', teak: '#a06a3b', cream: '#fff8ea', ink: '#33241a',
  red: '#c0392b', green: '#2f9e44', gold: '#e9b949', chalk: '#2e4038',
};

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, bold) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px 'Trebuchet MS', 'Segoe UI', sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---- background: wall, awning stripes, shelf of jars, lamps, menu board ----
export function drawBackground(ctx, state) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, 1280, 474);
  ctx.fillStyle = COLORS.wallLow;
  ctx.fillRect(0, 430, 1280, 44);
  // striped awning along the very top of the wall
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 ? '#c0392b' : '#fff3d6';
    ctx.fillRect(i * 80, 54, 80, 14);
  }
  drawShelf(ctx);
  drawMenuBoard(ctx);
  drawLamps(ctx, state.animT);
  // work area backdrop
  ctx.fillStyle = '#dcb98a';
  ctx.fillRect(0, 474, 1280, 214);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 688, 1280, 112);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 688, 1280, 4);
}

function drawShelf(ctx) {
  const y = 214;
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(24, y + 26, 1232, 8);
  const jars = ['#e63946', '#f6c453', '#5aab4b', '#c97b2d', '#8a5427', '#e07a5f', '#2a9d8f', '#d9a05b', '#b23a48', '#7fb069', '#e9c46a', '#a41623', '#5b2a1e', '#f4a261', '#457b9d', '#6a4c93'];
  for (let i = 0; i < jars.length; i += 1) {
    const x = 44 + i * 76;
    ctx.fillStyle = jars[i];
    roundRect(ctx, x, y - 6, 34, 32, 5); ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x + 4, y - 12, 26, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x + 6, y - 2, 7, 22);
  }
  text(ctx, 'BUMBU • SAMBAL • KECAP • REMPAH', 640, y + 48, 13, '#7a5a38', 'center', true);
}

function drawMenuBoard(ctx) {
  const x = 856, y = 60, w = 408, h = 132;
  ctx.fillStyle = COLORS.woodDark;
  roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 10); ctx.fill();
  ctx.fillStyle = COLORS.chalk;
  roundRect(ctx, x, y, w, h, 6); ctx.fill();
  text(ctx, '— MENU WARUNG SENJA —', x + w / 2, y + 20, 17, '#ffe9a8', 'center', true);
  RECIPES.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const rx = x + 18 + col * 200, ry = y + 48 + row * 28;
    ctx.fillStyle = r.tint;
    ctx.beginPath(); ctx.arc(rx + 7, ry, 7, 0, Math.PI * 2); ctx.fill();
    text(ctx, r.name, rx + 20, ry, 14, '#f5efe0');
    text(ctx, `${r.price} koin`, rx + 168, ry, 13, '#ffe9a8', 'right');
  });
}

function drawLamps(ctx, t) {
  // Pendant lamps over the empty right-hand wall, beside the customers.
  for (const x of [1006, 1186]) {
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 250); ctx.lineTo(x, 282); ctx.stroke();
    const sway = Math.sin(t * 1.4 + x) * 2;
    ctx.fillStyle = '#e9b949';
    ctx.beginPath();
    ctx.moveTo(x - 22 + sway, 308); ctx.lineTo(x + 22 + sway, 308); ctx.lineTo(x + 10 + sway, 282); ctx.lineTo(x - 10 + sway, 282);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,120,0.55)';
    ctx.beginPath(); ctx.arc(x + sway, 316, 14, 0, Math.PI * 2); ctx.fill();
  }
}

// ---- order board + tickets + customers ----
export function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#9c6b30';
  roundRect(ctx, 12, 58, 832, 138, 10); ctx.fill();
  ctx.fillStyle = '#b57f3d';
  roundRect(ctx, 18, 64, 820, 126, 8); ctx.fill();
  text(ctx, 'PAPAN PESANAN', 30, 73, 13, '#ffe9a8', 'left', true);
  state.tickets.forEach((ticket, i) => drawTicket(ctx, ticket, i));
  if (state.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan… pelanggan sedang jalan ke sini!', 428, 140, 17, '#fff3d6', 'center', true);
  }
}

function drawTicket(ctx, ticket, i) {
  const r = ticketRect(i);
  const frac = patienceFraction(ticket);
  ctx.fillStyle = '#fffdf4';
  roundRect(ctx, r.x, r.y + 14, r.w, r.h - 14, 7); ctx.fill();
  ctx.strokeStyle = '#d8c9a3'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 16, 6, 0, Math.PI * 2); ctx.fill();
  text(ctx, ticket.dishName, r.x + r.w / 2, r.y + 38, 17, COLORS.ink, 'center', true);
  text(ctx, ticket.customer, r.x + r.w / 2, r.y + 58, 13, '#7a5a38', 'center');
  text(ctx, `${ticket.price} koin`, r.x + r.w / 2, r.y + 75, 13, '#b8860b', 'center', true);
  // patience bar: green -> amber -> red
  const bw = r.w - 24;
  ctx.fillStyle = '#e5d9bd';
  roundRect(ctx, r.x + 12, r.y + 89, bw, 11, 5); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#2f9e44' : frac > 0.25 ? '#e9a13b' : '#e63946';
  if (frac > 0) { roundRect(ctx, r.x + 12, r.y + 89, bw * frac, 11, 5); ctx.fill(); }
}

export function drawCustomers(ctx, state) {
  state.tickets.forEach((ticket, i) => {
    const r = ticketRect(i);
    const cx = r.x + r.w / 2;
    const bob = Math.sin(state.animT * 2 + i * 1.7) * 2;
    const cy = 316 + bob;
    // body / shirt
    ctx.fillStyle = ticket.shirt;
    roundRect(ctx, cx - 44, cy + 34, 88, 92, 16); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(cx - 44, cy + 62, 88, 10);
    // head
    ctx.fillStyle = ticket.skin;
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    // hair cap
    ctx.fillStyle = ticket.hair;
    ctx.beginPath(); ctx.arc(cx, cy - 8, 34, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    // face
    ctx.fillStyle = '#26221f';
    ctx.beginPath(); ctx.arc(cx - 11, cy + 2, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 11, cy + 2, 3.4, 0, Math.PI * 2); ctx.fill();
    const impatient = patienceFraction(ticket) <= 0.25;
    ctx.strokeStyle = '#26221f'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (impatient) ctx.arc(cx, cy + 24, 9, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(cx, cy + 12, 10, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // speech bubble naming the dish
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx - 62, cy - 78, 124, 30, 9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 48); ctx.lineTo(cx + 8, cy - 48); ctx.lineTo(cx, cy - 36); ctx.closePath(); ctx.fill();
    text(ctx, ticket.dishName, cx, cy - 63, 13, COLORS.ink, 'center', true);
  });
  // counter front the customers stand behind
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(0, 402, 1280, 72);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(0, 402, 1280, 8);
  for (let x = 40; x < 1280; x += 120) ctx.fillRect(x, 414, 5, 52);
  ctx.fillStyle = '#ffe9a8';
  roundRect(ctx, 470, 416, 340, 42, 8); ctx.fill();
  text(ctx, 'WARUNG SENJA • SEJAK 1998', 640, 437, 19, '#6f4525', 'center', true);
}

// ---- chef ----
export function drawChef(ctx, state) {
  const cx = 348, cy = 522 + Math.sin(state.animT * 2.2) * 2;
  ctx.fillStyle = '#f8f4ec'; // apron body
  roundRect(ctx, cx - 34, cy + 26, 68, 96, 12); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(cx - 34, cy + 62, 68, 12);
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(cx, cy, 27, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; // chef hat
  roundRect(ctx, cx - 26, cy - 44, 52, 22, 9); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 14, cy - 40, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 14, cy - 40, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#26221f';
  ctx.beginPath(); ctx.arc(cx - 9, cy + 1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 1, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#26221f'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(cx, cy + 8, 9, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  // raised arm holding a ladle toward the wok
  ctx.strokeStyle = '#f2c79b'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 28, cy + 44); ctx.lineTo(cx - 66, cy + 20); ctx.stroke();
  ctx.strokeStyle = '#7a7a7a'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(cx - 66, cy + 20); ctx.lineTo(cx - 92, cy - 2); ctx.stroke();
  ctx.fillStyle = '#9a9a9a';
  ctx.beginPath(); ctx.ellipse(cx - 97, cy - 6, 10, 6, -0.6, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'KOKI', cx, cy + 100, 11, '#6f4525', 'center', true);
}

// ---- food drawing helpers ----
export function drawIngredientMound(ctx, ingredient, x, y, r) {
  ctx.fillStyle = ingredient.color;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ingredient.edge; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = ingredient.edge;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(x - r * 0.45 + i * r * 0.3, y - 2 + (i % 2) * 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlatedDish(ctx, recipe, x, y, scale, labelColor) {
  const s = scale || 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, 52 * s, 20 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cfd4d8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = recipe.tint;
  ctx.beginPath(); ctx.ellipse(x, y - 6 * s, 40 * s, 15 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5aab4b';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(x - 30 * s + i * 13 * s, y - 14 * s + (i % 2) * 5 * s, 7 * s, 3.4 * s);
  }
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(x + 18 * s, y - 10 * s, 4.4 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - 14 * s, y - 6 * s, 4.4 * s, 0, Math.PI * 2); ctx.fill();
  text(ctx, recipe.name, x, y + 32 * s, 13 * s + 2, labelColor || COLORS.ink, 'center', true);
}

function drawSteam(ctx, x, y, t, amount) {
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < amount; i += 1) {
    const phase = (t * 34 + i * 26) % 78;
    const sx = x + Math.sin((phase + i * 40) * 0.09) * 13 + (i - amount / 2) * 17;
    ctx.globalAlpha = 0.42 * (1 - phase / 78);
    ctx.beginPath(); ctx.arc(sx, y - phase, 8 + phase * 0.16, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFlames(ctx, x, y, t, w) {
  for (let i = 0; i < 7; i += 1) {
    const fx = x - w / 2 + (i + 0.5) * (w / 7);
    const fh = 20 + Math.sin(t * 11 + i * 2.1) * 7;
    ctx.fillStyle = i % 2 ? '#f4842b' : '#e63946';
    ctx.beginPath();
    ctx.moveTo(fx - 9, y); ctx.lineTo(fx, y - fh); ctx.lineTo(fx + 9, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(fx - 4.4, y); ctx.lineTo(fx, y - fh * 0.55); ctx.lineTo(fx + 4.4, y);
    ctx.closePath(); ctx.fill();
  }
}

// ---- stations, plating, pass ----
export function drawStation(ctx, state, key) {
  const r = LAYOUT.stations[key];
  const slot = state.stations[key];
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.fillStyle = '#75604f';
  roundRect(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 9); ctx.fill();
  text(ctx, r.label, r.x + r.w / 2, r.y + 22, 14, '#ffe9a8', 'center', true);
  const cx = r.x + r.w / 2;
  if (key === 'drink') {
    // drink corner: glass dispenser of sweet tea + a cup rail
    ctx.fillStyle = '#a8d8ea';
    roundRect(ctx, cx - 52, r.y + 38, 92, 36, 8); ctx.fill();
    ctx.fillStyle = '#c97b2d';
    ctx.fillRect(cx - 52, r.y + 54, 92, 20);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(cx - 58, r.y + 32, 104, 7);
    if (slot.dish) drawPlatedDish(ctx, slot.dish, cx + 72, r.y + 52, 0.5, '#ffe9a8');
  } else {
    // burner + pan/wok: pan first, flames licking out beneath it
    ctx.fillStyle = '#22252a';
    ctx.beginPath(); ctx.ellipse(cx, r.y + 106, r.w / 2 - 34, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#34383f';
    ctx.beginPath(); ctx.ellipse(cx, r.y + 98, r.w / 2 - 44, 24, 0, 0, Math.PI * 2); ctx.fill();
    if (slot.dish) {
      ctx.fillStyle = slot.dish.tint;
      ctx.beginPath(); ctx.ellipse(cx, r.y + 94, r.w / 2 - 66, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5aab4b';
      for (let i = 0; i < 6; i += 1) ctx.fillRect(cx - 60 + i * 21, r.y + 86 + (i % 2) * 7, 9, 4);
      ctx.fillStyle = '#fff3d6';
      for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.arc(cx - 44 + i * 23, r.y + 95 + (i % 2) * 4, 2.6, 0, Math.PI * 2); ctx.fill(); }
      drawSteam(ctx, cx, r.y + 76, state.animT, 5);
      drawFlames(ctx, cx, r.y + 142, state.animT, r.w - 100);
    } else {
      drawFlames(ctx, cx, r.y + 142, state.animT, r.w - 130);
    }
  }
  if (slot.dish) {
    const frac = cookFraction(slot);
    const label = slot.done ? 'MATANG! KLIK → PASS' : `Memasak ${slot.dish.name}… ${Math.round(frac * 100)}%`;
    text(ctx, label, cx, r.y + (key === 'drink' ? 84 : 156), 13.5, slot.done ? '#7bf1a8' : '#ffffff', 'center', true);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, r.x + 16, r.y + r.h - 14, r.w - 32, 8, 4); ctx.fill();
    ctx.fillStyle = slot.done ? '#2f9e44' : '#e9b949';
    if (frac > 0) { roundRect(ctx, r.x + 16, r.y + r.h - 14, (r.w - 32) * frac, 8, 4); ctx.fill(); }
  } else {
    text(ctx, key === 'drink' ? 'siap seduh' : 'kosong — klik MASAK', cx, r.y + (key === 'drink' ? 84 : 156), 12.5, '#d8c9a3', 'center');
  }
}

export function drawPlating(ctx, state) {
  const x = 352, y = 478, w = 424, h = 196;
  ctx.fillStyle = COLORS.teak;
  roundRect(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = '#b57f3d';
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 9); ctx.fill();
  text(ctx, 'MEJA RACIK — klik bahan di bawah, susun di piring', x + w / 2, y + 22, 14, '#ffe9a8', 'center', true);
  const p = LAYOUT.plate;
  // the plate and its growing stack
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cfd4d8'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 0.68, p.r * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
  state.plate.forEach((id, i) => {
    const ing = INGREDIENT_BY_ID[id];
    drawIngredientMound(ctx, ing, p.x + ((i % 3) - 1) * 26, p.y - 4 - Math.floor(i / 3) * 13, 21);
  });
  if (state.plate.length === 0) text(ctx, 'piring kosong', p.x, p.y, 13, '#9a8a70', 'center');
  // stack chips on the right of the plate
  state.plate.forEach((id, i) => {
    const ing = INGREDIENT_BY_ID[id];
    const cy = y + 52 + i * 19;
    ctx.fillStyle = ing.color;
    roundRect(ctx, 664, cy - 8, 100, 16, 8); ctx.fill();
    ctx.strokeStyle = ing.edge; ctx.lineWidth = 1.4; ctx.stroke();
    text(ctx, ing.name, 714, cy, 11.5, COLORS.ink, 'center', true);
  });
  // hint line: closest recipe
  if (state.hintText) text(ctx, state.hintText, x + w / 2, y + 122, 13, '#fff3d6', 'center', true);
  // buttons
  const cb = LAYOUT.cookButton;
  ctx.fillStyle = state.plate.length ? '#c0392b' : '#8a6a4d';
  roundRect(ctx, cb.x, cb.y, cb.w, cb.h, 10); ctx.fill();
  text(ctx, '🔥 MASAK', cb.x + cb.w / 2, cb.y + cb.h / 2, 17, '#ffffff', 'center', true);
  const tb = LAYOUT.trashButton;
  ctx.fillStyle = '#5d4037';
  roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 10); ctx.fill();
  text(ctx, 'BUANG', tb.x + tb.w / 2, tb.y + tb.h / 2, 15, '#ffe9a8', 'center', true);
}

export function drawPass(ctx, state) {
  const r = LAYOUT.pass;
  ctx.fillStyle = '#274b63';
  roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  text(ctx, 'PASS — SIAP SAJI (klik utk sajikan)', r.x + r.w / 2, r.y + 16, 11.5, '#bfe3ff', 'center', true);
  if (state.ready.length === 0) {
    text(ctx, 'belum ada hidangan', r.x + r.w / 2, r.y + 56, 13, '#8fb6cc', 'center');
  }
  state.ready.slice(0, 2).forEach((dish, i) => {
    drawPlatedDish(ctx, dish, r.x + 58 + i * 108, r.y + 44, 0.72, '#eaf6ff');
  });
}

export function drawBins(ctx, state) {
  const names = ['nasi', 'mie', 'telur', 'ayam', 'daging', 'sayur', 'cabai', 'kecap', 'bumbu', 'teh', 'gula'];
  names.forEach((id, i) => {
    const ing = INGREDIENT_BY_ID[id];
    const r = binRect(i);
    ctx.fillStyle = '#6f4525';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    roundRect(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8); ctx.fill();
    drawIngredientMound(ctx, ing, r.x + r.w / 2, r.y + 36, 27);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 74, 14.5, '#fff3d6', 'center', true);
    text(ctx, `${i + 1}`, r.x + 13, r.y + 15, 11, '#ffe9a8', 'center', true);
  });
}

// ---- HUD, popups, game over ----
export function drawHUD(ctx, state) {
  ctx.fillStyle = '#33241a';
  ctx.fillRect(0, 0, 1280, 54);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(0, 54, 1280, 4);
  text(ctx, '🌅 WARUNG SENJA', 20, 27, 23, '#ffe9a8', 'left', true);
  const pill = (x, label, value, color) => {
    ctx.fillStyle = '#4a3421';
    roundRect(ctx, x, 9, 168, 36, 9); ctx.fill();
    text(ctx, label, x + 12, 27, 13, '#d8c9a3');
    text(ctx, value, x + 156, 27, 18, color, 'right', true);
  };
  pill(300, 'SKOR', `${state.score}`, '#ffffff');
  pill(482, 'KOIN', `${state.coins}`, '#ffd23f');
  pill(664, 'KOMBO', state.combo > 1 ? `x${state.combo}` : '—', '#ff8fab');
  pill(846, 'DILAYANI', `${state.servedCount}`, '#7bf1a8');
  // shift clock
  const urgent = state.timeLeft <= 30;
  ctx.fillStyle = urgent ? '#c0392b' : '#4a3421';
  roundRect(ctx, 1046, 7, 214, 40, 10); ctx.fill();
  text(ctx, `⏰ SHIFT ${formatClock(state.timeLeft)}`, 1153, 27, 21, '#ffffff', 'center', true);
}

export function drawPopups(ctx, state) {
  for (const pop of state.popups) {
    ctx.globalAlpha = Math.min(1, pop.t);
    text(ctx, pop.text, pop.x, pop.y - (1 - pop.t) * 26, 24, pop.color, 'center', true);
    ctx.globalAlpha = 1;
  }
  if (state.servedFlash > 0) {
    ctx.fillStyle = `rgba(255,210,63,${0.12 * state.servedFlash})`;
    ctx.fillRect(0, 0, 1280, 800);
  }
}

export function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(30,18,10,0.78)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#fff8ea';
  roundRect(ctx, 340, 220, 600, 380, 18); ctx.fill();
  text(ctx, 'SHIFT SELESAI! 🌇', 640, 286, 38, '#c0392b', 'center', true);
  text(ctx, `Skor akhir: ${state.score}`, 640, 348, 26, COLORS.ink, 'center', true);
  text(ctx, `Koin terkumpul: ${state.coins}   •   Pelanggan dilayani: ${state.servedCount}`, 640, 392, 19, '#6f4525', 'center');
  text(ctx, state.score >= 1500 ? 'Warung ramai sekali hari ini. Kerja bagus, Koki!' : 'Besok pasti lebih ramai. Tetap semangat, Koki!', 640, 434, 16, '#7a5a38', 'center');
  const b = LAYOUT.restartButton;
  ctx.fillStyle = '#2f9e44';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'MAIN LAGI', b.x + b.w / 2, b.y + b.h / 2, 22, '#ffffff', 'center', true);
}

// Master scene painter: background -> board -> people -> work area -> HUD.
export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, 1280, 800);
  drawBackground(ctx, state);
  drawOrderBoard(ctx, state);
  drawCustomers(ctx, state);
  drawStation(ctx, state, 'wok');
  drawPlating(ctx, state);
  drawChef(ctx, state);
  drawStation(ctx, state, 'grill');
  drawStation(ctx, state, 'drink');
  drawPass(ctx, state);
  drawBins(ctx, state);
  drawHUD(ctx, state);
  drawPopups(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}
