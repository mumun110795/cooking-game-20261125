// recipes.js — the menu of Warung Senja: ingredient bins and dish recipes.
// Every dish is an exact stack of ingredients (order on the plate does not
// matter), a cooking station, a cook time and a price in coins.

export const INGREDIENTS = [
  { id: 'nasi',  name: 'Nasi',   color: '#fdf6e3', edge: '#d9c9a3' },
  { id: 'mie',   name: 'Mie',    color: '#f6c453', edge: '#c98f1b' },
  { id: 'telur', name: 'Telur',  color: '#ffb703', edge: '#d97706' },
  { id: 'ayam',  name: 'Ayam',   color: '#e07a5f', edge: '#b5502f' },
  { id: 'daging', name: 'Daging', color: '#b23a48', edge: '#7f1d2d' },
  { id: 'sayur', name: 'Sayur',  color: '#5aab4b', edge: '#35702a' },
  { id: 'cabai', name: 'Cabai',  color: '#e63946', edge: '#a41623' },
  { id: 'kecap', name: 'Kecap',  color: '#5b2a1e', edge: '#33150d' },
  { id: 'bumbu', name: 'Bumbu',  color: '#d9a05b', edge: '#a96f2c' },
  { id: 'teh',   name: 'Teh',    color: '#c97b2d', edge: '#8f5216' },
  { id: 'gula',  name: 'Gula',   color: '#ffffff', edge: '#cfd4d8' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

export const RECIPES = [
  { id: 'nasgor', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'ayam', 'cabai', 'kecap'], station: 'wok',   cookTime: 4.0, price: 42, tint: '#e07a5f' },
  { id: 'migor',  name: 'Mie Goreng',  needs: ['mie', 'telur', 'sayur', 'kecap'],          station: 'wok',   cookTime: 3.6, price: 36, tint: '#f6c453' },
  { id: 'sate',   name: 'Sate Ayam',   needs: ['ayam', 'bumbu', 'cabai'],                   station: 'grill', cookTime: 5.0, price: 48, tint: '#b5502f' },
  { id: 'bakso',  name: 'Bakso Sapi',  needs: ['daging', 'mie', 'sayur'],                   station: 'grill', cookTime: 3.4, price: 34, tint: '#b23a48' },
  { id: 'gado',   name: 'Gado-Gado',   needs: ['sayur', 'telur', 'bumbu'],                   station: 'wok',   cookTime: 2.6, price: 30, tint: '#5aab4b' },
  { id: 'esteh',  name: 'Es Teh Manis', needs: ['teh', 'gula'],                              station: 'drink', cookTime: 1.4, price: 14, tint: '#c97b2d' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Find the recipe whose ingredient multiset equals the plate's stack.
export function matchRecipe(stackIds) {
  const sorted = [...stackIds].sort().join(',');
  for (const recipe of RECIPES) {
    if ([...recipe.needs].sort().join(',') === sorted) return recipe;
  }
  return null;
}

// How close a partial stack is to a recipe: returns the best recipe and how
// many of its ingredients are already on the plate (for the hint line).
export function bestPartialMatch(stackIds) {
  let best = null;
  let bestCount = -1;
  for (const recipe of RECIPES) {
    const pool = [...stackIds];
    let count = 0;
    for (const need of recipe.needs) {
      const at = pool.indexOf(need);
      if (at >= 0) { pool.splice(at, 1); count += 1; }
    }
    if (pool.length === 0 && count > bestCount) { best = recipe; bestCount = count; }
  }
  return best ? { recipe: best, have: bestCount, total: best.needs.length } : null;
}
