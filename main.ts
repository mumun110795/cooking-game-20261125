// Warung Senja — hand-in program.
//
// The game itself is a folder of plain static files sitting next to this
// file (game/), plus a handful of JPEG screenshots (screenshots/). This
// program's only job is to deliver them: copy both folders into the output
// directory and drop a dossier.json beside them, built with the vendored
// make.fun library so the grader can rebuild it and compare byte for byte.
//
// Where the output goes: MAKEFUN_OUTPUT_DIR when set, otherwise /output.
// The output directory is treated as a mounted volume on the grader, so we
// create it if needed and copy into it — we never remove the directory
// itself, only fill it.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Folder this file lives in; game/ and screenshots/ sit beside it.
const rootDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the destination exists, then mirror the two payload folders in.
mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  cpSync(join(rootDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier describes exactly what was just copied. The caps below are the
// scorer's own limits: dossier text budget, at most four screenshots of
// 256 KiB each, and the game folder's file/byte ceilings.
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
