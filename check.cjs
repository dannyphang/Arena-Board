const fs = require('fs');

const constantsFile = fs.readFileSync('src/games/ticket-to-ride/constants.ts', 'utf-8');
const coordsFile = fs.readFileSync('src/games/ticket-to-ride/coordinates.ts', 'utf-8');

// Quick regex hack
const routes = constantsFile.match(/city1: CITIES\.([A-Z_]+), city2: CITIES\.([A-Z_]+)/g);
const coords = coordsFile.match(/\[CITIES\.([A-Z_]+)\]:/g);

const definedCoords = new Set(coords.map(c => c.replace('[CITIES.', '').replace(']:', '')));

const missing = new Set();
routes.forEach(r => {
  const [c1, c2] = r.match(/CITIES\.([A-Z_]+)/g).map(c => c.replace('CITIES.', ''));
  if (!definedCoords.has(c1)) missing.add(c1);
  if (!definedCoords.has(c2)) missing.add(c2);
});

console.log("Missing coords for:", Array.from(missing));
