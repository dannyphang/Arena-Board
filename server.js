// server/src/index.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";

// src/games/genius-square/constants.ts
var GRID_SIZE = 6;
var COL_LETTERS = ["A", "B", "C", "D", "E", "F"];
var GENIUS_SQUARE_DICE = [
  // Die 1 (6 faces)
  ["A1", "C1", "D1", "D2", "E2", "F3"],
  // Die 2 (6 faces)
  ["B1", "C2", "C3", "D3", "E3", "F1"],
  // Die 3 (6 faces)
  ["A2", "B2", "B3", "A3", "E1", "F2"],
  // Die 4 (6 faces)
  ["B4", "C4", "D4", "D5", "E4", "E5"],
  // Die 5 (6 faces)
  ["A4", "B5", "C6", "D6", "F6", "F5"],
  // Die 6 (4 distinct values)
  ["A5", "B6", "F4", "A6"],
  // Die 7 (2 distinct values)
  ["C5", "E6"]
];
function stringToCoord(str) {
  const colChar = str.charAt(0).toUpperCase();
  const rowChar = str.charAt(1);
  const c = COL_LETTERS.indexOf(colChar);
  const r = parseInt(rowChar, 10) - 1;
  return [Math.max(0, Math.min(5, r)), Math.max(0, Math.min(5, c))];
}
var PIECES = {
  monomino: {
    id: "monomino",
    name: "1-Square (Monomino)",
    size: 1,
    color: "#8D6E63",
    // Warm Earth Brown
    hoverColor: "#A1887F",
    borderColor: "#5D4037",
    defaultShape: [[0, 0]]
  },
  domino: {
    id: "domino",
    name: "2-Bar (Domino)",
    size: 2,
    color: "#F97316",
    // Vibrant Orange
    hoverColor: "#FB923C",
    borderColor: "#C2410C",
    defaultShape: [
      [0, 0],
      [0, 1]
    ]
  },
  straight_3: {
    id: "straight_3",
    name: "3-Line (Tromino I)",
    size: 3,
    color: "#EAB308",
    // Amber Gold
    hoverColor: "#FACC15",
    borderColor: "#A16207",
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2]
    ]
  },
  corner_3: {
    id: "corner_3",
    name: "3-Corner (Tromino L)",
    size: 3,
    color: "#06B6D4",
    // Cyan
    hoverColor: "#22D3EE",
    borderColor: "#0E7490",
    defaultShape: [
      [0, 0],
      [1, 0],
      [1, 1]
    ]
  },
  straight_4: {
    id: "straight_4",
    name: "4-Line (Tetromino I)",
    size: 4,
    color: "#3B82F6",
    // Royal Blue
    hoverColor: "#60A5FA",
    borderColor: "#1D4ED8",
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3]
    ]
  },
  L_4: {
    id: "L_4",
    name: "4-L (Tetromino L)",
    size: 4,
    color: "#A855F7",
    // Magenta / Purple
    hoverColor: "#C084FC",
    borderColor: "#7E22CE",
    defaultShape: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ]
  },
  square_4: {
    id: "square_4",
    name: "4-Square (Tetromino O)",
    size: 4,
    color: "#22C55E",
    // Emerald Green
    hoverColor: "#4ADE80",
    borderColor: "#15803D",
    defaultShape: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ]
  },
  T_4: {
    id: "T_4",
    name: "4-T (Tetromino T)",
    size: 4,
    color: "#EF4444",
    // Crimson Red
    hoverColor: "#F87171",
    borderColor: "#B91C1C",
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1]
    ]
  },
  Z_4: {
    id: "Z_4",
    name: "4-Z (Tetromino Z)",
    size: 4,
    color: "#6366F1",
    // Indigo / Slate
    hoverColor: "#818CF8",
    borderColor: "#4338CA",
    defaultShape: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2]
    ]
  }
};
var ALL_PIECE_IDS = [
  "monomino",
  "domino",
  "straight_3",
  "corner_3",
  "straight_4",
  "L_4",
  "square_4",
  "T_4",
  "Z_4"
];

// src/games/genius-square/solver.ts
function getUniqueOrientations(pieceId) {
  const baseShape = PIECES[pieceId].defaultShape;
  const orientations = [];
  const seenSignatures = /* @__PURE__ */ new Set();
  const rotate90 = (coords) => coords.map(([r, c]) => [c, -r]);
  const flipH = (coords) => coords.map(([r, c]) => [r, -c]);
  const normalize = (coords) => {
    let minR = Infinity;
    let minC = Infinity;
    for (const [r, c] of coords) {
      if (r < minR) minR = r;
      if (c < minC) minC = c;
    }
    const shifted = coords.map(([r, c]) => [r - minR, c - minC]);
    shifted.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return shifted;
  };
  const getSignature = (coords) => coords.map(([r, c]) => `${r},${c}`).join(";");
  let current = baseShape;
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      const norm = normalize(current);
      const sig = getSignature(norm);
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        let maxR = 0;
        let maxC = 0;
        for (const [r, c] of norm) {
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
        orientations.push({
          pieceId,
          orientationIndex: orientations.length,
          shape: norm,
          rows: maxR + 1,
          cols: maxC + 1
        });
      }
      current = rotate90(current);
    }
    current = flipH(baseShape);
  }
  return orientations;
}
var ALL_ORIENTATIONS = {
  monomino: getUniqueOrientations("monomino"),
  domino: getUniqueOrientations("domino"),
  straight_3: getUniqueOrientations("straight_3"),
  corner_3: getUniqueOrientations("corner_3"),
  straight_4: getUniqueOrientations("straight_4"),
  L_4: getUniqueOrientations("L_4"),
  square_4: getUniqueOrientations("square_4"),
  T_4: getUniqueOrientations("T_4"),
  Z_4: getUniqueOrientations("Z_4")
};
var ALL_PLACEMENTS = [];
var PLACEMENTS_BY_CELL = Array.from({ length: 36 }, () => []);
for (const pieceId of ALL_PIECE_IDS) {
  const oris = ALL_ORIENTATIONS[pieceId];
  for (const ori of oris) {
    for (let r = 0; r <= GRID_SIZE - ori.rows; r++) {
      for (let c = 0; c <= GRID_SIZE - ori.cols; c++) {
        const coords = ori.shape.map(([dr, dc]) => [r + dr, c + dc]);
        let mask = 0n;
        for (const [cr, cc] of coords) {
          const idx = cr * GRID_SIZE + cc;
          mask |= 1n << BigInt(idx);
        }
        const item = {
          pieceId,
          orientationIndex: ori.orientationIndex,
          row: r,
          col: c,
          coords,
          mask
        };
        ALL_PLACEMENTS.push(item);
        for (const [cr, cc] of coords) {
          const idx = cr * GRID_SIZE + cc;
          PLACEMENTS_BY_CELL[idx].push(item);
        }
      }
    }
  }
}
function rollGeniusSquareDice() {
  return GENIUS_SQUARE_DICE.map((die) => {
    const idx = Math.floor(Math.random() * die.length);
    return die[idx];
  });
}
function blockersToMask(blockers) {
  let mask = 0n;
  for (const b of blockers) {
    let r, c;
    if (typeof b === "string") {
      [r, c] = stringToCoord(b);
    } else {
      [r, c] = b;
    }
    const idx = r * GRID_SIZE + c;
    mask |= 1n << BigInt(idx);
  }
  return mask;
}
function solveGeniusSquare(blockers, prePlacedPieces = [], findMultiple = false) {
  const initialBlockerMask = blockersToMask(blockers);
  let currentMask = initialBlockerMask;
  const usedPieces = /* @__PURE__ */ new Set();
  const currentPlacements = [];
  for (const p of prePlacedPieces) {
    usedPieces.add(p.pieceId);
    currentPlacements.push(p);
    for (const [r, c] of p.coords) {
      const idx = r * GRID_SIZE + c;
      const bit = 1n << BigInt(idx);
      if ((currentMask & bit) !== 0n) {
        return { solved: false, solution: null };
      }
      currentMask |= bit;
    }
  }
  let finalSolution = null;
  let solutionsCount = 0;
  function search(mask) {
    if (usedPieces.size === ALL_PIECE_IDS.length) {
      finalSolution = [...currentPlacements];
      solutionsCount++;
      return !findMultiple;
    }
    let targetCell = -1;
    for (let i = 0; i < 36; i++) {
      if ((mask & 1n << BigInt(i)) === 0n) {
        targetCell = i;
        break;
      }
    }
    if (targetCell === -1) return false;
    const candidates = PLACEMENTS_BY_CELL[targetCell];
    for (const cand of candidates) {
      if (usedPieces.has(cand.pieceId)) continue;
      if ((mask & cand.mask) !== 0n) continue;
      usedPieces.add(cand.pieceId);
      currentPlacements.push({
        pieceId: cand.pieceId,
        orientationIndex: cand.orientationIndex,
        row: cand.row,
        col: cand.col,
        coords: cand.coords
      });
      const nextMask = mask | cand.mask;
      const success2 = search(nextMask);
      if (success2 && !findMultiple) return true;
      usedPieces.delete(cand.pieceId);
      currentPlacements.pop();
    }
    return false;
  }
  const success = search(currentMask);
  return {
    solved: success || finalSolution !== null,
    solution: finalSolution,
    totalSolutionsFound: solutionsCount
  };
}

// src/games/mr-jack/topology.ts
var WHITECHAPEL_HEXES = [
  {
    "id": 0,
    "col": 0,
    "row": 0,
    "cx": 60,
    "cy": 251.5,
    "points": "40.0,215.0 80.0,215.0 102.0,251.5 80.0,288.0 40.0,288.0 18.0,251.5",
    "connectedTo": [
      -1,
      1,
      -1,
      -1,
      6,
      7
    ]
  },
  {
    "id": 1,
    "col": 0,
    "row": 1,
    "cx": 60,
    "cy": 325.5,
    "points": "40.0,289.0 80.0,289.0 102.0,325.5 80.0,362.0 40.0,362.0 18.0,325.5",
    "connectedTo": [
      0,
      2,
      -1,
      -1,
      7,
      8
    ]
  },
  {
    "id": 2,
    "col": 0,
    "row": 2,
    "cx": 60,
    "cy": 399.5,
    "points": "40.0,363.0 80.0,363.0 102.0,399.5 80.0,436.0 40.0,436.0 18.0,399.5",
    "connectedTo": [
      1,
      3,
      -1,
      -1,
      8,
      9
    ]
  },
  {
    "id": 3,
    "col": 0,
    "row": 3,
    "cx": 60,
    "cy": 473.5,
    "points": "40.0,437.0 80.0,437.0 102.0,473.5 80.0,510.0 40.0,510.0 18.0,473.5",
    "connectedTo": [
      2,
      4,
      -1,
      -1,
      9,
      10
    ]
  },
  {
    "id": 4,
    "col": 0,
    "row": 4,
    "cx": 60,
    "cy": 547.5,
    "points": "40.0,511.0 80.0,511.0 102.0,547.5 80.0,584.0 40.0,584.0 18.0,547.5",
    "connectedTo": [
      3,
      -1,
      -1,
      -1,
      10,
      11
    ]
  },
  {
    "id": 5,
    "col": 1,
    "row": 0,
    "cx": 121.5,
    "cy": 139.5,
    "points": "101.0,103.0 142.0,103.0 162.0,139.5 142.0,176.0 101.0,176.0 81.0,139.5",
    "connectedTo": [
      -1,
      6,
      -1,
      -1,
      -1,
      12
    ]
  },
  {
    "id": 6,
    "col": 1,
    "row": 1,
    "cx": 121.5,
    "cy": 213.5,
    "points": "101.0,177.0 142.0,177.0 162.0,213.5 142.0,250.0 101.0,250.0 81.0,213.5",
    "connectedTo": [
      5,
      7,
      -1,
      0,
      12,
      13
    ]
  },
  {
    "id": 7,
    "col": 1,
    "row": 2,
    "cx": 121.5,
    "cy": 287.5,
    "points": "101.0,251.0 142.0,251.0 162.0,287.5 142.0,324.0 101.0,324.0 81.0,287.5",
    "connectedTo": [
      6,
      8,
      0,
      1,
      13,
      14
    ]
  },
  {
    "id": 8,
    "col": 1,
    "row": 3,
    "cx": 121.5,
    "cy": 361.5,
    "points": "101.0,325.0 142.0,325.0 162.0,361.5 142.0,398.0 101.0,398.0 81.0,361.5",
    "connectedTo": [
      7,
      9,
      1,
      2,
      14,
      15
    ]
  },
  {
    "id": 9,
    "col": 1,
    "row": 4,
    "cx": 121.5,
    "cy": 435.5,
    "points": "101.0,399.0 142.0,399.0 162.0,435.5 142.0,472.0 101.0,472.0 81.0,435.5",
    "connectedTo": [
      8,
      10,
      2,
      3,
      15,
      16
    ]
  },
  {
    "id": 10,
    "col": 1,
    "row": 5,
    "cx": 121.5,
    "cy": 509.5,
    "points": "101.0,473.0 142.0,473.0 162.0,509.5 142.0,546.0 101.0,546.0 81.0,509.5",
    "connectedTo": [
      9,
      11,
      3,
      4,
      16,
      17
    ]
  },
  {
    "id": 11,
    "col": 1,
    "row": 6,
    "cx": 121.5,
    "cy": 583.5,
    "points": "101.0,547.0 142.0,547.0 162.0,583.5 142.0,620.0 101.0,620.0 81.0,583.5",
    "connectedTo": [
      10,
      -1,
      4,
      -1,
      17,
      -1
    ]
  },
  {
    "id": 12,
    "col": 2,
    "row": 0,
    "cx": 182,
    "cy": 176.5,
    "points": "162.0,140.0 202.0,140.0 222.0,176.5 202.0,213.0 162.0,213.0 142.0,176.5",
    "connectedTo": [
      -1,
      13,
      5,
      6,
      18,
      19
    ]
  },
  {
    "id": 13,
    "col": 2,
    "row": 1,
    "cx": 182,
    "cy": 250.5,
    "points": "162.0,214.0 202.0,214.0 222.0,250.5 202.0,287.0 162.0,287.0 142.0,250.5",
    "connectedTo": [
      12,
      14,
      6,
      7,
      19,
      20
    ]
  },
  {
    "id": 14,
    "col": 2,
    "row": 2,
    "cx": 182,
    "cy": 324.5,
    "points": "162.0,288.0 202.0,288.0 222.0,324.5 202.0,361.0 162.0,361.0 142.0,324.5",
    "connectedTo": [
      13,
      15,
      7,
      8,
      20,
      21
    ]
  },
  {
    "id": 15,
    "col": 2,
    "row": 3,
    "cx": 182,
    "cy": 398.5,
    "points": "162.0,362.0 202.0,362.0 222.0,398.5 202.0,435.0 162.0,435.0 142.0,398.5",
    "connectedTo": [
      14,
      16,
      8,
      9,
      21,
      22
    ]
  },
  {
    "id": 16,
    "col": 2,
    "row": 4,
    "cx": 182,
    "cy": 472.5,
    "points": "162.0,436.0 202.0,436.0 222.0,472.5 202.0,509.0 162.0,509.0 142.0,472.5",
    "connectedTo": [
      15,
      17,
      9,
      10,
      22,
      23
    ]
  },
  {
    "id": 17,
    "col": 2,
    "row": 5,
    "cx": 182,
    "cy": 546.5,
    "points": "162.0,510.0 202.0,510.0 222.0,546.5 202.0,583.0 162.0,583.0 142.0,546.5",
    "connectedTo": [
      16,
      -1,
      10,
      11,
      23,
      -1
    ]
  },
  {
    "id": 18,
    "col": 3,
    "row": 0,
    "cx": 243,
    "cy": 139.5,
    "points": "223.0,103.0 263.0,103.0 283.0,139.5 263.0,176.0 223.0,176.0 203.0,139.5",
    "connectedTo": [
      -1,
      19,
      -1,
      12,
      24,
      25
    ]
  },
  {
    "id": 19,
    "col": 3,
    "row": 1,
    "cx": 243,
    "cy": 213.5,
    "points": "223.0,177.0 263.0,177.0 283.0,213.5 263.0,250.0 223.0,250.0 203.0,213.5",
    "connectedTo": [
      18,
      20,
      12,
      13,
      25,
      26
    ]
  },
  {
    "id": 20,
    "col": 3,
    "row": 2,
    "cx": 243,
    "cy": 287.5,
    "points": "223.0,251.0 263.0,251.0 283.0,287.5 263.0,324.0 223.0,324.0 203.0,287.5",
    "connectedTo": [
      19,
      21,
      13,
      14,
      26,
      27
    ]
  },
  {
    "id": 21,
    "col": 3,
    "row": 3,
    "cx": 243,
    "cy": 361.5,
    "points": "223.0,325.0 263.0,325.0 283.0,361.5 263.0,398.0 223.0,398.0 203.0,361.5",
    "connectedTo": [
      20,
      22,
      14,
      15,
      27,
      28
    ]
  },
  {
    "id": 22,
    "col": 3,
    "row": 4,
    "cx": 243,
    "cy": 435.5,
    "points": "223.0,399.0 263.0,399.0 283.0,435.5 263.0,472.0 223.0,472.0 203.0,435.5",
    "connectedTo": [
      21,
      23,
      15,
      16,
      28,
      29
    ]
  },
  {
    "id": 23,
    "col": 3,
    "row": 5,
    "cx": 243,
    "cy": 509.5,
    "points": "223.0,473.0 263.0,473.0 283.0,509.5 263.0,546.0 223.0,546.0 203.0,509.5",
    "connectedTo": [
      22,
      -1,
      16,
      17,
      29,
      30
    ]
  },
  {
    "id": 24,
    "col": 4,
    "row": 0,
    "cx": 304,
    "cy": 103.5,
    "points": "284.0,67.0 324.0,67.0 344.0,103.5 324.0,140.0 284.0,140.0 264.0,103.5",
    "connectedTo": [
      -1,
      25,
      -1,
      18,
      31,
      32
    ]
  },
  {
    "id": 25,
    "col": 4,
    "row": 1,
    "cx": 304,
    "cy": 177.5,
    "points": "284.0,141.0 324.0,141.0 344.0,177.5 324.0,214.0 284.0,214.0 264.0,177.5",
    "connectedTo": [
      24,
      26,
      18,
      19,
      32,
      33
    ]
  },
  {
    "id": 26,
    "col": 4,
    "row": 2,
    "cx": 304,
    "cy": 251.5,
    "points": "284.0,215.0 324.0,215.0 344.0,251.5 324.0,288.0 284.0,288.0 264.0,251.5",
    "connectedTo": [
      25,
      27,
      19,
      20,
      33,
      34
    ]
  },
  {
    "id": 27,
    "col": 4,
    "row": 3,
    "cx": 304,
    "cy": 325.5,
    "points": "284.0,289.0 324.0,289.0 344.0,325.5 324.0,362.0 284.0,362.0 264.0,325.5",
    "connectedTo": [
      26,
      28,
      20,
      21,
      34,
      35
    ]
  },
  {
    "id": 28,
    "col": 4,
    "row": 4,
    "cx": 304,
    "cy": 399.5,
    "points": "284.0,363.0 324.0,363.0 344.0,399.5 324.0,436.0 284.0,436.0 264.0,399.5",
    "connectedTo": [
      27,
      29,
      21,
      22,
      35,
      36
    ]
  },
  {
    "id": 29,
    "col": 4,
    "row": 5,
    "cx": 304,
    "cy": 473.5,
    "points": "284.0,437.0 324.0,437.0 344.0,473.5 324.0,510.0 284.0,510.0 264.0,473.5",
    "connectedTo": [
      28,
      30,
      22,
      23,
      36,
      37
    ]
  },
  {
    "id": 30,
    "col": 4,
    "row": 6,
    "cx": 304,
    "cy": 547.5,
    "points": "284.0,511.0 324.0,511.0 344.0,547.5 324.0,584.0 284.0,584.0 264.0,547.5",
    "connectedTo": [
      29,
      -1,
      23,
      -1,
      37,
      38
    ]
  },
  {
    "id": 31,
    "col": 5,
    "row": 0,
    "cx": 364,
    "cy": 66.5,
    "points": "344.0,30.0 384.0,30.0 404.0,66.5 384.0,103.0 344.0,103.0 324.0,66.5",
    "connectedTo": [
      -1,
      32,
      -1,
      24,
      -1,
      39
    ]
  },
  {
    "id": 32,
    "col": 5,
    "row": 1,
    "cx": 364,
    "cy": 140.5,
    "points": "344.0,104.0 384.0,104.0 404.0,140.5 384.0,177.0 344.0,177.0 324.0,140.5",
    "connectedTo": [
      31,
      33,
      24,
      25,
      39,
      40
    ]
  },
  {
    "id": 33,
    "col": 5,
    "row": 2,
    "cx": 364,
    "cy": 214.5,
    "points": "344.0,178.0 384.0,178.0 404.0,214.5 384.0,251.0 344.0,251.0 324.0,214.5",
    "connectedTo": [
      32,
      34,
      25,
      26,
      40,
      41
    ]
  },
  {
    "id": 34,
    "col": 5,
    "row": 3,
    "cx": 364,
    "cy": 288.5,
    "points": "344.0,252.0 384.0,252.0 404.0,288.5 384.0,325.0 344.0,325.0 324.0,288.5",
    "connectedTo": [
      33,
      35,
      26,
      27,
      41,
      42
    ]
  },
  {
    "id": 35,
    "col": 5,
    "row": 4,
    "cx": 364,
    "cy": 362.5,
    "points": "344.0,326.0 384.0,326.0 404.0,362.5 384.0,399.0 344.0,399.0 324.0,362.5",
    "connectedTo": [
      34,
      36,
      27,
      28,
      42,
      43
    ]
  },
  {
    "id": 36,
    "col": 5,
    "row": 5,
    "cx": 364,
    "cy": 436.5,
    "points": "344.0,400.0 384.0,400.0 404.0,436.5 384.0,473.0 344.0,473.0 324.0,436.5",
    "connectedTo": [
      35,
      37,
      28,
      29,
      43,
      44
    ]
  },
  {
    "id": 37,
    "col": 5,
    "row": 6,
    "cx": 364,
    "cy": 510.5,
    "points": "344.0,474.0 384.0,474.0 404.0,510.5 384.0,547.0 344.0,547.0 324.0,510.5",
    "connectedTo": [
      36,
      38,
      29,
      30,
      44,
      45
    ]
  },
  {
    "id": 38,
    "col": 5,
    "row": 7,
    "cx": 364,
    "cy": 584.5,
    "points": "344.0,548.0 384.0,548.0 404.0,584.5 384.0,621.0 344.0,621.0 324.0,584.5",
    "connectedTo": [
      37,
      -1,
      30,
      -1,
      45,
      46
    ]
  },
  {
    "id": 39,
    "col": 6,
    "row": 0,
    "cx": 424,
    "cy": 103.5,
    "points": "404.0,67.0 444.0,67.0 464.0,103.5 444.0,140.0 404.0,140.0 384.0,103.5",
    "connectedTo": [
      -1,
      40,
      31,
      32,
      -1,
      47
    ]
  },
  {
    "id": 40,
    "col": 6,
    "row": 1,
    "cx": 424,
    "cy": 177.5,
    "points": "404.0,141.0 444.0,141.0 464.0,177.5 444.0,214.0 404.0,214.0 384.0,177.5",
    "connectedTo": [
      39,
      41,
      32,
      33,
      47,
      48
    ]
  },
  {
    "id": 41,
    "col": 6,
    "row": 2,
    "cx": 424,
    "cy": 251.5,
    "points": "404.0,215.0 444.0,215.0 464.0,251.5 444.0,288.0 404.0,288.0 384.0,251.5",
    "connectedTo": [
      40,
      42,
      33,
      34,
      48,
      49
    ]
  },
  {
    "id": 42,
    "col": 6,
    "row": 3,
    "cx": 424,
    "cy": 325.5,
    "points": "404.0,289.0 444.0,289.0 464.0,325.5 444.0,362.0 404.0,362.0 384.0,325.5",
    "connectedTo": [
      41,
      43,
      34,
      35,
      49,
      50
    ]
  },
  {
    "id": 43,
    "col": 6,
    "row": 4,
    "cx": 424,
    "cy": 399.5,
    "points": "404.0,363.0 444.0,363.0 464.0,399.5 444.0,436.0 404.0,436.0 384.0,399.5",
    "connectedTo": [
      42,
      44,
      35,
      36,
      50,
      51
    ]
  },
  {
    "id": 44,
    "col": 6,
    "row": 5,
    "cx": 424,
    "cy": 473.5,
    "points": "404.0,437.0 444.0,437.0 464.0,473.5 444.0,510.0 404.0,510.0 384.0,473.5",
    "connectedTo": [
      43,
      45,
      36,
      37,
      51,
      52
    ]
  },
  {
    "id": 45,
    "col": 6,
    "row": 6,
    "cx": 424,
    "cy": 547.5,
    "points": "404.0,511.0 444.0,511.0 464.0,547.5 444.0,584.0 404.0,584.0 384.0,547.5",
    "connectedTo": [
      44,
      46,
      37,
      38,
      52,
      53
    ]
  },
  {
    "id": 46,
    "col": 6,
    "row": 7,
    "cx": 424,
    "cy": 621.5,
    "points": "404.0,585.0 444.0,585.0 464.0,621.5 444.0,658.0 404.0,658.0 384.0,621.5",
    "connectedTo": [
      45,
      -1,
      38,
      -1,
      53,
      54
    ]
  },
  {
    "id": 47,
    "col": 7,
    "row": 0,
    "cx": 484,
    "cy": 140.5,
    "points": "464.0,104.0 504.0,104.0 524.0,140.5 504.0,177.0 464.0,177.0 444.0,140.5",
    "connectedTo": [
      -1,
      48,
      39,
      40,
      -1,
      55
    ]
  },
  {
    "id": 48,
    "col": 7,
    "row": 1,
    "cx": 484,
    "cy": 214.5,
    "points": "464.0,178.0 504.0,178.0 524.0,214.5 504.0,251.0 464.0,251.0 444.0,214.5",
    "connectedTo": [
      47,
      49,
      40,
      41,
      55,
      56
    ]
  },
  {
    "id": 49,
    "col": 7,
    "row": 2,
    "cx": 484,
    "cy": 288.5,
    "points": "464.0,252.0 504.0,252.0 524.0,288.5 504.0,325.0 464.0,325.0 444.0,288.5",
    "connectedTo": [
      48,
      50,
      41,
      42,
      56,
      57
    ]
  },
  {
    "id": 50,
    "col": 7,
    "row": 3,
    "cx": 484,
    "cy": 362.5,
    "points": "464.0,326.0 504.0,326.0 524.0,362.5 504.0,399.0 464.0,399.0 444.0,362.5",
    "connectedTo": [
      49,
      51,
      42,
      43,
      57,
      58
    ]
  },
  {
    "id": 51,
    "col": 7,
    "row": 4,
    "cx": 484,
    "cy": 436.5,
    "points": "464.0,400.0 504.0,400.0 524.0,436.5 504.0,473.0 464.0,473.0 444.0,436.5",
    "connectedTo": [
      50,
      52,
      43,
      44,
      58,
      59
    ]
  },
  {
    "id": 52,
    "col": 7,
    "row": 5,
    "cx": 484,
    "cy": 510.5,
    "points": "464.0,474.0 504.0,474.0 524.0,510.5 504.0,547.0 464.0,547.0 444.0,510.5",
    "connectedTo": [
      51,
      53,
      44,
      45,
      59,
      60
    ]
  },
  {
    "id": 53,
    "col": 7,
    "row": 6,
    "cx": 484,
    "cy": 584.5,
    "points": "464.0,548.0 504.0,548.0 524.0,584.5 504.0,621.0 464.0,621.0 444.0,584.5",
    "connectedTo": [
      52,
      54,
      45,
      46,
      60,
      61
    ]
  },
  {
    "id": 54,
    "col": 7,
    "row": 7,
    "cx": 484,
    "cy": 658.5,
    "points": "464.0,622.0 504.0,622.0 524.0,658.5 504.0,695.0 464.0,695.0 444.0,658.5",
    "connectedTo": [
      53,
      -1,
      46,
      -1,
      61,
      -1
    ]
  },
  {
    "id": 55,
    "col": 8,
    "row": 0,
    "cx": 544,
    "cy": 177.5,
    "points": "524.0,141.0 564.0,141.0 584.0,177.5 564.0,214.0 524.0,214.0 504.0,177.5",
    "connectedTo": [
      -1,
      56,
      47,
      48,
      -1,
      62
    ]
  },
  {
    "id": 56,
    "col": 8,
    "row": 1,
    "cx": 544,
    "cy": 251.5,
    "points": "524.0,215.0 564.0,215.0 584.0,251.5 564.0,288.0 524.0,288.0 504.0,251.5",
    "connectedTo": [
      55,
      57,
      48,
      49,
      62,
      63
    ]
  },
  {
    "id": 57,
    "col": 8,
    "row": 2,
    "cx": 544,
    "cy": 325.5,
    "points": "524.0,289.0 564.0,289.0 584.0,325.5 564.0,362.0 524.0,362.0 504.0,325.5",
    "connectedTo": [
      56,
      58,
      49,
      50,
      63,
      64
    ]
  },
  {
    "id": 58,
    "col": 8,
    "row": 3,
    "cx": 544,
    "cy": 399.5,
    "points": "524.0,363.0 564.0,363.0 584.0,399.5 564.0,436.0 524.0,436.0 504.0,399.5",
    "connectedTo": [
      57,
      59,
      50,
      51,
      64,
      65
    ]
  },
  {
    "id": 59,
    "col": 8,
    "row": 4,
    "cx": 544,
    "cy": 473.5,
    "points": "524.0,437.0 564.0,437.0 584.0,473.5 564.0,510.0 524.0,510.0 504.0,473.5",
    "connectedTo": [
      58,
      60,
      51,
      52,
      65,
      66
    ]
  },
  {
    "id": 60,
    "col": 8,
    "row": 5,
    "cx": 544,
    "cy": 547.5,
    "points": "524.0,511.0 564.0,511.0 584.0,547.5 564.0,584.0 524.0,584.0 504.0,547.5",
    "connectedTo": [
      59,
      61,
      52,
      53,
      66,
      67
    ]
  },
  {
    "id": 61,
    "col": 8,
    "row": 6,
    "cx": 544,
    "cy": 621.5,
    "points": "524.0,585.0 564.0,585.0 584.0,621.5 564.0,658.0 524.0,658.0 504.0,621.5",
    "connectedTo": [
      60,
      -1,
      53,
      54,
      67,
      -1
    ]
  },
  {
    "id": 62,
    "col": 9,
    "row": 0,
    "cx": 604,
    "cy": 213.5,
    "points": "584.0,177.0 624.0,177.0 644.0,213.5 624.0,250.0 584.0,250.0 564.0,213.5",
    "connectedTo": [
      -1,
      63,
      55,
      56,
      68,
      69
    ]
  },
  {
    "id": 63,
    "col": 9,
    "row": 1,
    "cx": 604,
    "cy": 287.5,
    "points": "584.0,251.0 624.0,251.0 644.0,287.5 624.0,324.0 584.0,324.0 564.0,287.5",
    "connectedTo": [
      62,
      64,
      56,
      57,
      69,
      70
    ]
  },
  {
    "id": 64,
    "col": 9,
    "row": 2,
    "cx": 604,
    "cy": 361.5,
    "points": "584.0,325.0 624.0,325.0 644.0,361.5 624.0,398.0 584.0,398.0 564.0,361.5",
    "connectedTo": [
      63,
      65,
      57,
      58,
      70,
      71
    ]
  },
  {
    "id": 65,
    "col": 9,
    "row": 3,
    "cx": 604,
    "cy": 435.5,
    "points": "584.0,399.0 624.0,399.0 644.0,435.5 624.0,472.0 584.0,472.0 564.0,435.5",
    "connectedTo": [
      64,
      66,
      58,
      59,
      71,
      72
    ]
  },
  {
    "id": 66,
    "col": 9,
    "row": 4,
    "cx": 604,
    "cy": 509.5,
    "points": "584.0,473.0 624.0,473.0 644.0,509.5 624.0,546.0 584.0,546.0 564.0,509.5",
    "connectedTo": [
      65,
      67,
      59,
      60,
      72,
      73
    ]
  },
  {
    "id": 67,
    "col": 9,
    "row": 5,
    "cx": 604,
    "cy": 583.5,
    "points": "584.0,547.0 624.0,547.0 644.0,583.5 624.0,620.0 584.0,620.0 564.0,583.5",
    "connectedTo": [
      66,
      -1,
      60,
      61,
      73,
      -1
    ]
  },
  {
    "id": 68,
    "col": 10,
    "row": 0,
    "cx": 665,
    "cy": 177.5,
    "points": "645.0,141.0 685.0,141.0 705.0,177.5 685.0,214.0 645.0,214.0 625.0,177.5",
    "connectedTo": [
      -1,
      69,
      -1,
      62,
      74,
      75
    ]
  },
  {
    "id": 69,
    "col": 10,
    "row": 1,
    "cx": 665,
    "cy": 251.5,
    "points": "645.0,215.0 685.0,215.0 705.0,251.5 685.0,288.0 645.0,288.0 625.0,251.5",
    "connectedTo": [
      68,
      70,
      62,
      63,
      75,
      76
    ]
  },
  {
    "id": 70,
    "col": 10,
    "row": 2,
    "cx": 665,
    "cy": 325.5,
    "points": "645.0,289.0 685.0,289.0 705.0,325.5 685.0,362.0 645.0,362.0 625.0,325.5",
    "connectedTo": [
      69,
      71,
      63,
      64,
      76,
      77
    ]
  },
  {
    "id": 71,
    "col": 10,
    "row": 3,
    "cx": 665,
    "cy": 399.5,
    "points": "645.0,363.0 685.0,363.0 705.0,399.5 685.0,436.0 645.0,436.0 625.0,399.5",
    "connectedTo": [
      70,
      72,
      64,
      65,
      77,
      78
    ]
  },
  {
    "id": 72,
    "col": 10,
    "row": 4,
    "cx": 665,
    "cy": 473.5,
    "points": "645.0,437.0 685.0,437.0 705.0,473.5 685.0,510.0 645.0,510.0 625.0,473.5",
    "connectedTo": [
      71,
      73,
      65,
      66,
      78,
      79
    ]
  },
  {
    "id": 73,
    "col": 10,
    "row": 5,
    "cx": 665,
    "cy": 547.5,
    "points": "645.0,511.0 685.0,511.0 705.0,547.5 685.0,584.0 645.0,584.0 625.0,547.5",
    "connectedTo": [
      72,
      -1,
      66,
      67,
      79,
      80
    ]
  },
  {
    "id": 74,
    "col": 11,
    "row": 0,
    "cx": 727,
    "cy": 140.5,
    "points": "707.0,104.0 747.0,104.0 767.0,140.5 747.0,177.0 707.0,177.0 687.0,140.5",
    "connectedTo": [
      -1,
      75,
      -1,
      68,
      -1,
      81
    ]
  },
  {
    "id": 75,
    "col": 11,
    "row": 1,
    "cx": 727,
    "cy": 214.5,
    "points": "707.0,178.0 747.0,178.0 767.0,214.5 747.0,251.0 707.0,251.0 687.0,214.5",
    "connectedTo": [
      74,
      76,
      68,
      69,
      81,
      82
    ]
  },
  {
    "id": 76,
    "col": 11,
    "row": 2,
    "cx": 727,
    "cy": 288.5,
    "points": "707.0,252.0 747.0,252.0 767.0,288.5 747.0,325.0 707.0,325.0 687.0,288.5",
    "connectedTo": [
      75,
      77,
      69,
      70,
      82,
      83
    ]
  },
  {
    "id": 77,
    "col": 11,
    "row": 3,
    "cx": 727,
    "cy": 362.5,
    "points": "707.0,326.0 747.0,326.0 767.0,362.5 747.0,399.0 707.0,399.0 687.0,362.5",
    "connectedTo": [
      76,
      78,
      70,
      71,
      83,
      84
    ]
  },
  {
    "id": 78,
    "col": 11,
    "row": 4,
    "cx": 727,
    "cy": 436.5,
    "points": "707.0,400.0 747.0,400.0 767.0,436.5 747.0,473.0 707.0,473.0 687.0,436.5",
    "connectedTo": [
      77,
      79,
      71,
      72,
      84,
      85
    ]
  },
  {
    "id": 79,
    "col": 11,
    "row": 5,
    "cx": 727,
    "cy": 510.5,
    "points": "707.0,474.0 747.0,474.0 767.0,510.5 747.0,547.0 707.0,547.0 687.0,510.5",
    "connectedTo": [
      78,
      80,
      72,
      73,
      85,
      -1
    ]
  },
  {
    "id": 80,
    "col": 11,
    "row": 6,
    "cx": 727,
    "cy": 584.5,
    "points": "707.0,548.0 747.0,548.0 767.0,584.5 747.0,621.0 707.0,621.0 687.0,584.5",
    "connectedTo": [
      79,
      -1,
      73,
      -1,
      -1,
      -1
    ]
  },
  {
    "id": 81,
    "col": 12,
    "row": 0,
    "cx": 786,
    "cy": 177.5,
    "points": "766.0,141.0 806.0,141.0 826.0,177.5 806.0,214.0 766.0,214.0 746.0,177.5",
    "connectedTo": [
      -1,
      82,
      74,
      75,
      -1,
      -1
    ]
  },
  {
    "id": 82,
    "col": 12,
    "row": 1,
    "cx": 786,
    "cy": 251.5,
    "points": "766.0,215.0 806.0,215.0 826.0,251.5 806.0,288.0 766.0,288.0 746.0,251.5",
    "connectedTo": [
      81,
      83,
      75,
      76,
      -1,
      -1
    ]
  },
  {
    "id": 83,
    "col": 12,
    "row": 2,
    "cx": 786,
    "cy": 325.5,
    "points": "766.0,289.0 806.0,289.0 826.0,325.5 806.0,362.0 766.0,362.0 746.0,325.5",
    "connectedTo": [
      82,
      84,
      76,
      77,
      -1,
      -1
    ]
  },
  {
    "id": 84,
    "col": 12,
    "row": 3,
    "cx": 786,
    "cy": 399.5,
    "points": "766.0,363.0 806.0,363.0 826.0,399.5 806.0,436.0 766.0,436.0 746.0,399.5",
    "connectedTo": [
      83,
      85,
      77,
      78,
      -1,
      -1
    ]
  },
  {
    "id": 85,
    "col": 12,
    "row": 4,
    "cx": 786,
    "cy": 473.5,
    "points": "766.0,437.0 806.0,437.0 826.0,473.5 806.0,510.0 766.0,510.0 746.0,473.5",
    "connectedTo": [
      84,
      -1,
      78,
      79,
      -1,
      -1
    ]
  }
];
var INITIAL_GASLIGHT_CONFIG = [
  { id: 1, hex: 10, roundTurnsOff: 1, isLit: true },
  { id: 2, hex: 75, roundTurnsOff: 2, isLit: true },
  { id: 3, hex: 12, roundTurnsOff: 3, isLit: true },
  { id: 4, hex: 73, roundTurnsOff: 4, isLit: true },
  { id: 5, hex: 36, roundTurnsOff: null, isLit: true },
  { id: 6, hex: 49, roundTurnsOff: null, isLit: true },
  { id: 7, hex: 26, roundTurnsOff: null, isLit: false },
  { id: 8, hex: 58, roundTurnsOff: null, isLit: false }
];
var ALL_MANHOLE_HEXES = [6, 11, 15, 31, 43, 54, 70, 74, 79];
var INITIAL_COVERED_MANHOLES = [11, 74];
var EXITS_CONFIG = [
  { id: 0, name: "North-West Gate", hex: 5, x: 25, y: 60, rotation: -45, initialCordon: false },
  { id: 1, name: "North-East Gate", hex: 74, x: 700, y: 40, rotation: 30, initialCordon: true },
  { id: 2, name: "South-West Gate", hex: 11, x: 25, y: 620, rotation: -140, initialCordon: true },
  { id: 3, name: "South-East Gate", hex: 80, x: 710, y: 625, rotation: -215, initialCordon: false }
];
var INITIAL_CHARACTER_HEXES = {
  lestrade: 28,
  stealthy: 2,
  bert: 57,
  watson: 61,
  sherlock: 44,
  smith: 41,
  goodley: 83,
  gull: 24
};

// src/games/mr-jack/constants.ts
var ALL_CHARACTERS = [
  "lestrade",
  "stealthy",
  "bert",
  "watson",
  "sherlock",
  "smith",
  "goodley",
  "gull"
];
var INITIAL_ALIBI_DECK = [
  { characterId: "lestrade", hourglasses: 0 },
  { characterId: "stealthy", hourglasses: 1 },
  { characterId: "bert", hourglasses: 1 },
  { characterId: "watson", hourglasses: 0 },
  { characterId: "sherlock", hourglasses: 1 },
  { characterId: "smith", hourglasses: 1 },
  { characterId: "goodley", hourglasses: 1 },
  { characterId: "gull", hourglasses: 1 }
];
var INITIAL_CHARACTER_POSITIONS = {
  lestrade: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.lestrade].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.lestrade].row],
  stealthy: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.stealthy].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.stealthy].row],
  bert: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.bert].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.bert].row],
  watson: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.watson].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.watson].row],
  sherlock: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.sherlock].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.sherlock].row],
  smith: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.smith].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.smith].row],
  goodley: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.goodley].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.goodley].row],
  gull: [WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.gull].col, WHITECHAPEL_HEXES[INITIAL_CHARACTER_HEXES.gull].row]
};
var INITIAL_GASLIGHTS = INITIAL_GASLIGHT_CONFIG.map((g) => ({
  id: g.id,
  hex: g.hex,
  coord: [WHITECHAPEL_HEXES[g.hex].col, WHITECHAPEL_HEXES[g.hex].row],
  isLit: g.isLit ?? true,
  turnsOffRound: g.roundTurnsOff
}));
var INITIAL_MANHOLES = ALL_MANHOLE_HEXES.map((h, idx) => ({
  id: idx + 1,
  hex: h,
  coord: [WHITECHAPEL_HEXES[h].col, WHITECHAPEL_HEXES[h].row],
  isOpen: !INITIAL_COVERED_MANHOLES.includes(h)
}));
var EXITS = EXITS_CONFIG.map((e) => ({
  index: e.id,
  name: e.name,
  hex: e.hex,
  coord: [WHITECHAPEL_HEXES[e.hex].col, WHITECHAPEL_HEXES[e.hex].row]
}));

// src/games/mr-jack/engine.ts
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function createInitialMrJackGame() {
  const characters = {};
  for (const id of ALL_CHARACTERS) {
    const initHex = INITIAL_CHARACTER_HEXES[id];
    characters[id] = {
      id,
      hex: initHex,
      coord: [WHITECHAPEL_HEXES[initHex].col, WHITECHAPEL_HEXES[initHex].row],
      isSuspect: true,
      isExonerated: false,
      watsonFacing: id === "watson" ? 4 : void 0
    };
  }
  const secretJack = ALL_CHARACTERS[Math.floor(Math.random() * ALL_CHARACTERS.length)];
  const shuffledCards = shuffle([...ALL_CHARACTERS]);
  const round1Cards = shuffledCards.slice(0, 4);
  const remainingCards = shuffledCards.slice(4);
  const alibiDeckShuffled = shuffle(INITIAL_ALIBI_DECK.filter((c) => c.characterId !== secretJack));
  const jackCard = INITIAL_ALIBI_DECK.find((c) => c.characterId === secretJack) || {
    characterId: secretJack,
    hourglasses: 1
  };
  return {
    round: 1,
    turnIndex: 0,
    activeRole: "detective",
    // Round 1 starts with Detective
    jackIdentity: secretJack,
    jackHourglasses: jackCard.hourglasses,
    availableCardPile: remainingCards,
    roundCards: round1Cards.map((cid) => ({
      characterId: cid,
      isPlayed: false
    })),
    activeCharacterId: null,
    hasMovedActiveCharacter: false,
    hasUsedActiveAbility: false,
    abilityState: { type: "none", step: "pending" },
    alibiDeck: alibiDeckShuffled,
    detectiveAlibis: [],
    jackAlibis: [jackCard],
    characters,
    gaslights: INITIAL_GASLIGHTS.map((g) => ({ ...g })),
    manholes: INITIAL_MANHOLES.map((m) => ({ ...m })),
    cordons: [
      { id: 1, exitIndex: 1 },
      // blocks Northeast (hex 74)
      { id: 2, exitIndex: 2 }
      // blocks Southwest (hex 11)
    ],
    witnessCallMade: false,
    isJackVisibleInWitnessCall: null,
    clearedInRound: [],
    isGameOver: false,
    winner: null,
    winReason: null,
    turnSubStep: "select_character"
  };
}

// src/games/catan/constants.ts
var INITIAL_DEV_CARD_DECK = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("victoryPoint"),
  ...Array(2).fill("roadBuilding"),
  ...Array(2).fill("yearOfPlenty"),
  ...Array(2).fill("monopoly")
];

// src/games/catan/engine.ts
var STANDARD_TERRAINS = [
  "wood",
  "wood",
  "wood",
  "wood",
  "brick",
  "brick",
  "brick",
  "sheep",
  "sheep",
  "sheep",
  "sheep",
  "wheat",
  "wheat",
  "wheat",
  "wheat",
  "ore",
  "ore",
  "ore",
  "desert"
];
var STANDARD_NUMBERS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
var STANDARD_PORTS = [
  { id: 0, type: "threeToOne", v1: 0, v2: 1, x: 265, y: 45 },
  { id: 1, type: "wheat", v1: 10, v2: 11, x: 465, y: 45 },
  { id: 2, type: "ore", v1: 12, v2: 22, x: 535, y: 135 },
  { id: 3, type: "threeToOne", v1: 36, v2: 37, x: 580, y: 345 },
  { id: 4, type: "sheep", v1: 45, v2: 46, x: 535, y: 430 },
  { id: 5, type: "threeToOne", v1: 50, v2: 53, x: 415, y: 520 },
  { id: 6, type: "brick", v1: 48, v2: 49, x: 215, y: 520 },
  { id: 7, type: "wood", v1: 26, v2: 40, x: 115, y: 360 },
  { id: 8, type: "threeToOne", v1: 4, v2: 17, x: 145, y: 135 }
];
function generateCatanBoard() {
  const R = 54;
  const W = Math.sqrt(3) * R;
  const centerX = 340;
  const centerY = 280;
  const rows = [
    { count: 3, y: centerY - 1.5 * R * 2, startX: centerX - W },
    { count: 4, y: centerY - 1.5 * R, startX: centerX - 1.5 * W },
    { count: 5, y: centerY, startX: centerX - 2 * W },
    { count: 4, y: centerY + 1.5 * R, startX: centerX - 1.5 * W },
    { count: 3, y: centerY + 1.5 * R * 2, startX: centerX - W }
  ];
  const shuffledTerrains = [...STANDARD_TERRAINS].sort(() => Math.random() - 0.5);
  const shuffledNumbers = [...STANDARD_NUMBERS].sort(() => Math.random() - 0.5);
  let numIdx = 0;
  let hexId = 0;
  let robberHexId = 0;
  const hexes = [];
  rows.forEach((row) => {
    for (let c = 0; c < row.count; c++) {
      const terrain = shuffledTerrains[hexId];
      const isDesert = terrain === "desert";
      if (isDesert) {
        robberHexId = hexId;
      }
      const num = isDesert ? null : shuffledNumbers[numIdx++];
      hexes.push({
        id: hexId,
        terrain,
        number: num,
        x: row.startX + c * W,
        y: row.y,
        hasRobber: isDesert
      });
      hexId++;
    }
  });
  const cornersDeg = [-90, -30, 30, 90, 150, 210];
  const rawVertices = [];
  hexes.forEach((hex) => {
    cornersDeg.forEach((deg) => {
      const rad = deg * Math.PI / 180;
      const vx = Math.round(hex.x + R * Math.cos(rad));
      const vy = Math.round(hex.y + R * Math.sin(rad));
      rawVertices.push({ x: vx, y: vy, hexId: hex.id });
    });
  });
  const vertices = [];
  rawVertices.forEach((rv) => {
    const existing = vertices.find(
      (v) => Math.hypot(v.x - rv.x, v.y - rv.y) < 12
    );
    if (existing) {
      if (!existing.hexIds.includes(rv.hexId)) {
        existing.hexIds.push(rv.hexId);
      }
    } else {
      vertices.push({
        id: vertices.length,
        x: rv.x,
        y: rv.y,
        hexIds: [rv.hexId],
        edgeIds: [],
        adjacentVertexIds: []
      });
    }
  });
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dist = Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y);
      if (Math.abs(dist - R) < 8) {
        const sharesHex = vertices[i].hexIds.some((h) => vertices[j].hexIds.includes(h));
        if (sharesHex) {
          const edgeId = edges.length;
          edges.push({
            id: edgeId,
            v1: i,
            v2: j,
            x1: vertices[i].x,
            y1: vertices[i].y,
            x2: vertices[j].x,
            y2: vertices[j].y
          });
          vertices[i].edgeIds.push(edgeId);
          vertices[j].edgeIds.push(edgeId);
          vertices[i].adjacentVertexIds.push(j);
          vertices[j].adjacentVertexIds.push(i);
        }
      }
    }
  }
  STANDARD_PORTS.forEach((p) => {
    if (vertices[p.v1]) vertices[p.v1].port = p.type;
    if (vertices[p.v2]) vertices[p.v2].port = p.type;
  });
  return { hexes, vertices, edges, ports: STANDARD_PORTS, robberHexId };
}
function createInitialCatanGame(playerConfigs, targetVictoryPoints = 10) {
  const { hexes, vertices, edges, ports, robberHexId } = generateCatanBoard();
  const colors = ["red", "blue", "orange", "white"];
  const players = playerConfigs.map((cfg, idx) => ({
    id: cfg.id,
    name: cfg.name,
    avatar: cfg.avatar,
    color: colors[idx % colors.length],
    isBot: cfg.isBot,
    resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    devCards: [],
    playedKnights: 0,
    victoryPoints: 0,
    roadsLeft: 15,
    settlementsLeft: 5,
    citiesLeft: 4,
    hasLongestRoad: false,
    hasLargestArmy: false
  }));
  const deck = [...INITIAL_DEV_CARD_DECK].sort(() => Math.random() - 0.5);
  const targetVP = targetVictoryPoints || 10;
  return {
    hexes,
    vertices,
    edges,
    ports,
    players,
    currentTurnIndex: 0,
    turnPhase: "setup-settlement-1",
    diceRoll: null,
    robberHexId,
    devCardDeck: deck,
    longestRoadPlayerId: null,
    longestRoadLength: 0,
    largestArmyPlayerId: null,
    largestArmyCount: 0,
    targetVictoryPoints: targetVP,
    tradeOffer: null,
    logs: [
      {
        id: "log_start",
        text: `The island of Catan has been discovered! Race to ${targetVP} Victory Points.`,
        timestamp: Date.now(),
        type: "info"
      }
    ],
    winnerId: null
  };
}

// src/games/ticket-to-ride/constants.ts
var CITIES = {
  AMSTERDAM: "Amsterdam",
  ANGORA: "Angora",
  ATHINA: "Athina",
  BARCELONA: "Barcelona",
  BERLIN: "Berlin",
  BREST: "Brest",
  BRINDISI: "Brindisi",
  BRUXELLES: "Bruxelles",
  BUCURESTI: "Bucuresti",
  BUDAPEST: "Budapest",
  CADIZ: "Cadiz",
  CONSTANTINOPLE: "Constantinople",
  DANZIG: "Danzig",
  DIEPPE: "Dieppe",
  EDINBURGH: "Edinburgh",
  ERZURUM: "Erzurum",
  ESSEN: "Essen",
  FIRENZE: "Firenze",
  FRANKFURT: "Frankfurt",
  KHARKOV: "Kharkov",
  KOBENHAVN: "Kobenhavn",
  KYIV: "Kyiv",
  LEIPZIG: "Leipzig",
  LISBOA: "Lisboa",
  LONDON: "London",
  MADRID: "Madrid",
  MARSEILLE: "Marseille",
  MOSKVA: "Moskva",
  MUNCHEN: "M\xFCnchen",
  NAPOLI: "Napoli",
  OSLO: "Oslo",
  PALERMO: "Palermo",
  PAMPLONA: "Pamplona",
  PARIS: "Paris",
  PETROGRAD: "Petrograd",
  RIGA: "Riga",
  ROMA: "Roma",
  ROSTOV: "Rostov",
  SARAJEVO: "Sarajevo",
  SEVASTOPOL: "Sevastopol",
  SMOLENSK: "Smolensk",
  SMYRNA: "Smyrna",
  SOCHI: "Sochi",
  SOFIA: "Sofia",
  STOCKHOLM: "Stockholm",
  VENEZIA: "Venezia",
  WARSZAWA: "Warszawa",
  WIEN: "Wien",
  ZAGREB: "Zagreb",
  ZURICH: "Z\xFCrich"
};
var INITIAL_ROUTES = {
  // Great Britain & Ireland
  "edinburgh-london-1": { id: "edinburgh-london-1", city1: CITIES.EDINBURGH, city2: CITIES.LONDON, length: 4, color: "black" },
  "edinburgh-london-2": { id: "edinburgh-london-2", city1: CITIES.EDINBURGH, city2: CITIES.LONDON, length: 4, color: "orange" },
  // Cross-Channel Ferries
  "london-dieppe-1": { id: "london-dieppe-1", city1: CITIES.LONDON, city2: CITIES.DIEPPE, length: 2, color: "any", locomotivesRequired: 1 },
  "london-dieppe-2": { id: "london-dieppe-2", city1: CITIES.LONDON, city2: CITIES.DIEPPE, length: 2, color: "any", locomotivesRequired: 1 },
  "london-amsterdam": { id: "london-amsterdam", city1: CITIES.LONDON, city2: CITIES.AMSTERDAM, length: 2, color: "any", locomotivesRequired: 2 },
  // France & Spain
  "dieppe-paris": { id: "dieppe-paris", city1: CITIES.DIEPPE, city2: CITIES.PARIS, length: 1, color: "purple" },
  "dieppe-bruxelles": { id: "dieppe-bruxelles", city1: CITIES.DIEPPE, city2: CITIES.BRUXELLES, length: 2, color: "green" },
  "brest-dieppe": { id: "brest-dieppe", city1: CITIES.BREST, city2: CITIES.DIEPPE, length: 2, color: "orange" },
  "brest-paris": { id: "brest-paris", city1: CITIES.BREST, city2: CITIES.PARIS, length: 3, color: "black" },
  "brest-pamplona": { id: "brest-pamplona", city1: CITIES.BREST, city2: CITIES.PAMPLONA, length: 4, color: "purple" },
  "paris-pamplona": { id: "paris-pamplona", city1: CITIES.PARIS, city2: CITIES.PAMPLONA, length: 4, color: "blue" },
  "paris-marseille": { id: "paris-marseille", city1: CITIES.PARIS, city2: CITIES.MARSEILLE, length: 4, color: "any" },
  "paris-zurich": { id: "paris-zurich", city1: CITIES.PARIS, city2: CITIES.ZURICH, length: 3, color: "any", isTunnel: true },
  "paris-frankfurt-1": { id: "paris-frankfurt-1", city1: CITIES.PARIS, city2: CITIES.FRANKFURT, length: 3, color: "blue" },
  "paris-frankfurt-2": { id: "paris-frankfurt-2", city1: CITIES.PARIS, city2: CITIES.FRANKFURT, length: 3, color: "orange" },
  "paris-bruxelles-1": { id: "paris-bruxelles-1", city1: CITIES.PARIS, city2: CITIES.BRUXELLES, length: 2, color: "yellow" },
  "paris-bruxelles-2": { id: "paris-bruxelles-2", city1: CITIES.PARIS, city2: CITIES.BRUXELLES, length: 2, color: "red" },
  "pamplona-madrid-1": { id: "pamplona-madrid-1", city1: CITIES.PAMPLONA, city2: CITIES.MADRID, length: 3, color: "white" },
  "pamplona-madrid-2": { id: "pamplona-madrid-2", city1: CITIES.PAMPLONA, city2: CITIES.MADRID, length: 3, color: "black" },
  "pamplona-barcelona": { id: "pamplona-barcelona", city1: CITIES.PAMPLONA, city2: CITIES.BARCELONA, length: 2, color: "any", isTunnel: true },
  "pamplona-marseille": { id: "pamplona-marseille", city1: CITIES.PAMPLONA, city2: CITIES.MARSEILLE, length: 4, color: "red" },
  "madrid-lisboa": { id: "madrid-lisboa", city1: CITIES.MADRID, city2: CITIES.LISBOA, length: 3, color: "any" },
  "madrid-cadiz": { id: "madrid-cadiz", city1: CITIES.MADRID, city2: CITIES.CADIZ, length: 3, color: "orange" },
  "madrid-barcelona": { id: "madrid-barcelona", city1: CITIES.MADRID, city2: CITIES.BARCELONA, length: 2, color: "yellow" },
  "lisboa-cadiz": { id: "lisboa-cadiz", city1: CITIES.LISBOA, city2: CITIES.CADIZ, length: 2, color: "blue" },
  "barcelona-marseille": { id: "barcelona-marseille", city1: CITIES.BARCELONA, city2: CITIES.MARSEILLE, length: 4, color: "any" },
  // Germany & Central Europe
  "amsterdam-bruxelles": { id: "amsterdam-bruxelles", city1: CITIES.AMSTERDAM, city2: CITIES.BRUXELLES, length: 1, color: "black" },
  "amsterdam-essen": { id: "amsterdam-essen", city1: CITIES.AMSTERDAM, city2: CITIES.ESSEN, length: 3, color: "yellow" },
  "amsterdam-frankfurt": { id: "amsterdam-frankfurt", city1: CITIES.AMSTERDAM, city2: CITIES.FRANKFURT, length: 2, color: "white" },
  "bruxelles-frankfurt": { id: "bruxelles-frankfurt", city1: CITIES.BRUXELLES, city2: CITIES.FRANKFURT, length: 2, color: "blue" },
  "essen-frankfurt": { id: "essen-frankfurt", city1: CITIES.ESSEN, city2: CITIES.FRANKFURT, length: 2, color: "green" },
  "essen-bremen": { id: "essen-kobenhavn", city1: CITIES.ESSEN, city2: CITIES.KOBENHAVN, length: 3, color: "any", locomotivesRequired: 1 },
  // Ferry
  "essen-berlin": { id: "essen-berlin", city1: CITIES.ESSEN, city2: CITIES.BERLIN, length: 2, color: "blue" },
  "frankfurt-berlin": { id: "frankfurt-berlin", city1: CITIES.FRANKFURT, city2: CITIES.BERLIN, length: 3, color: "black" },
  "frankfurt-leipzig": { id: "frankfurt-leipzig", city1: CITIES.FRANKFURT, city2: CITIES.LEIPZIG, length: 1, color: "any" },
  "frankfurt-munchen": { id: "frankfurt-munchen", city1: CITIES.FRANKFURT, city2: CITIES.MUNCHEN, length: 2, color: "purple" },
  "berlin-leipzig": { id: "berlin-leipzig", city1: CITIES.BERLIN, city2: CITIES.LEIPZIG, length: 2, color: "yellow" },
  "berlin-danzig": { id: "berlin-danzig", city1: CITIES.BERLIN, city2: CITIES.DANZIG, length: 4, color: "any" },
  "berlin-warszawa": { id: "berlin-warszawa", city1: CITIES.BERLIN, city2: CITIES.WARSZAWA, length: 4, color: "purple" },
  "berlin-wien": { id: "berlin-wien", city1: CITIES.BERLIN, city2: CITIES.WIEN, length: 3, color: "green" },
  "leipzig-munchen": { id: "leipzig-munchen", city1: CITIES.LEIPZIG, city2: CITIES.MUNCHEN, length: 2, color: "blue" },
  "leipzig-wien": { id: "leipzig-wien", city1: CITIES.LEIPZIG, city2: CITIES.WIEN, length: 3, color: "any" },
  "munchen-wien": { id: "munchen-wien", city1: CITIES.MUNCHEN, city2: CITIES.WIEN, length: 3, color: "orange" },
  "munchen-zurich": { id: "munchen-zurich", city1: CITIES.MUNCHEN, city2: CITIES.ZURICH, length: 2, color: "yellow", isTunnel: true },
  "munchen-venezia": { id: "munchen-venezia", city1: CITIES.MUNCHEN, city2: CITIES.VENEZIA, length: 2, color: "blue", isTunnel: true },
  // Southern Europe
  "zurich-venezia": { id: "zurich-venezia", city1: CITIES.ZURICH, city2: CITIES.VENEZIA, length: 2, color: "green", isTunnel: true },
  "marseille-zurich": { id: "marseille-zurich", city1: CITIES.MARSEILLE, city2: CITIES.ZURICH, length: 2, color: "purple", isTunnel: true },
  "marseille-roma": { id: "marseille-roma", city1: CITIES.MARSEILLE, city2: CITIES.ROMA, length: 4, color: "any", isTunnel: true },
  "venezia-roma": { id: "venezia-roma", city1: CITIES.VENEZIA, city2: CITIES.ROMA, length: 2, color: "black" },
  "venezia-zagreb": { id: "venezia-zagreb", city1: CITIES.VENEZIA, city2: CITIES.ZAGREB, length: 2, color: "any" },
  "roma-napoli": { id: "roma-napoli", city1: CITIES.ROMA, city2: CITIES.NAPOLI, length: 2, color: "white" },
  "roma-palermo": { id: "roma-palermo", city1: CITIES.ROMA, city2: CITIES.PALERMO, length: 4, color: "any", locomotivesRequired: 1 },
  // Ferry
  "roma-brindisi": { id: "roma-brindisi", city1: CITIES.ROMA, city2: CITIES.BRINDISI, length: 2, color: "any" },
  "napoli-palermo": { id: "napoli-palermo", city1: CITIES.NAPOLI, city2: CITIES.PALERMO, length: 3, color: "any", locomotivesRequired: 1 },
  // Ferry
  "napoli-brindisi": { id: "napoli-brindisi", city1: CITIES.NAPOLI, city2: CITIES.BRINDISI, length: 2, color: "any", isTunnel: true },
  "palermo-smyrna": { id: "palermo-smyrna", city1: CITIES.PALERMO, city2: CITIES.SMYRNA, length: 6, color: "any", locomotivesRequired: 2 },
  // Ferry
  "brindisi-athina": { id: "brindisi-athina", city1: CITIES.BRINDISI, city2: CITIES.ATHINA, length: 4, color: "any", locomotivesRequired: 1 },
  // Ferry
  "zagreb-wien": { id: "zagreb-wien", city1: CITIES.ZAGREB, city2: CITIES.WIEN, length: 2, color: "any" },
  "zagreb-budapest": { id: "zagreb-budapest", city1: CITIES.ZAGREB, city2: CITIES.BUDAPEST, length: 2, color: "orange" },
  "zagreb-sarajevo": { id: "zagreb-sarajevo", city1: CITIES.ZAGREB, city2: CITIES.SARAJEVO, length: 3, color: "red" },
  "sarajevo-budapest": { id: "sarajevo-budapest", city1: CITIES.SARAJEVO, city2: CITIES.BUDAPEST, length: 3, color: "any" },
  "sarajevo-athina": { id: "sarajevo-athina", city1: CITIES.SARAJEVO, city2: CITIES.ATHINA, length: 4, color: "green" },
  "sarajevo-sofia": { id: "sarajevo-sofia", city1: CITIES.SARAJEVO, city2: CITIES.SOFIA, length: 2, color: "any" },
  "athina-sofia": { id: "athina-sofia", city1: CITIES.ATHINA, city2: CITIES.SOFIA, length: 3, color: "purple" },
  "athina-smyrna": { id: "athina-smyrna", city1: CITIES.ATHINA, city2: CITIES.SMYRNA, length: 2, color: "any", locomotivesRequired: 1 },
  // Ferry
  // Eastern Europe
  "wien-budapest-1": { id: "wien-budapest-1", city1: CITIES.WIEN, city2: CITIES.BUDAPEST, length: 1, color: "white" },
  "wien-budapest-2": { id: "wien-budapest-2", city1: CITIES.WIEN, city2: CITIES.BUDAPEST, length: 1, color: "red" },
  "wien-warszawa": { id: "wien-warszawa", city1: CITIES.WIEN, city2: CITIES.WARSZAWA, length: 4, color: "blue" },
  "budapest-bucuresti": { id: "budapest-bucuresti", city1: CITIES.BUDAPEST, city2: CITIES.BUCURESTI, length: 4, color: "any", isTunnel: true },
  "budapest-kyiv": { id: "budapest-kyiv", city1: CITIES.BUDAPEST, city2: CITIES.KYIV, length: 6, color: "any", isTunnel: true },
  "sofia-bucuresti": { id: "sofia-bucuresti", city1: CITIES.SOFIA, city2: CITIES.BUCURESTI, length: 2, color: "any", isTunnel: true },
  "sofia-constantinople": { id: "sofia-constantinople", city1: CITIES.SOFIA, city2: CITIES.CONSTANTINOPLE, length: 3, color: "blue" },
  "bucuresti-constantinople": { id: "bucuresti-constantinople", city1: CITIES.BUCURESTI, city2: CITIES.CONSTANTINOPLE, length: 3, color: "yellow" },
  "bucuresti-sevastopol": { id: "bucuresti-sevastopol", city1: CITIES.BUCURESTI, city2: CITIES.SEVASTOPOL, length: 4, color: "white" },
  "bucuresti-kyiv": { id: "bucuresti-kyiv", city1: CITIES.BUCURESTI, city2: CITIES.KYIV, length: 4, color: "any" },
  "constantinople-smyrna": { id: "constantinople-smyrna", city1: CITIES.CONSTANTINOPLE, city2: CITIES.SMYRNA, length: 2, color: "any", isTunnel: true },
  "constantinople-angora": { id: "constantinople-angora", city1: CITIES.CONSTANTINOPLE, city2: CITIES.ANGORA, length: 2, color: "any", isTunnel: true },
  "constantinople-sevastopol": { id: "constantinople-sevastopol", city1: CITIES.CONSTANTINOPLE, city2: CITIES.SEVASTOPOL, length: 4, color: "any", locomotivesRequired: 2 },
  // Ferry
  "smyrna-angora": { id: "smyrna-angora", city1: CITIES.SMYRNA, city2: CITIES.ANGORA, length: 3, color: "orange", isTunnel: true },
  "angora-erzurum": { id: "angora-erzurum", city1: CITIES.ANGORA, city2: CITIES.ERZURUM, length: 3, color: "black" },
  "erzurum-sevastopol": { id: "erzurum-sevastopol", city1: CITIES.ERZURUM, city2: CITIES.SEVASTOPOL, length: 4, color: "any", locomotivesRequired: 2 },
  // Ferry
  "erzurum-sochi": { id: "erzurum-sochi", city1: CITIES.ERZURUM, city2: CITIES.SOCHI, length: 3, color: "red", isTunnel: true },
  "sevastopol-sochi": { id: "sevastopol-sochi", city1: CITIES.SEVASTOPOL, city2: CITIES.SOCHI, length: 2, color: "any", locomotivesRequired: 1 },
  // Ferry
  "sevastopol-rostov": { id: "sevastopol-rostov", city1: CITIES.SEVASTOPOL, city2: CITIES.ROSTOV, length: 4, color: "any" },
  "sochi-rostov": { id: "sochi-rostov", city1: CITIES.SOCHI, city2: CITIES.ROSTOV, length: 2, color: "any" },
  "rostov-kharkov": { id: "rostov-kharkov", city1: CITIES.ROSTOV, city2: CITIES.KHARKOV, length: 2, color: "green" },
  "kharkov-kyiv": { id: "kharkov-kyiv", city1: CITIES.KHARKOV, city2: CITIES.KYIV, length: 4, color: "any" },
  "kharkov-moskva": { id: "kharkov-moskva", city1: CITIES.KHARKOV, city2: CITIES.MOSKVA, length: 4, color: "any" },
  "kyiv-warszawa": { id: "kyiv-warszawa", city1: CITIES.KYIV, city2: CITIES.WARSZAWA, length: 4, color: "any" },
  "kyiv-smolensk": { id: "kyiv-smolensk", city1: CITIES.KYIV, city2: CITIES.SMOLENSK, length: 3, color: "red" },
  "warszawa-danzig": { id: "warszawa-danzig", city1: CITIES.WARSZAWA, city2: CITIES.DANZIG, length: 2, color: "any" },
  "warszawa-riga": { id: "warszawa-riga", city1: CITIES.WARSZAWA, city2: CITIES.RIGA, length: 3, color: "any" },
  "danzig-riga": { id: "danzig-riga", city1: CITIES.DANZIG, city2: CITIES.RIGA, length: 3, color: "black" },
  "riga-petrograd": { id: "riga-petrograd", city1: CITIES.RIGA, city2: CITIES.PETROGRAD, length: 4, color: "any" },
  "riga-moskva": { id: "riga-moskva", city1: CITIES.RIGA, city2: CITIES.MOSKVA, length: 6, color: "any" },
  "smolensk-moskva": { id: "smolensk-moskva", city1: CITIES.SMOLENSK, city2: CITIES.MOSKVA, length: 2, color: "orange" },
  "smolensk-petrograd": { id: "smolensk-petrograd", city1: CITIES.SMOLENSK, city2: CITIES.PETROGRAD, length: 4, color: "any" },
  "moskva-petrograd": { id: "moskva-petrograd", city1: CITIES.MOSKVA, city2: CITIES.PETROGRAD, length: 4, color: "white" },
  // Nordics
  "kobenhavn-stockholm": { id: "kobenhavn-stockholm", city1: CITIES.KOBENHAVN, city2: CITIES.STOCKHOLM, length: 3, color: "yellow" },
  "kobenhavn-oslo": { id: "kobenhavn-oslo", city1: CITIES.KOBENHAVN, city2: CITIES.OSLO, length: 3, color: "orange", locomotivesRequired: 1 },
  // Ferry
  "oslo-stockholm": { id: "oslo-stockholm", city1: CITIES.OSLO, city2: CITIES.STOCKHOLM, length: 3, color: "any", isTunnel: true },
  "stockholm-petrograd": { id: "stockholm-petrograd", city1: CITIES.STOCKHOLM, city2: CITIES.PETROGRAD, length: 8, color: "any", isTunnel: true }
  // The famous 8-length tunnel
};
var INITIAL_DESTINATIONS = [
  // Long Routes (drawn at start, one dealt to each player, they can choose to keep)
  { id: "cadiz-stockholm", city1: CITIES.CADIZ, city2: CITIES.STOCKHOLM, points: 21 },
  { id: "lisboa-danzig", city1: CITIES.LISBOA, city2: CITIES.DANZIG, points: 20 },
  { id: "edinburgh-athina", city1: CITIES.EDINBURGH, city2: CITIES.ATHINA, points: 21 },
  { id: "kobenhavn-erzurum", city1: CITIES.KOBENHAVN, city2: CITIES.ERZURUM, points: 21 },
  { id: "brest-petrograd", city1: CITIES.BREST, city2: CITIES.PETROGRAD, points: 20 },
  { id: "palermo-moskva", city1: CITIES.PALERMO, city2: CITIES.MOSKVA, points: 20 },
  // Regular Routes
  { id: "athens-ankara", city1: CITIES.ATHINA, city2: CITIES.ANGORA, points: 5 },
  { id: "budapest-sofia", city1: CITIES.BUDAPEST, city2: CITIES.SOFIA, points: 5 },
  { id: "frankfurt-kobenhavn", city1: CITIES.FRANKFURT, city2: CITIES.KOBENHAVN, points: 5 },
  { id: "rostov-erzurum", city1: CITIES.ROSTOV, city2: CITIES.ERZURUM, points: 5 },
  { id: "sofia-smyrna", city1: CITIES.SOFIA, city2: CITIES.SMYRNA, points: 5 },
  { id: "kyiv-petrograd", city1: CITIES.KYIV, city2: CITIES.PETROGRAD, points: 6 },
  { id: "zurich-brindisi", city1: CITIES.ZURICH, city2: CITIES.BRINDISI, points: 6 },
  { id: "zurich-budapest", city1: CITIES.ZURICH, city2: CITIES.BUDAPEST, points: 6 },
  { id: "warszawa-smolensk", city1: CITIES.WARSZAWA, city2: CITIES.SMOLENSK, points: 6 },
  { id: "zagreb-brindisi", city1: CITIES.ZAGREB, city2: CITIES.BRINDISI, points: 6 },
  { id: "paris-zurich-ticket", city1: CITIES.PARIS, city2: CITIES.ZURICH, points: 6 },
  // Distinguish ID
  { id: "paris-zagreb", city1: CITIES.PARIS, city2: CITIES.ZAGREB, points: 7 },
  { id: "brest-marseille", city1: CITIES.BREST, city2: CITIES.MARSEILLE, points: 7 },
  { id: "london-berlin", city1: CITIES.LONDON, city2: CITIES.BERLIN, points: 7 },
  { id: "edinburgh-paris", city1: CITIES.EDINBURGH, city2: CITIES.PARIS, points: 7 },
  { id: "amsterdam-pamplona", city1: CITIES.AMSTERDAM, city2: CITIES.PAMPLONA, points: 7 },
  { id: "roma-smyrna", city1: CITIES.ROMA, city2: CITIES.SMYRNA, points: 8 },
  { id: "palermo-constantinople", city1: CITIES.PALERMO, city2: CITIES.CONSTANTINOPLE, points: 8 },
  { id: "sarajevo-sevastopol", city1: CITIES.SARAJEVO, city2: CITIES.SEVASTOPOL, points: 8 },
  { id: "madrid-dieppe", city1: CITIES.MADRID, city2: CITIES.DIEPPE, points: 8 },
  { id: "barcelona-bruxelles", city1: CITIES.BARCELONA, city2: CITIES.BRUXELLES, points: 8 },
  { id: "paris-wien", city1: CITIES.PARIS, city2: CITIES.WIEN, points: 8 },
  { id: "barcelona-munchen", city1: CITIES.BARCELONA, city2: CITIES.MUNCHEN, points: 8 },
  { id: "venezia-constantinople", city1: CITIES.VENEZIA, city2: CITIES.CONSTANTINOPLE, points: 10 },
  { id: "london-wien", city1: CITIES.LONDON, city2: CITIES.WIEN, points: 10 },
  { id: "madrid-roma", city1: CITIES.MADRID, city2: CITIES.ROMA, points: 10 },
  { id: "lisboa-zurich", city1: CITIES.LISBOA, city2: CITIES.ZURICH, points: 10 },
  { id: "kyiv-sochi", city1: CITIES.KYIV, city2: CITIES.SOCHI, points: 8 },
  { id: "riga-bucuresti", city1: CITIES.RIGA, city2: CITIES.BUCURESTI, points: 10 },
  { id: "essen-kyiv", city1: CITIES.ESSEN, city2: CITIES.KYIV, points: 10 },
  { id: "venezia-moskva", city1: CITIES.VENEZIA, city2: CITIES.MOSKVA, points: 11 },
  { id: "frankfurt-smolensk", city1: CITIES.FRANKFURT, city2: CITIES.SMOLENSK, points: 11 },
  { id: "amsterdam-wien", city1: CITIES.AMSTERDAM, city2: CITIES.WIEN, points: 11 },
  { id: "madrid-zurich", city1: CITIES.MADRID, city2: CITIES.ZURICH, points: 11 },
  { id: "berlin-roma", city1: CITIES.BERLIN, city2: CITIES.ROMA, points: 11 },
  { id: "berlin-bucuresti", city1: CITIES.BERLIN, city2: CITIES.BUCURESTI, points: 11 },
  { id: "berlin-moskva", city1: CITIES.BERLIN, city2: CITIES.MOSKVA, points: 12 },
  { id: "paris-frankfurt-ticket", city1: CITIES.PARIS, city2: CITIES.FRANKFURT, points: 12 },
  { id: "lisboa-marseille", city1: CITIES.LISBOA, city2: CITIES.MARSEILLE, points: 12 }
];

// src/games/ticket-to-ride/engine.ts
var ALL_COLORS = [
  "purple",
  "blue",
  "orange",
  "white",
  "green",
  "yellow",
  "black",
  "red"
];
function shuffle2(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function generateTrainDeck() {
  const deck = [];
  ALL_COLORS.forEach((color) => {
    for (let i = 0; i < 12; i++) deck.push(color);
  });
  for (let i = 0; i < 14; i++) deck.push("locomotive");
  return shuffle2(deck);
}
function createInitialTTRGame(playerIds) {
  const trainDeck = generateTrainDeck();
  const faceUpTrainCards = trainDeck.splice(0, 5);
  const longRoutes = shuffle2(INITIAL_DESTINATIONS.slice(0, 6));
  const regularRoutes = shuffle2(INITIAL_DESTINATIONS.slice(6));
  const players = {};
  const colors = ["#e11d48", "#2563eb", "#16a34a", "#eab308", "#000000"];
  playerIds.forEach((userId, index) => {
    const hand = trainDeck.splice(0, 4);
    const dealtTickets = [
      longRoutes.pop(),
      regularRoutes.pop(),
      regularRoutes.pop(),
      regularRoutes.pop()
    ];
    players[userId] = {
      userId,
      color: colors[index % colors.length],
      trainCarsRemaining: 45,
      stationsRemaining: 3,
      trainCards: hand,
      destinationTickets: [],
      pendingDestinations: dealtTickets,
      score: 0,
      longestRouteLength: 0
    };
  });
  const destinationDeck = shuffle2([...longRoutes, ...regularRoutes]);
  return {
    players,
    playerOrder: playerIds,
    currentPlayerIndex: 0,
    routes: JSON.parse(JSON.stringify(INITIAL_ROUTES)),
    // deep copy
    trainDeck,
    trainDiscard: [],
    faceUpTrainCards,
    destinationDeck,
    turnState: {
      state: "initial_draft"
    },
    setupFinishedBy: [],
    history: ["Game started. Please select your initial destination tickets."]
  };
}
function nextTurn(state) {
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
  state.turnState = { state: "start_turn" };
}
function refillFaceUpCards(state) {
  while (state.faceUpTrainCards.length < 5 && state.trainDeck.length > 0) {
    state.faceUpTrainCards.push(state.trainDeck.pop());
  }
  const locomotives = state.faceUpTrainCards.filter((c) => c === "locomotive").length;
  if (locomotives >= 3) {
    state.trainDiscard.push(...state.faceUpTrainCards);
    state.faceUpTrainCards = [];
    while (state.faceUpTrainCards.length < 5 && state.trainDeck.length > 0) {
      state.faceUpTrainCards.push(state.trainDeck.pop());
    }
  }
}
function processTTRAction(state, userId, action) {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const isDraftAction = state.turnState.state === "initial_draft" && action.type === "KEEP_DESTINATIONS";
  if (!isDraftAction && userId !== currentPlayerId) {
    throw new Error("Not your turn");
  }
  if (!state.players[userId]) {
    throw new Error("Player not in this game");
  }
  const newState = JSON.parse(JSON.stringify(state));
  const player = newState.players[userId];
  switch (action.type) {
    case "DRAW_FACE_UP_TRAIN": {
      if (newState.turnState.state !== "start_turn" && newState.turnState.state !== "drew_one_train") {
        throw new Error("Cannot draw train card now");
      }
      const card = newState.faceUpTrainCards[action.cardIndex];
      if (!card) throw new Error("Invalid card index");
      if (card === "locomotive" && newState.turnState.state === "drew_one_train") {
        throw new Error("Cannot draw a face-up locomotive as your second card");
      }
      newState.faceUpTrainCards.splice(action.cardIndex, 1);
      player.trainCards.push(card);
      newState.history.push(`${userId} drew a ${card} card.`);
      refillFaceUpCards(newState);
      if (card === "locomotive" || newState.turnState.state === "drew_one_train") {
        nextTurn(newState);
      } else {
        newState.turnState.state = "drew_one_train";
      }
      break;
    }
    case "DRAW_DECK_TRAIN": {
      if (newState.turnState.state !== "start_turn" && newState.turnState.state !== "drew_one_train") {
        throw new Error("Cannot draw train card now");
      }
      if (newState.trainDeck.length === 0) {
        newState.trainDeck = shuffle2(newState.trainDiscard);
        newState.trainDiscard = [];
      }
      const card = newState.trainDeck.pop();
      if (!card) throw new Error("No cards left to draw");
      player.trainCards.push(card);
      newState.history.push(`${userId} drew a card from the deck.`);
      if (newState.turnState.state === "drew_one_train") {
        nextTurn(newState);
      } else {
        newState.turnState.state = "drew_one_train";
      }
      break;
    }
    case "CLAIM_ROUTE": {
      if (newState.turnState.state !== "start_turn") {
        throw new Error("Can only claim route at the start of your turn");
      }
      const route = newState.routes[action.routeId];
      if (!route) throw new Error("Invalid route");
      if (route.claimedBy) throw new Error("Route already claimed");
      if (player.trainCarsRemaining < route.length) throw new Error("Not enough train cars");
      if (action.cardsUsed.length !== route.length) {
        throw new Error("Incorrect number of cards supplied for route");
      }
      action.cardsUsed.forEach((c) => {
        const idx = player.trainCards.indexOf(c);
        if (idx === -1) throw new Error("You do not have the required cards");
        player.trainCards.splice(idx, 1);
        newState.trainDiscard.push(c);
      });
      route.claimedBy = userId;
      player.trainCarsRemaining -= route.length;
      const routePoints = { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 };
      player.score += routePoints[route.length] || 0;
      newState.history.push(`${userId} claimed the route from ${route.city1} to ${route.city2}.`);
      nextTurn(newState);
      break;
    }
    case "DRAW_DESTINATIONS": {
      if (newState.turnState.state !== "start_turn") {
        throw new Error("Can only draw tickets at the start of your turn");
      }
      if (newState.destinationDeck.length === 0) {
        throw new Error("No destination tickets left");
      }
      const drawCount = Math.min(3, newState.destinationDeck.length);
      const drawnTickets = newState.destinationDeck.splice(0, drawCount);
      player.pendingDestinations = drawnTickets;
      newState.history.push(`${userId} drew ${drawCount} destination tickets to choose from.`);
      newState.turnState.state = "choosing_destinations";
      break;
    }
    case "KEEP_DESTINATIONS": {
      if (!player.pendingDestinations) {
        throw new Error("You have no pending destination tickets");
      }
      const isInitialDraft = newState.turnState.state === "initial_draft";
      const isChoosing = newState.turnState.state === "choosing_destinations";
      if (!isInitialDraft && !isChoosing) {
        throw new Error("Not currently choosing destinations");
      }
      const minKept = isInitialDraft ? 2 : 1;
      if (action.keptIds.length < minKept) {
        throw new Error(`Must keep at least ${minKept} ticket(s)`);
      }
      const kept = player.pendingDestinations.filter((t) => action.keptIds.includes(t.id));
      const discarded = player.pendingDestinations.filter((t) => !action.keptIds.includes(t.id));
      if (kept.length !== action.keptIds.length) {
        throw new Error("Invalid ticket IDs provided");
      }
      player.destinationTickets.push(...kept);
      newState.destinationDeck.push(...discarded);
      player.pendingDestinations = void 0;
      if (isInitialDraft) {
        newState.setupFinishedBy.push(userId);
        newState.history.push(`${userId} kept ${kept.length} initial tickets.`);
        if (newState.setupFinishedBy.length === newState.playerOrder.length) {
          newState.turnState.state = "start_turn";
          newState.history.push("All players finished draft. Game begins!");
        }
      } else {
        newState.history.push(`${userId} kept ${kept.length} tickets.`);
        nextTurn(newState);
      }
      break;
    }
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
  return newState;
}

// src/games/seven-wonders-duel/constants.ts
var WONDERS = {
  1: {
    id: 1,
    name: "The Pyramids",
    cost: { papyrus: 1, stone: 3 },
    victoryPoints: 9
  },
  2: {
    id: 2,
    name: "The Colossus",
    cost: { glass: 1, clay: 3 },
    military: 2,
    victoryPoints: 3
  },
  3: {
    id: 3,
    name: "The Great Lighthouse",
    cost: { papyrus: 2, stone: 1, wood: 1 },
    resourceChoice: ["wood", "stone", "clay"],
    victoryPoints: 4
  },
  4: {
    id: 4,
    name: "The Temple of Artemis",
    cost: { papyrus: 1, glass: 1, stone: 1, wood: 1 },
    coins: 12,
    extraTurn: true,
    victoryPoints: 0
  },
  5: {
    id: 5,
    name: "The Mausoleum",
    cost: { papyrus: 1, glass: 2, clay: 2 },
    discardBuildingTake: true,
    victoryPoints: 2
  },
  6: {
    id: 6,
    name: "The Great Library",
    cost: { papyrus: 1, glass: 1, wood: 3 },
    progressTokenFromBox: true,
    victoryPoints: 4
  },
  7: {
    id: 7,
    name: "Piraeus",
    cost: { clay: 1, stone: 1, wood: 2 },
    resourceChoice: ["papyrus", "glass"],
    extraTurn: true,
    victoryPoints: 2
  },
  8: {
    id: 8,
    name: "The Hanging Gardens",
    cost: { papyrus: 1, glass: 1, wood: 2 },
    coins: 6,
    extraTurn: true,
    victoryPoints: 3
  },
  9: {
    id: 9,
    name: "The Statue of Zeus",
    cost: { papyrus: 2, clay: 1, wood: 1, stone: 1 },
    destroyOpponentBrown: true,
    military: 1,
    victoryPoints: 3
  },
  10: {
    id: 10,
    name: "The Sphinx",
    cost: { glass: 2, clay: 1, stone: 1 },
    extraTurn: true,
    victoryPoints: 6
  },
  11: {
    id: 11,
    name: "The Appian Way",
    cost: { papyrus: 1, clay: 2, stone: 2 },
    coins: 3,
    opponentCoinLoss: 3,
    extraTurn: true,
    victoryPoints: 3
  },
  12: {
    id: 12,
    name: "Circus Maximus",
    cost: { glass: 1, wood: 1, stone: 2 },
    destroyOpponentGrey: true,
    military: 1,
    victoryPoints: 3
  }
};
var PROGRESS_TOKENS = {
  1: {
    id: 1,
    name: "Agriculture",
    coins: 6,
    victoryPoints: 4,
    description: "Immediately gain 6 coins. Worth 4 victory points at the end of the game."
  },
  2: {
    id: 2,
    name: "Architecture",
    description: "Future Wonders constructed by you cost 2 fewer resources of your choice."
  },
  3: {
    id: 3,
    name: "Economy",
    description: "You gain the coins spent by your opponent when they trade for resources with the bank."
  },
  4: {
    id: 4,
    name: "Law",
    scientificSymbol: 2,
    description: "Grants a scientific symbol (Scales), counting towards Scientific Supremacy."
  },
  5: {
    id: 5,
    name: "Masonry",
    description: "Future blue (Civilian) buildings constructed by you cost 2 fewer resources."
  },
  6: {
    id: 6,
    name: "Mathematics",
    description: "At the end of the game, score 3 victory points for each Progress Token you possess (including this one)."
  },
  7: {
    id: 7,
    name: "Philosophy",
    victoryPoints: 7,
    description: "Worth 7 victory points at the end of the game."
  },
  8: {
    id: 8,
    name: "Strategy",
    description: "New Military Buildings (red cards) you construct benefit from +1 extra Shield."
  },
  9: {
    id: 9,
    name: "Theology",
    description: "All future Wonders constructed by you gain the Play Again (extra turn) effect."
  },
  10: {
    id: 10,
    name: "Urbanism",
    coins: 6,
    description: "Gain 6 coins immediately. Each time you construct a building for free through linking, gain 4 coins."
  }
};
var BUILDINGS = {
  "1": {
    "id": 1,
    "age": 1,
    "name": "Lumber Yard",
    "type": "brown",
    "cost": {},
    "resources": {
      "wood": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "2": {
    "id": 2,
    "age": 1,
    "name": "Stone Pit",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "stone": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "3": {
    "id": 3,
    "age": 1,
    "name": "Clay Pool",
    "type": "brown",
    "cost": {},
    "resources": {
      "clay": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "4": {
    "id": 4,
    "age": 1,
    "name": "Logging Camp",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "wood": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "5": {
    "id": 5,
    "age": 1,
    "name": "Quarry",
    "type": "brown",
    "cost": {},
    "resources": {
      "stone": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "6": {
    "id": 6,
    "age": 1,
    "name": "Clay Pit",
    "type": "brown",
    "cost": {
      "coins": 1
    },
    "resources": {
      "clay": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "7": {
    "id": 7,
    "age": 1,
    "name": "Glassworks",
    "type": "grey",
    "cost": {
      "coins": 1
    },
    "resources": {
      "glass": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "8": {
    "id": 8,
    "age": 1,
    "name": "Press",
    "type": "grey",
    "cost": {
      "coins": 1
    },
    "resources": {
      "papyrus": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "9": {
    "id": 9,
    "age": 1,
    "name": "Stable",
    "type": "red",
    "cost": {
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      29
    ]
  },
  "10": {
    "id": 10,
    "age": 1,
    "name": "Garrison",
    "type": "red",
    "cost": {
      "clay": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      30
    ]
  },
  "11": {
    "id": 11,
    "age": 1,
    "name": "Palisade",
    "type": "red",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      50
    ]
  },
  "12": {
    "id": 12,
    "age": 1,
    "name": "Guard Tower",
    "type": "red",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "13": {
    "id": 13,
    "age": 1,
    "name": "Scriptorium",
    "type": "green",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": 6,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      37
    ]
  },
  "14": {
    "id": 14,
    "age": 1,
    "name": "Workshop",
    "type": "green",
    "cost": {
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 5,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "15": {
    "id": 15,
    "age": 1,
    "name": "Pharmacist",
    "type": "green",
    "cost": {
      "coins": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": 4,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      36
    ]
  },
  "16": {
    "id": 16,
    "age": 1,
    "name": "Apothecary",
    "type": "green",
    "cost": {
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 7,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "17": {
    "id": 17,
    "age": 1,
    "name": "Tavern",
    "type": "yellow",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 4,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      59
    ]
  },
  "18": {
    "id": 18,
    "age": 1,
    "name": "Stone Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "stone"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "19": {
    "id": 19,
    "age": 1,
    "name": "Clay Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "clay"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "20": {
    "id": 20,
    "age": 1,
    "name": "Wood Reserve",
    "type": "yellow",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "wood"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "21": {
    "id": 21,
    "age": 1,
    "name": "Theater",
    "type": "blue",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      43
    ]
  },
  "22": {
    "id": 22,
    "age": 1,
    "name": "Altar",
    "type": "blue",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      42
    ]
  },
  "23": {
    "id": 23,
    "age": 1,
    "name": "Baths",
    "type": "blue",
    "cost": {
      "stone": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      45
    ]
  },
  "24": {
    "id": 24,
    "age": 2,
    "name": "Sawmill",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "wood": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "25": {
    "id": 25,
    "age": 2,
    "name": "Shelf Quarry",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "stone": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "26": {
    "id": 26,
    "age": 2,
    "name": "Brickyard",
    "type": "brown",
    "cost": {
      "coins": 2
    },
    "resources": {
      "clay": 2
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "27": {
    "id": 27,
    "age": 2,
    "name": "Glass-Blower",
    "type": "grey",
    "cost": {},
    "resources": {
      "glass": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "28": {
    "id": 28,
    "age": 2,
    "name": "Drying Room",
    "type": "grey",
    "cost": {},
    "resources": {
      "papyrus": 1
    },
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "29": {
    "id": 29,
    "age": 2,
    "name": "Horse Breeders",
    "type": "red",
    "cost": {
      "clay": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 9
  },
  "30": {
    "id": 30,
    "age": 2,
    "name": "Barracks",
    "type": "red",
    "cost": {
      "coins": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 1,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 10
  },
  "31": {
    "id": 31,
    "age": 2,
    "name": "Walls",
    "type": "red",
    "cost": {
      "stone": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "32": {
    "id": 32,
    "age": 2,
    "name": "Archery Range",
    "type": "red",
    "cost": {
      "stone": 1,
      "wood": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      49
    ]
  },
  "33": {
    "id": 33,
    "age": 2,
    "name": "Parade Ground",
    "type": "red",
    "cost": {
      "clay": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      47
    ]
  },
  "34": {
    "id": 34,
    "age": 2,
    "name": "School",
    "type": "green",
    "cost": {
      "wood": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 7,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      53
    ]
  },
  "35": {
    "id": 35,
    "age": 2,
    "name": "Laboratory",
    "type": "green",
    "cost": {
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 1,
    "coins": 0,
    "scientificSymbol": 5,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      55
    ]
  },
  "36": {
    "id": 36,
    "age": 2,
    "name": "Dispensary",
    "type": "green",
    "cost": {
      "clay": 2,
      "stone": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 4,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 15
  },
  "37": {
    "id": 37,
    "age": 2,
    "name": "Library",
    "type": "green",
    "cost": {
      "stone": 1,
      "wood": 1,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 6,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 13
  },
  "38": {
    "id": 38,
    "age": 2,
    "name": "Brewery",
    "type": "yellow",
    "cost": {},
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 6,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      56
    ]
  },
  "39": {
    "id": 39,
    "age": 2,
    "name": "Forum",
    "type": "yellow",
    "cost": {
      "coins": 3,
      "clay": 1
    },
    "resources": {},
    "resourceChoice": [
      "glass",
      "papyrus"
    ],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "40": {
    "id": 40,
    "age": 2,
    "name": "Caravansery",
    "type": "yellow",
    "cost": {
      "coins": 2,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [
      "wood",
      "clay",
      "stone"
    ],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "41": {
    "id": 41,
    "age": 2,
    "name": "Customs House",
    "type": "yellow",
    "cost": {
      "coins": 4
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [
      "papyrus",
      "glass"
    ],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "42": {
    "id": 42,
    "age": 2,
    "name": "Temple",
    "type": "blue",
    "cost": {
      "wood": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      63
    ],
    "freeIfHas": 22
  },
  "43": {
    "id": 43,
    "age": 2,
    "name": "Statue",
    "type": "blue",
    "cost": {
      "clay": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      62
    ],
    "freeIfHas": 21
  },
  "44": {
    "id": 44,
    "age": 2,
    "name": "Courthouse",
    "type": "blue",
    "cost": {
      "wood": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "45": {
    "id": 45,
    "age": 2,
    "name": "Aqueduct",
    "type": "blue",
    "cost": {
      "stone": 3
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 23
  },
  "46": {
    "id": 46,
    "age": 2,
    "name": "Rostrum",
    "type": "blue",
    "cost": {
      "stone": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 4,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "providesFreeFor": [
      65
    ]
  },
  "47": {
    "id": 47,
    "age": 3,
    "name": "Circus",
    "type": "red",
    "cost": {
      "clay": 2,
      "stone": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 33
  },
  "48": {
    "id": 48,
    "age": 3,
    "name": "Arsenal",
    "type": "red",
    "cost": {
      "clay": 3,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 3,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "49": {
    "id": 49,
    "age": 3,
    "name": "Siege Workshop",
    "type": "red",
    "cost": {
      "wood": 3,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 32
  },
  "50": {
    "id": 50,
    "age": 3,
    "name": "Fortifications",
    "type": "red",
    "cost": {
      "stone": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 2,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 11
  },
  "51": {
    "id": 51,
    "age": 3,
    "name": "Pretorium",
    "type": "red",
    "cost": {
      "coins": 8
    },
    "resources": {},
    "resourceChoice": [],
    "military": 3,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "52": {
    "id": 52,
    "age": 3,
    "name": "Academy",
    "type": "green",
    "cost": {
      "stone": 1,
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": 3,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "53": {
    "id": 53,
    "age": 3,
    "name": "University",
    "type": "green",
    "cost": {
      "clay": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 1,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 34
  },
  "54": {
    "id": 54,
    "age": 3,
    "name": "Study",
    "type": "green",
    "cost": {
      "wood": 2,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": 3,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "55": {
    "id": 55,
    "age": 3,
    "name": "Observatory",
    "type": "green",
    "cost": {
      "stone": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 2,
    "coins": 0,
    "scientificSymbol": 1,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 35
  },
  "56": {
    "id": 56,
    "age": 3,
    "name": "Arena",
    "type": "yellow",
    "cost": {
      "clay": 1,
      "stone": 1,
      "wood": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 2,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 38
  },
  "57": {
    "id": 57,
    "age": 3,
    "name": "Chamber Of Commerce",
    "type": "yellow",
    "cost": {
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "grey",
      "coins": 3
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "58": {
    "id": 58,
    "age": 3,
    "name": "Port",
    "type": "yellow",
    "cost": {
      "wood": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "brown",
      "coins": 2
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "59": {
    "id": 59,
    "age": 3,
    "name": "Lighthouse",
    "type": "yellow",
    "cost": {
      "clay": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "yellow",
      "coins": 1
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 17
  },
  "60": {
    "id": 60,
    "age": 3,
    "name": "Armory",
    "type": "yellow",
    "cost": {
      "stone": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 3,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": {
      "type": "red",
      "coins": 1
    },
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "61": {
    "id": 61,
    "age": 3,
    "name": "Palace",
    "type": "blue",
    "cost": {
      "clay": 1,
      "stone": 1,
      "wood": 1,
      "glass": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 7,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "62": {
    "id": 62,
    "age": 3,
    "name": "Gardens",
    "type": "blue",
    "cost": {
      "clay": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 6,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 43
  },
  "63": {
    "id": 63,
    "age": 3,
    "name": "Pantheon",
    "type": "blue",
    "cost": {
      "clay": 1,
      "wood": 1,
      "papyrus": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 6,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 42
  },
  "64": {
    "id": 64,
    "age": 3,
    "name": "Town Hall",
    "type": "blue",
    "cost": {
      "stone": 3,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 7,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "65": {
    "id": 65,
    "age": 3,
    "name": "Senate",
    "type": "blue",
    "cost": {
      "clay": 2,
      "stone": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null,
    "freeIfHas": 46
  },
  "66": {
    "id": 66,
    "age": 3,
    "name": "Obelisk",
    "type": "blue",
    "cost": {
      "stone": 2,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 5,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "67": {
    "id": 67,
    "age": 4,
    "name": "Merchants Guild",
    "type": "purple",
    "cost": {
      "clay": 1,
      "wood": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "yellow"
    ]
  },
  "68": {
    "id": 68,
    "age": 4,
    "name": "Shipowners Guild",
    "type": "purple",
    "cost": {
      "clay": 1,
      "stone": 1,
      "glass": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "brown",
      "grey"
    ]
  },
  "69": {
    "id": 69,
    "age": 4,
    "name": "Builders Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "clay": 1,
      "wood": 1,
      "glass": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": true,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": null
  },
  "70": {
    "id": 70,
    "age": 4,
    "name": "Magistrates Guild",
    "type": "purple",
    "cost": {
      "wood": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "blue"
    ]
  },
  "71": {
    "id": 71,
    "age": 4,
    "name": "Scientists Guild",
    "type": "purple",
    "cost": {
      "clay": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "green"
    ]
  },
  "72": {
    "id": 72,
    "age": 4,
    "name": "Moneylenders Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "wood": 2
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": true,
    "guildRewardBuildingTypes": null
  },
  "73": {
    "id": 73,
    "age": 4,
    "name": "Tacticians Guild",
    "type": "purple",
    "cost": {
      "stone": 2,
      "clay": 1,
      "papyrus": 1
    },
    "resources": {},
    "resourceChoice": [],
    "military": 0,
    "victoryPoints": 0,
    "coins": 0,
    "scientificSymbol": null,
    "fixedPriceResources": [],
    "coinsPerBuildingOfType": null,
    "coinsPerWonder": 0,
    "guildRewardWonders": false,
    "guildRewardCoinTriplets": false,
    "guildRewardBuildingTypes": [
      "red"
    ]
  }
};
var AGE_LAYOUTS = {
  1: [
    { cols: [5, 7], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [2, 4, 6, 8, 10], faceUp: false },
    { cols: [1, 3, 5, 7, 9, 11], faceUp: true }
  ],
  2: [
    { cols: [1, 3, 5, 7, 9, 11], faceUp: true },
    { cols: [2, 4, 6, 8, 10], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [5, 7], faceUp: true }
  ],
  3: [
    { cols: [5, 7], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 8], faceUp: false },
    { cols: [3, 5, 7, 9], faceUp: true },
    { cols: [4, 6, 8], faceUp: false },
    { cols: [5, 7], faceUp: true }
  ]
};

// src/games/seven-wonders-duel/engine.ts
function createInitialSWDGame(player1, player2) {
  const allWonders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(() => Math.random() - 0.5);
  const round1Wonders = allWonders.slice(0, 4);
  const allTokens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5);
  const boardTokens = allTokens.slice(0, 5);
  const boxTokens = allTokens.slice(5, 10);
  const players = {
    [player1.id]: {
      userId: player1.id,
      name: player1.name,
      avatar: player1.avatar,
      isBot: player1.isBot,
      coins: 7,
      wonders: [],
      buildings: [],
      progressTokens: [],
      scienceSymbols: []
    },
    [player2.id]: {
      userId: player2.id,
      name: player2.name,
      avatar: player2.avatar,
      isBot: player2.isBot,
      coins: 7,
      wonders: [],
      buildings: [],
      progressTokens: [],
      scienceSymbols: []
    }
  };
  return {
    id: "swd_" + Date.now(),
    currentPhase: "wonder_draft",
    currentAge: 1,
    activePlayerId: player1.id,
    playerOrder: [player1.id, player2.id],
    players,
    wonderDraftRound: 1,
    wonderDraftPool: round1Wonders,
    wonderDraftStep: 0,
    draftPool: [],
    conflictPawnPosition: 0,
    militaryTokens: [
      { position: -6, value: 5, isTaken: false },
      { position: -3, value: 2, isTaken: false },
      { position: 3, value: 2, isTaken: false },
      { position: 6, value: 5, isTaken: false }
    ],
    boardProgressTokens: boardTokens,
    boxProgressTokens: boxTokens,
    discardPile: [],
    extraTurn: false,
    actionLog: [
      `Game started! ${player1.name} and ${player2.name} are drafting Wonders.`
    ]
  };
}
function generateAgeDraftPool(age) {
  let cardIds = [];
  if (age === 1) {
    const age1Cards = Object.values(BUILDINGS).filter((b) => b.age === 1).map((b) => b.id).sort(() => Math.random() - 0.5);
    cardIds = age1Cards.slice(0, 20);
  } else if (age === 2) {
    const age2Cards = Object.values(BUILDINGS).filter((b) => b.age === 2).map((b) => b.id).sort(() => Math.random() - 0.5);
    cardIds = age2Cards.slice(0, 20);
  } else {
    const age3Cards = Object.values(BUILDINGS).filter((b) => b.age === 3).map((b) => b.id).sort(() => Math.random() - 0.5).slice(0, 17);
    const guildCards = Object.values(BUILDINGS).filter((b) => b.type === "purple").map((b) => b.id).sort(() => Math.random() - 0.5).slice(0, 3);
    cardIds = [...age3Cards, ...guildCards].sort(() => Math.random() - 0.5);
  }
  const layout = AGE_LAYOUTS[age];
  const draftPool = [];
  let cardIdx = 0;
  layout.forEach((rowConfig, rowIndex) => {
    rowConfig.cols.forEach((col) => {
      draftPool.push({
        id: cardIds[cardIdx++],
        row: rowIndex,
        col,
        faceUp: rowConfig.faceUp,
        isTaken: false
      });
    });
  });
  return draftPool;
}
function isCardAvailable(card, draftPool) {
  if (card.isTaken) return false;
  const rowBelow = card.row + 1;
  const coveringCards = draftPool.filter(
    (c) => !c.isTaken && c.row === rowBelow && (c.col === card.col - 1 || c.col === card.col + 1)
  );
  return coveringCards.length === 0;
}
function updateDraftPoolAvailability(draftPool) {
  return draftPool.map((c) => {
    if (c.isTaken) return c;
    const available = isCardAvailable(c, draftPool);
    if (available && !c.faceUp) {
      return { ...c, faceUp: true };
    }
    return c;
  });
}
function getPlayerProduction(player) {
  const basic = {
    wood: 0,
    clay: 0,
    stone: 0,
    glass: 0,
    papyrus: 0
  };
  const flexible = [];
  const fixedPrice = /* @__PURE__ */ new Set();
  player.buildings.forEach((cardId) => {
    const b = BUILDINGS[cardId];
    if (!b) return;
    if (b.resources) {
      Object.keys(b.resources).forEach((res) => {
        basic[res] += b.resources[res] || 0;
      });
    }
    if (b.resourceChoice && b.resourceChoice.length > 0) {
      flexible.push(b.resourceChoice);
    }
    if (b.fixedPriceResources) {
      b.fixedPriceResources.forEach((res) => fixedPrice.add(res));
    }
  });
  player.wonders.filter((w) => w.isConstructed).forEach((pw) => {
    const wonder = WONDERS[pw.id];
    if (wonder && wonder.resourceChoice && wonder.resourceChoice.length > 0) {
      flexible.push(wonder.resourceChoice);
    }
  });
  return { basic, flexible, fixedPrice };
}
function calculateCost(state, playerId, target) {
  const player = state.players[playerId];
  const opponentId = state.playerOrder[0] === playerId ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];
  if (target.type === "building" && target.building.freeIfHas) {
    if (player.buildings.includes(target.building.freeIfHas)) {
      return {
        canAfford: true,
        isFreeThroughLink: true,
        requiredCoins: 0,
        producedResources: {},
        missingResources: {},
        tradeCostPerResource: {},
        totalTradeCost: 0
      };
    }
  }
  const { basic, flexible, fixedPrice } = getPlayerProduction(player);
  const opponentProduction = getPlayerProduction(opponent).basic;
  const rawCost = {
    ...target.type === "building" ? target.building.cost : target.wonder.cost
  };
  const coinCost = rawCost.coins || 0;
  delete rawCost.coins;
  let discountRemaining = 0;
  if (target.type === "wonder" && player.progressTokens.includes(2)) {
    discountRemaining = 2;
  } else if (target.type === "building" && target.building.type === "blue" && player.progressTokens.includes(5)) {
    discountRemaining = 2;
  }
  const needed = {};
  Object.keys(rawCost).forEach((res) => {
    const req = rawCost[res] || 0;
    if (req > 0) needed[res] = req;
  });
  const produced = {};
  Object.keys(needed).forEach((res) => {
    const req = needed[res] || 0;
    const prod = basic[res] || 0;
    const used = Math.min(req, prod);
    produced[res] = used;
    needed[res] = req - used;
    if (needed[res] === 0) delete needed[res];
  });
  const getResourceTradePrice = (res) => {
    if (fixedPrice.has(res)) return 1;
    return 2 + (opponentProduction[res] || 0);
  };
  let bestTradeCost = Infinity;
  let bestMissing = {};
  const evaluateAllocation = (remNeeded, flexIdx, discounts) => {
    if (flexIdx >= flexible.length) {
      const currentMissing = { ...remNeeded };
      let d = discounts;
      while (d > 0) {
        const missingKeys = Object.keys(currentMissing);
        if (missingKeys.length === 0) break;
        missingKeys.sort((a, b) => getResourceTradePrice(b) - getResourceTradePrice(a));
        const topRes = missingKeys[0];
        currentMissing[topRes] = (currentMissing[topRes] || 1) - 1;
        if (currentMissing[topRes] === 0) delete currentMissing[topRes];
        d--;
      }
      let cost = 0;
      Object.keys(currentMissing).forEach((res) => {
        const count = currentMissing[res] || 0;
        cost += count * getResourceTradePrice(res);
      });
      if (cost < bestTradeCost) {
        bestTradeCost = cost;
        bestMissing = currentMissing;
      }
      return;
    }
    const choices = flexible[flexIdx];
    evaluateAllocation(remNeeded, flexIdx + 1, discounts);
    for (const ch of choices) {
      if ((remNeeded[ch] || 0) > 0) {
        const nextNeeded = { ...remNeeded };
        nextNeeded[ch] = (nextNeeded[ch] || 1) - 1;
        if (nextNeeded[ch] === 0) delete nextNeeded[ch];
        evaluateAllocation(nextNeeded, flexIdx + 1, discounts);
      }
    }
  };
  evaluateAllocation(needed, 0, discountRemaining);
  const tradeCostPerResource = {};
  Object.keys(bestMissing).forEach((res) => {
    tradeCostPerResource[res] = getResourceTradePrice(res);
  });
  const totalCost = coinCost + (bestTradeCost === Infinity ? 0 : bestTradeCost);
  return {
    canAfford: player.coins >= totalCost,
    isFreeThroughLink: false,
    requiredCoins: coinCost,
    producedResources: produced,
    missingResources: bestMissing,
    tradeCostPerResource,
    totalTradeCost: bestTradeCost === Infinity ? 0 : bestTradeCost
  };
}
function calculateDiscardGain(player) {
  const yellowCount = player.buildings.filter(
    (id) => BUILDINGS[id]?.type === "yellow"
  ).length;
  return 2 + yellowCount;
}
function checkSupremacyVictory(state) {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];
  if (state.conflictPawnPosition >= 9) {
    return {
      ...state,
      currentPhase: "game_over",
      winner: {
        userId: p1Id,
        reason: "military"
      },
      actionLog: [
        ...state.actionLog,
        `\u2694\uFE0F Military Supremacy! ${state.players[p1Id].name} has conquered the capital!`
      ]
    };
  }
  if (state.conflictPawnPosition <= -9) {
    return {
      ...state,
      currentPhase: "game_over",
      winner: {
        userId: p2Id,
        reason: "military"
      },
      actionLog: [
        ...state.actionLog,
        `\u2694\uFE0F Military Supremacy! ${state.players[p2Id].name} has conquered the capital!`
      ]
    };
  }
  for (const pid of [p1Id, p2Id]) {
    const player = state.players[pid];
    const uniqueSymbols = new Set(player.scienceSymbols);
    if (uniqueSymbols.size >= 6) {
      return {
        ...state,
        currentPhase: "game_over",
        winner: {
          userId: pid,
          reason: "science"
        },
        actionLog: [
          ...state.actionLog,
          `\u{1F3DB}\uFE0F Scientific Supremacy! ${player.name} has unlocked 6 scientific disciplines!`
        ]
      };
    }
  }
  return state;
}
function getMilitaryVictoryPoints(conflictPawnPosition, isPlayer1) {
  const netPos = isPlayer1 ? conflictPawnPosition : -conflictPawnPosition;
  if (netPos <= 0) return 0;
  if (netPos >= 6) return 10;
  if (netPos >= 3) return 5;
  if (netPos >= 1) return 2;
  return 0;
}
function calculateFinalScores(state) {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];
  const p1 = state.players[p1Id];
  const p2 = state.players[p2Id];
  const calcPlayer = (player, opponent, isPlayer1) => {
    let civilian = 0;
    let science = 0;
    let wondersVP = 0;
    let tokens = 0;
    let guilds = 0;
    player.buildings.forEach((cid) => {
      const b = BUILDINGS[cid];
      if (!b) return;
      if (b.type === "blue") civilian += b.victoryPoints;
      if (b.type === "green") science += b.victoryPoints;
      if (b.type === "yellow") civilian += b.victoryPoints;
      if (b.type === "purple") {
        if (b.guildRewardBuildingTypes) {
          const type = b.guildRewardBuildingTypes[0];
          const countP = player.buildings.filter((c) => BUILDINGS[c]?.type === type).length;
          const countO = opponent.buildings.filter((c) => BUILDINGS[c]?.type === type).length;
          guilds += Math.max(countP, countO);
        } else if (b.guildRewardWonders) {
          const wP = player.wonders.filter((w) => w.isConstructed).length;
          const wO = opponent.wonders.filter((w) => w.isConstructed).length;
          guilds += Math.max(wP, wO) * 2;
        } else if (b.guildRewardCoinTriplets) {
          const maxCoins = Math.max(player.coins, opponent.coins);
          guilds += Math.floor(maxCoins / 3);
        }
      }
    });
    player.wonders.filter((w) => w.isConstructed).forEach((pw) => {
      const w = WONDERS[pw.id];
      if (w) wondersVP += w.victoryPoints;
    });
    player.progressTokens.forEach((tid) => {
      const t = PROGRESS_TOKENS[tid];
      if (!t) return;
      if (t.victoryPoints) tokens += t.victoryPoints;
      if (tid === 6) {
        tokens += player.progressTokens.length * 3;
      }
    });
    const military = getMilitaryVictoryPoints(state.conflictPawnPosition, isPlayer1);
    const treasury = Math.floor(player.coins / 3);
    const total = civilian + science + military + wondersVP + tokens + guilds + treasury;
    return {
      civilian,
      science,
      military,
      wonders: wondersVP,
      tokens,
      guilds,
      treasury,
      total
    };
  };
  return {
    [p1Id]: calcPlayer(p1, p2, true),
    [p2Id]: calcPlayer(p2, p1, false)
  };
}
function processSWDAction(state, playerId, action) {
  if (state.currentPhase === "game_over") return state;
  if (state.activePlayerId !== playerId && state.pendingActionPlayerId !== playerId) {
    throw new Error("Not your turn");
  }
  let nextState = JSON.parse(JSON.stringify(state));
  const player = nextState.players[playerId];
  const opponentId = nextState.playerOrder[0] === playerId ? nextState.playerOrder[1] : nextState.playerOrder[0];
  const opponent = nextState.players[opponentId];
  if (action.type === "draft_wonder") {
    if (nextState.currentPhase !== "wonder_draft") {
      throw new Error("Not in wonder draft phase");
    }
    if (!nextState.wonderDraftPool.includes(action.wonderId)) {
      throw new Error("Wonder not in draft pool");
    }
    player.wonders.push({ id: action.wonderId, isConstructed: false });
    nextState.wonderDraftPool = nextState.wonderDraftPool.filter((id) => id !== action.wonderId);
    const wonder = WONDERS[action.wonderId];
    nextState.actionLog.push(`${player.name} selected Wonder \u201C${wonder.name}\u201D.`);
    const p1Id = nextState.playerOrder[0];
    const p2Id = nextState.playerOrder[1];
    if (nextState.wonderDraftRound === 1) {
      if (nextState.wonderDraftStep === 0) {
        nextState.activePlayerId = p2Id;
        nextState.wonderDraftStep = 1;
      } else if (nextState.wonderDraftStep === 1) {
        nextState.activePlayerId = p2Id;
        nextState.wonderDraftStep = 2;
      } else if (nextState.wonderDraftStep === 2) {
        const lastWonder = nextState.wonderDraftPool[0];
        nextState.players[p1Id].wonders.push({ id: lastWonder, isConstructed: false });
        nextState.actionLog.push(`${nextState.players[p1Id].name} received Wonder \u201C${WONDERS[lastWonder].name}\u201D.`);
        let allRemainingWonders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
          (id) => !nextState.players[p1Id].wonders.some((w) => w.id === id) && !nextState.players[p2Id].wonders.some((w) => w.id === id)
        );
        allRemainingWonders = allRemainingWonders.sort(() => Math.random() - 0.5);
        nextState.wonderDraftRound = 2;
        nextState.wonderDraftPool = allRemainingWonders.slice(0, 4);
        nextState.wonderDraftStep = 0;
        nextState.activePlayerId = p2Id;
      }
    } else {
      if (nextState.wonderDraftStep === 0) {
        nextState.activePlayerId = p1Id;
        nextState.wonderDraftStep = 1;
      } else if (nextState.wonderDraftStep === 1) {
        nextState.activePlayerId = p1Id;
        nextState.wonderDraftStep = 2;
      } else if (nextState.wonderDraftStep === 2) {
        const lastWonder = nextState.wonderDraftPool[0];
        nextState.players[p2Id].wonders.push({ id: lastWonder, isConstructed: false });
        nextState.actionLog.push(`${nextState.players[p2Id].name} received Wonder \u201C${WONDERS[lastWonder].name}\u201D.`);
        nextState.currentPhase = "main_game";
        nextState.currentAge = 1;
        nextState.draftPool = generateAgeDraftPool(1);
        nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
        nextState.activePlayerId = p1Id;
        nextState.actionLog.push(`\u{1F3DB}\uFE0F Age I begins! ${nextState.players[p1Id].name} plays first.`);
      }
    }
    return nextState;
  }
  if (action.type === "construct_building") {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error("Card is not available");
    }
    const building = BUILDINGS[action.cardId];
    if (!building) throw new Error("Building not found");
    const costBreakdown = calculateCost(nextState, playerId, {
      type: "building",
      building
    });
    if (!costBreakdown.canAfford) {
      throw new Error("Cannot afford building");
    }
    const totalCoinsPaid = costBreakdown.requiredCoins + costBreakdown.totalTradeCost;
    player.coins -= totalCoinsPaid;
    if (costBreakdown.totalTradeCost > 0 && opponent.progressTokens.includes(3)) {
      opponent.coins += costBreakdown.totalTradeCost;
      nextState.actionLog.push(
        `\u{1F4B0} Economy! ${opponent.name} gained ${costBreakdown.totalTradeCost} coins spent in trade.`
      );
    }
    card.isTaken = true;
    player.buildings.push(building.id);
    if (building.coins > 0) {
      player.coins += building.coins;
    }
    if (building.coinsPerBuildingOfType) {
      const type = building.coinsPerBuildingOfType.type;
      const count = player.buildings.filter((id) => BUILDINGS[id]?.type === type).length;
      const gained = count * building.coinsPerBuildingOfType.coins;
      player.coins += gained;
    }
    if (building.coinsPerWonder && building.coinsPerWonder > 0) {
      const wCount = player.wonders.filter((w) => w.isConstructed).length;
      player.coins += wCount * building.coinsPerWonder;
    }
    if (costBreakdown.isFreeThroughLink && player.progressTokens.includes(10)) {
      player.coins += 4;
      nextState.actionLog.push(
        `\u{1F3DB}\uFE0F Urbanism! ${player.name} gained 4 coins for constructing for free via chain.`
      );
    }
    if (building.military > 0) {
      let shields = building.military;
      if (player.progressTokens.includes(8)) {
        shields += 1;
      }
      applyMilitaryAdvance(nextState, playerId, shields);
    }
    let triggersProgressSelection = false;
    if (building.scientificSymbol) {
      player.scienceSymbols.push(building.scientificSymbol);
      const symbolCounts = {};
      player.scienceSymbols.forEach((s) => {
        symbolCounts[s] = (symbolCounts[s] || 0) + 1;
      });
      if (symbolCounts[building.scientificSymbol] === 2) {
        triggersProgressSelection = true;
      }
    }
    nextState.lastAction = {
      type: "construct_building",
      playerId,
      playerName: player.name,
      cardId: building.id,
      costPaid: totalCoinsPaid,
      description: `${player.name} constructed \u201C${building.name}\u201D ${costBreakdown.isFreeThroughLink ? "for free (via chain link)" : `for ${totalCoinsPaid} coin${totalCoinsPaid === 1 ? "" : "s"}`}.`
    };
    nextState.actionLog.push(nextState.lastAction.description);
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === "game_over") return nextState;
    if (triggersProgressSelection && nextState.boardProgressTokens.length > 0) {
      nextState.currentPhase = "choose_progress_token";
      nextState.pendingActionPlayerId = playerId;
      nextState.availableSelectionTokens = [...nextState.boardProgressTokens];
      return nextState;
    }
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "discard_card") {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error("Card is not available");
    }
    const building = BUILDINGS[action.cardId];
    if (!building) throw new Error("Building not found");
    const coinsGained = calculateDiscardGain(player);
    player.coins += coinsGained;
    card.isTaken = true;
    nextState.discardPile.push(building.id);
    nextState.lastAction = {
      type: "discard_card",
      playerId,
      playerName: player.name,
      cardId: building.id,
      coinsGained,
      description: `${player.name} discarded \u201C${building.name}\u201D and gained ${coinsGained} coins.`
    };
    nextState.actionLog.push(nextState.lastAction.description);
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "construct_wonder") {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error("Card is not available");
    }
    const totalConstructed = nextState.players[nextState.playerOrder[0]].wonders.filter((w) => w.isConstructed).length + nextState.players[nextState.playerOrder[1]].wonders.filter((w) => w.isConstructed).length;
    if (totalConstructed >= 7) {
      throw new Error("Maximum of 7 wonders already constructed");
    }
    const playerWonder = player.wonders.find((w) => w.id === action.wonderId);
    if (!playerWonder || playerWonder.isConstructed) {
      throw new Error("Wonder already constructed or not owned");
    }
    const wonder = WONDERS[action.wonderId];
    const costBreakdown = calculateCost(nextState, playerId, {
      type: "wonder",
      wonder
    });
    if (!costBreakdown.canAfford) {
      throw new Error("Cannot afford wonder");
    }
    const totalCoinsPaid = costBreakdown.requiredCoins + costBreakdown.totalTradeCost;
    player.coins -= totalCoinsPaid;
    if (costBreakdown.totalTradeCost > 0 && opponent.progressTokens.includes(3)) {
      opponent.coins += costBreakdown.totalTradeCost;
      nextState.actionLog.push(
        `\u{1F4B0} Economy! ${opponent.name} gained ${costBreakdown.totalTradeCost} coins spent in trade.`
      );
    }
    card.isTaken = true;
    playerWonder.isConstructed = true;
    playerWonder.tuckedCardId = card.id;
    if (wonder.coins) player.coins += wonder.coins;
    if (wonder.military) {
      applyMilitaryAdvance(nextState, playerId, wonder.military);
    }
    if (wonder.opponentCoinLoss) {
      const lost = Math.min(opponent.coins, wonder.opponentCoinLoss);
      opponent.coins -= lost;
      nextState.actionLog.push(`\u{1F4B8} ${opponent.name} lost ${lost} coins from ${wonder.name}.`);
    }
    let grantsExtraTurn = !!wonder.extraTurn || player.progressTokens.includes(9);
    nextState.lastAction = {
      type: "construct_wonder",
      playerId,
      playerName: player.name,
      wonderId: wonder.id,
      cardId: card.id,
      costPaid: totalCoinsPaid,
      description: `${player.name} constructed Wonder \u201C${wonder.name}\u201D using ${BUILDINGS[card.id]?.name}!`
    };
    nextState.actionLog.push(nextState.lastAction.description);
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === "game_over") return nextState;
    if (wonder.progressTokenFromBox && nextState.boxProgressTokens.length > 0) {
      nextState.currentPhase = "choose_progress_token";
      nextState.pendingActionPlayerId = playerId;
      nextState.availableSelectionTokens = nextState.boxProgressTokens.slice(0, 3);
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }
    if (wonder.discardBuildingTake && nextState.discardPile.length > 0) {
      nextState.currentPhase = "choose_discarded_card";
      nextState.pendingActionPlayerId = playerId;
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }
    if (wonder.destroyOpponentBrown && opponent.buildings.some((id) => BUILDINGS[id]?.type === "brown")) {
      nextState.currentPhase = "destroy_opponent_card";
      nextState.pendingActionPlayerId = playerId;
      nextState.destroyCardColor = "brown";
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }
    if (wonder.destroyOpponentGrey && opponent.buildings.some((id) => BUILDINGS[id]?.type === "grey")) {
      nextState.currentPhase = "destroy_opponent_card";
      nextState.pendingActionPlayerId = playerId;
      nextState.destroyCardColor = "grey";
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }
    if (grantsExtraTurn) {
      nextState.actionLog.push(`\u26A1 Play Again! ${player.name} takes an immediate extra turn.`);
      return nextState;
    }
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "choose_progress_token") {
    if (nextState.currentPhase !== "choose_progress_token") {
      throw new Error("Not in progress token selection phase");
    }
    const token = PROGRESS_TOKENS[action.tokenId];
    if (!token) throw new Error("Token not found");
    player.progressTokens.push(token.id);
    if (token.scientificSymbol) {
      player.scienceSymbols.push(token.scientificSymbol);
    }
    if (token.coins) {
      player.coins += token.coins;
    }
    nextState.boardProgressTokens = nextState.boardProgressTokens.filter((id) => id !== token.id);
    nextState.boxProgressTokens = nextState.boxProgressTokens.filter((id) => id !== token.id);
    nextState.actionLog.push(`${player.name} obtained Progress Token \u201C${token.name}\u201D.`);
    nextState.currentPhase = "main_game";
    nextState.pendingActionPlayerId = void 0;
    nextState.availableSelectionTokens = void 0;
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === "game_over") return nextState;
    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "choose_discarded_card") {
    if (nextState.currentPhase !== "choose_discarded_card") {
      throw new Error("Not in choose discarded card phase");
    }
    if (!nextState.discardPile.includes(action.cardId)) {
      throw new Error("Card not in discard pile");
    }
    const building = BUILDINGS[action.cardId];
    nextState.discardPile = nextState.discardPile.filter((id) => id !== action.cardId);
    player.buildings.push(building.id);
    if (building.coins > 0) player.coins += building.coins;
    if (building.military > 0) {
      let shields = building.military;
      if (player.progressTokens.includes(8)) shields += 1;
      applyMilitaryAdvance(nextState, playerId, shields);
    }
    if (building.scientificSymbol) {
      player.scienceSymbols.push(building.scientificSymbol);
    }
    nextState.actionLog.push(
      `\u{1F3DB}\uFE0F Mausoleum! ${player.name} retrieved \u201C${building.name}\u201D from the discard pile for free!`
    );
    nextState.currentPhase = "main_game";
    nextState.pendingActionPlayerId = void 0;
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === "game_over") return nextState;
    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "destroy_opponent_card") {
    if (nextState.currentPhase !== "destroy_opponent_card") {
      throw new Error("Not in destroy opponent card phase");
    }
    if (!opponent.buildings.includes(action.cardId)) {
      throw new Error("Opponent does not have this building");
    }
    const b = BUILDINGS[action.cardId];
    opponent.buildings = opponent.buildings.filter((id) => id !== action.cardId);
    nextState.discardPile.push(action.cardId);
    nextState.actionLog.push(`\u26A1 ${player.name} destroyed opponent\u2019s \u201C${b?.name}\u201D!`);
    nextState.currentPhase = "main_game";
    nextState.pendingActionPlayerId = void 0;
    nextState.destroyCardColor = void 0;
    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }
    return advanceTurnOrAge(nextState);
  }
  if (action.type === "choose_start_player") {
    if (nextState.currentPhase !== "choose_start_player") {
      throw new Error("Not in choose start player phase");
    }
    nextState.activePlayerId = action.nextPlayerId;
    nextState.currentPhase = "main_game";
    nextState.draftPool = generateAgeDraftPool(nextState.currentAge);
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
    nextState.actionLog.push(
      `\u{1F3DB}\uFE0F Age ${nextState.currentAge === 2 ? "II" : "III"} starts! ${nextState.players[action.nextPlayerId].name} plays first.`
    );
    return nextState;
  }
  return nextState;
}
function applyMilitaryAdvance(state, playerId, shields) {
  const isPlayer1 = state.playerOrder[0] === playerId;
  const oldPos = state.conflictPawnPosition;
  const direction = isPlayer1 ? 1 : -1;
  const newPos = Math.max(-9, Math.min(9, oldPos + shields * direction));
  state.conflictPawnPosition = newPos;
  const opponentId = isPlayer1 ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];
  state.militaryTokens.forEach((tok) => {
    if (!tok.isTaken) {
      if (isPlayer1 && oldPos < tok.position && newPos >= tok.position && tok.position > 0) {
        tok.isTaken = true;
        const loss = Math.min(opponent.coins, tok.value);
        opponent.coins -= loss;
        state.actionLog.push(
          `\u2694\uFE0F Military Breakthrough! ${opponent.name} lost ${loss} coins (plunder token).`
        );
      } else if (!isPlayer1 && oldPos > tok.position && newPos <= tok.position && tok.position < 0) {
        tok.isTaken = true;
        const loss = Math.min(opponent.coins, tok.value);
        opponent.coins -= loss;
        state.actionLog.push(
          `\u2694\uFE0F Military Breakthrough! ${opponent.name} lost ${loss} coins (plunder token).`
        );
      }
    }
  });
}
function advanceTurnOrAge(state) {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];
  const remaining = state.draftPool.filter((c) => !c.isTaken);
  if (remaining.length === 0) {
    if (state.currentAge < 3) {
      state.currentAge += 1;
      let chooserId = state.activePlayerId;
      if (state.conflictPawnPosition > 0) {
        chooserId = p2Id;
      } else if (state.conflictPawnPosition < 0) {
        chooserId = p1Id;
      }
      state.currentPhase = "choose_start_player";
      state.activePlayerId = chooserId;
      state.actionLog.push(
        `\u{1F4DC} End of Age ${state.currentAge - 1}! ${state.players[chooserId].name} chooses who plays first in Age ${state.currentAge === 2 ? "II" : "III"}.`
      );
      return state;
    } else {
      const scores = calculateFinalScores(state);
      const p1Score = scores[p1Id].total;
      const p2Score = scores[p2Id].total;
      let winnerId = p1Score > p2Score ? p1Id : p2Id;
      if (p1Score === p2Score) {
        winnerId = scores[p1Id].civilian >= scores[p2Id].civilian ? p1Id : p2Id;
      }
      state.currentPhase = "game_over";
      state.winner = {
        userId: winnerId,
        reason: "civilian",
        scores
      };
      state.actionLog.push(
        `\u{1F3C6} Game Over (Civilian Victory)! ${state.players[winnerId].name} wins (${p1Score} vs ${p2Score} VP)!`
      );
      return state;
    }
  }
  state.activePlayerId = state.activePlayerId === p1Id ? p2Id : p1Id;
  return state;
}

// server/src/index.ts
function createArenaServer(options) {
  const app2 = express();
  const server2 = http.createServer(app2);
  const isStandalone = options?.isStandalone ?? process.env.STANDALONE_SERVER === "true";
  const isRender = process.env.RENDER === "true" || process.env.IS_RENDER === "true";
  const PORT2 = isRender && process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : Number(process.env.DEFAULT_APP_PORT) || 3e3;
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
  const corsOrigins = CLIENT_ORIGIN === "*" ? "*" : CLIENT_ORIGIN.split(",").map((s) => s.trim());
  app2.use((req, res, next) => {
    const origin = req.headers.origin;
    if (CLIENT_ORIGIN === "*" || origin && (Array.isArray(corsOrigins) ? corsOrigins.includes(origin) : corsOrigins === "*")) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
  app2.use(express.json());
  const io = new Server(server2, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 3e4,
    pingInterval: 15e3
  });
  if (isStandalone) {
    app2.get("/", (_req, res) => {
      res.json({
        name: "ArenaBoard Real-Time Game Server",
        service: "Backend & WebSocket Service for Render",
        status: "online",
        version: "v1.6.0",
        frontendOrigin: CLIENT_ORIGIN,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
  }
  app2.get("/pong", (_req, res) => res.send("pong"));
  app2.get(["/health", "/api/health"], (_req, res) => {
    res.json({
      status: "healthy",
      uptime: Math.round(process.uptime()),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      activeTables: tables.size,
      connectedUsers: connectedUsers.size
    });
  });
  app2.get("/api/version", (_req, res) => {
    res.json({
      version: "v1.6.0",
      buildId: "bld-20260930154500-v160-swd",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "production",
      isStandalone: !!process.env.RENDER || process.env.STANDALONE_SERVER === "true"
    });
  });
  const connectedUsers = /* @__PURE__ */ new Map();
  const tables = /* @__PURE__ */ new Map();
  const botTimeouts = /* @__PURE__ */ new Map();
  function sanitizeTable(table) {
    if (table.ttrState?.routes && table.ttrState.routes["smyrna-erzurum"]) {
      delete table.ttrState.routes["smyrna-erzurum"];
    }
  }
  function getPublicLobbies() {
    return Array.from(tables.values()).filter((t) => {
      sanitizeTable(t);
      return !t.isPrivate;
    });
  }
  function broadcastLobbyList() {
    io.emit("lobby:list", getPublicLobbies());
  }
  function clearBotTimers(roomId) {
    const timers = botTimeouts.get(roomId);
    if (timers) {
      timers.forEach((t) => clearTimeout(t));
      botTimeouts.delete(roomId);
    }
  }
  function startBotPlayer(room) {
    clearBotTimers(room.id);
    const botPlayer = room.players.find((p) => p.isBot);
    if (!botPlayer) return;
    const solveRes = solveGeniusSquare(room.blockers);
    if (!solveRes.solved || !solveRes.solution || solveRes.solution.length === 0) {
      return;
    }
    const solution = solveRes.solution;
    const timers = [];
    let targetTotalSec = 45;
    if (room.botDifficulty === "beginner") targetTotalSec = 75;
    else if (room.botDifficulty === "intermediate") targetTotalSec = 42;
    else if (room.botDifficulty === "expert") targetTotalSec = 24;
    else if (room.botDifficulty === "genius") targetTotalSec = 14;
    const stepDelayMs = targetTotalSec * 1e3 / solution.length;
    const botPlaced = [];
    let botFilledCells = 0;
    solution.forEach((piece, index) => {
      const delay = (index + 1) * stepDelayMs + (Math.random() * 400 - 200);
      const timer = setTimeout(() => {
        const currentRoom = tables.get(room.id);
        if (!currentRoom || currentRoom.status !== "in-game") return;
        botPlaced.push(piece);
        botFilledCells += piece.coords.length;
        const isComplete = botPlaced.length === 9 && botFilledCells === 29;
        botPlayer.boardProgress = {
          filledCells: botFilledCells,
          totalPieces: botPlaced.length,
          isComplete,
          timeElapsed: Math.round((Date.now() - (currentRoom.gameStartTime || Date.now())) / 1e3),
          placedPieces: [...botPlaced]
        };
        io.to(room.id).emit("table:board_sync", {
          userId: botPlayer.userId,
          progress: botPlayer.boardProgress
        });
        if (isComplete) {
          clearBotTimers(room.id);
          const timeSec = Math.round(
            (Date.now() - (currentRoom.gameStartTime || Date.now())) / 1e3
          );
          currentRoom.status = "finished";
          currentRoom.winner = {
            id: botPlayer.userId,
            name: botPlayer.username,
            avatar: botPlayer.avatar,
            timeSeconds: timeSec
          };
          io.to(room.id).emit("table:game_over", {
            table: currentRoom,
            winner: currentRoom.winner
          });
          broadcastLobbyList();
        }
      }, Math.max(800, delay));
      timers.push(timer);
    });
    botTimeouts.set(room.id, timers);
  }
  io.on("connection", (socket) => {
    socket.on("user:register", (user) => {
      connectedUsers.set(socket.id, user);
      socket.emit("lobby:list", getPublicLobbies());
    });
    socket.on("lobby:get", () => {
      socket.emit("lobby:list", getPublicLobbies());
    });
    socket.on(
      "table:create",
      (data) => {
        try {
          const user = connectedUsers.get(socket.id);
          if (!user) return;
          const roomId = "table_" + Math.random().toString(36).substring(2, 9);
          const players = [
            {
              userId: user.id,
              socketId: socket.id,
              username: user.username,
              avatar: user.avatar,
              rating: user.rating,
              isReady: true,
              isHost: true
            }
          ];
          if (data.bots && Array.isArray(data.bots) && data.bots.length > 0) {
            data.bots.forEach((botCfg, bIdx) => {
              const diff = botCfg.difficulty || "intermediate";
              const botNames = {
                beginner: "Pawn Bot",
                intermediate: "Knight Bot",
                expert: "Rook Bot",
                genius: "Genius AI"
              };
              const botAvatars = ["\u{1F916}", "\u{1F9ED}", "\u2694\uFE0F", "\u{1F9E0}"];
              players.push({
                userId: `bot_${diff}_${bIdx + 1}_${Date.now()}`,
                socketId: "bot",
                username: botCfg.name || `${botNames[diff] || "AI Bot"} #${bIdx + 1}`,
                avatar: botCfg.avatar || botAvatars[bIdx % botAvatars.length],
                rating: diff === "genius" ? 1850 : diff === "expert" ? 1550 : diff === "intermediate" ? 1300 : 1050,
                isReady: true,
                isHost: false,
                isBot: true
              });
            });
          } else if (data.withBot) {
            const diff = data.botDifficulty || "intermediate";
            const botNames = {
              beginner: "Pawn Bot (AI)",
              intermediate: "Knight Bot (AI)",
              expert: "Rook Bot (AI)",
              genius: "Genius AI (Grandmaster)"
            };
            players.push({
              userId: "bot_" + diff,
              socketId: "bot",
              username: botNames[diff] || "BoardBot (AI)",
              avatar: "\u{1F916}",
              rating: diff === "genius" ? 1850 : diff === "expert" ? 1550 : diff === "intermediate" ? 1300 : 1050,
              isReady: true,
              isHost: false,
              isBot: true
            });
          }
          const maxPlayers = data.maxPlayers || (data.gameId === "catan" ? 4 : data.gameId === "ticket-to-ride" ? 5 : 2);
          const isAllBots = players.length >= 2 && !data.hasHumanSlots;
          const initialStatus = isAllBots ? "in-game" : "waiting";
          const targetVP = data.targetVictoryPoints || (data.gameId === "catan" ? 10 : void 0);
          const newTable = {
            id: roomId,
            name: data.name || `${user.username}'s Arena`,
            gameId: data.gameId || "genius-square",
            hostId: user.id,
            hostName: user.username,
            status: initialStatus,
            isPrivate: !!data.isPrivate,
            roomCode: data.roomCode,
            timeControl: data.timeControl || "casual",
            botDifficulty: data.botDifficulty,
            players,
            maxPlayers,
            spectators: [],
            blockers: rollGeniusSquareDice(),
            targetVictoryPoints: targetVP,
            messages: [
              {
                id: "msg_" + Date.now(),
                senderId: "system",
                senderName: "Arena System",
                senderAvatar: data.gameId === "catan" ? "\u{1F3DD}\uFE0F" : "\u{1F3B2}",
                text: initialStatus === "in-game" ? `Match started vs AI Bots! First to reach ${targetVP || 10} VP wins.` : `Welcome to the table! ${players.length > 1 ? "Waiting for players to be ready." : "Invite a friend or open the lobby."}`,
                timestamp: Date.now(),
                isSystem: true
              }
            ],
            createdAt: Date.now()
          };
          if (data.gameId === "catan" && isAllBots) {
            newTable.gameStartTime = Date.now();
            const playerConfigs = players.map((p) => ({
              id: p.userId,
              name: p.username,
              avatar: p.avatar,
              isBot: !!p.isBot
            }));
            newTable.catanState = createInitialCatanGame(playerConfigs, targetVP || 10);
          } else if (data.gameId === "ticket-to-ride" && isAllBots) {
            newTable.ttrState = createInitialTTRGame(newTable.players.map((p) => p.userId));
          } else if (data.gameId === "seven-wonders-duel" && isAllBots) {
            newTable.gameStartTime = Date.now();
            const p1 = {
              id: players[0].userId,
              name: players[0].username,
              avatar: players[0].avatar,
              isBot: !!players[0].isBot
            };
            const p2 = {
              id: players[1].userId,
              name: players[1].username,
              avatar: players[1].avatar,
              isBot: !!players[1].isBot
            };
            newTable.sevenWondersState = createInitialSWDGame(p1, p2);
          }
          tables.set(roomId, newTable);
          socket.join(roomId);
          socket.emit("table:created", newTable);
          broadcastLobbyList();
        } catch (err) {
          console.error("Error creating table:", err);
        }
      }
    );
    socket.on(
      "table:join",
      (data, callback) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table) {
          callback?.({ success: false, error: "Table not found" });
          return;
        }
        if (table.isPrivate && table.roomCode && table.roomCode !== data.roomCode) {
          callback?.({ success: false, error: "Incorrect room code" });
          return;
        }
        const existingPlayer = table.players.find((p) => p.userId === user?.id);
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          socket.join(table.id);
          callback?.({ success: true, table });
          io.to(table.id).emit("table:updated", table);
          return;
        }
        const maxAllowed = table.maxPlayers || (table.gameId === "catan" ? 4 : table.gameId === "ticket-to-ride" ? 5 : 2);
        if (table.players.length < maxAllowed && table.status === "waiting") {
          const newPlayer = {
            userId: user?.id || "guest_" + socket.id.substring(0, 5),
            socketId: socket.id,
            username: user?.username || "Guest Player",
            avatar: user?.avatar || "\u{1F3B2}",
            rating: user?.rating || 1200,
            isReady: false,
            isHost: false
          };
          table.players.push(newPlayer);
          table.messages.push({
            id: "msg_" + Date.now(),
            senderId: "system",
            senderName: "Arena System",
            senderAvatar: "\u{1F3B2}",
            text: `${newPlayer.username} joined the table!`,
            timestamp: Date.now(),
            isSystem: true
          });
          socket.join(table.id);
          callback?.({ success: true, table });
          io.to(table.id).emit("table:updated", table);
          broadcastLobbyList();
        } else {
          table.spectators.push({
            id: user?.id || socket.id,
            username: user?.username || "Spectator"
          });
          socket.join(table.id);
          callback?.({ success: true, table, isSpectator: true });
          io.to(table.id).emit("table:updated", table);
        }
      }
    );
    socket.on("table:ready", (data) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;
      const player = table.players.find((p) => p.userId === user.id);
      if (player) {
        player.isReady = data.isReady;
        io.to(table.id).emit("table:updated", table);
      }
    });
    socket.on("table:start", (data) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;
      if (table.hostId !== user.id) return;
      if (table.players.length < 2) return;
      if (table.gameId === "catan") {
        const playerConfigs = table.players.map((p) => ({
          id: p.userId,
          name: p.username,
          avatar: p.avatar,
          isBot: !!p.isBot
        }));
        const vpTarget = table.targetVictoryPoints || 10;
        table.catanState = createInitialCatanGame(playerConfigs, vpTarget);
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F3DD}\uFE0F",
          text: `The Settlers of Catan has begun! Explore the hexes and build your colonies to ${vpTarget} VP.`,
          timestamp: Date.now(),
          isSystem: true
        });
      } else if (table.gameId === "ticket-to-ride") {
        table.ttrState = createInitialTTRGame(table.players.map((p) => p.userId));
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F682}",
          text: `Ticket to Ride has started! Claim your routes and build your train empire.`,
          timestamp: Date.now(),
          isSystem: true
        });
      } else if (table.gameId === "seven-wonders-duel") {
        const p1 = {
          id: table.players[0].userId,
          name: table.players[0].username,
          avatar: table.players[0].avatar,
          isBot: !!table.players[0].isBot
        };
        const p2 = {
          id: table.players[1].userId,
          name: table.players[1].username,
          avatar: table.players[1].avatar,
          isBot: !!table.players[1].isBot
        };
        table.sevenWondersState = createInitialSWDGame(p1, p2);
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F3DB}\uFE0F",
          text: `7 Wonders - Duel has begun! Wonder selection phase is active.`,
          timestamp: Date.now(),
          isSystem: true
        });
      } else if (table.gameId === "mr-jack") {
        table.mrJackState = createInitialMrJackGame();
        if (table.players.length >= 2) {
          table.players[0].role = "detective";
          table.players[1].role = "jack";
        }
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
          text: `Mr. Jack in London has begun! ${table.players[0].username} is the Detective. ${table.players[1].username} is Mr. Jack!`,
          timestamp: Date.now(),
          isSystem: true
        });
      } else {
        table.blockers = rollGeniusSquareDice();
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u2694\uFE0F",
          text: `Game started! The 7 dice have been rolled: ${table.blockers.join(", ")}. Race to complete your square!`,
          timestamp: Date.now(),
          isSystem: true
        });
      }
      table.status = "in-game";
      table.gameStartTime = Date.now();
      table.winner = null;
      table.players.forEach((p) => {
        p.boardProgress = {
          filledCells: 0,
          totalPieces: 0,
          isComplete: false,
          timeElapsed: 0,
          placedPieces: []
        };
      });
      io.to(table.id).emit("table:game_started", table);
      broadcastLobbyList();
      if (table.gameId === "genius-square" && table.players.some((p) => p.isBot)) {
        startBotPlayer(table);
      }
    });
    socket.on(
      "mrjack:move",
      (data) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user) return;
        if (table.status !== "in-game" && table.status !== "finished") return;
        if (table.status === "finished" && !data.gameState.isGameOver) {
          table.status = "in-game";
          table.winner = null;
          table.gameStartTime = Date.now();
          table.messages.push({
            id: "msg_" + Date.now(),
            senderId: "system",
            senderName: "Arena System",
            senderAvatar: "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
            text: `${user.username} initiated a rematch! A new case begins!`,
            timestamp: Date.now(),
            isSystem: true
          });
          io.to(table.id).emit("table:updated", table);
          broadcastLobbyList();
        }
        table.mrJackState = data.gameState;
        io.to(table.id).emit("table:mrjack_sync", {
          gameState: data.gameState
        });
        if (data.gameState.isGameOver && data.gameState.winner) {
          table.status = "finished";
          const winningPlayer = table.players.find(
            (p) => p.role === data.gameState.winner
          );
          table.winner = {
            id: winningPlayer ? winningPlayer.userId : user.id,
            name: winningPlayer ? winningPlayer.username : user.username,
            avatar: winningPlayer ? winningPlayer.avatar : "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
            timeSeconds: Math.round(
              (Date.now() - (table.gameStartTime || Date.now())) / 1e3
            ),
            role: data.gameState.winner
          };
          table.messages.push({
            id: "msg_" + Date.now(),
            senderId: "system",
            senderName: "Arena System",
            senderAvatar: "\u{1F3C6}",
            text: `Match Ended! Winner: ${data.gameState.winner.toUpperCase()} (${table.winner.name})!`,
            timestamp: Date.now(),
            isSystem: true
          });
          io.to(table.id).emit("table:game_over", {
            table,
            winner: table.winner
          });
          broadcastLobbyList();
        }
      }
    );
    socket.on(
      "catan:action",
      (data) => {
        try {
          if (!data || !data.tableId || !data.gameState) return;
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user) return;
          if (table.status !== "in-game" && table.status !== "finished") return;
          if (table.status === "finished" && !data.gameState.winnerId) {
            table.status = "in-game";
            table.winner = null;
            table.gameStartTime = Date.now();
            table.messages.push({
              id: "msg_" + Date.now(),
              senderId: "system",
              senderName: "Arena System",
              senderAvatar: "\u{1F3DD}\uFE0F",
              text: `${user.username} started a new match! The island of Catan awaits!`,
              timestamp: Date.now(),
              isSystem: true
            });
            io.to(table.id).emit("table:updated", table);
            broadcastLobbyList();
          }
          table.catanState = data.gameState;
          io.to(table.id).emit("table:catan_sync", {
            gameState: data.gameState
          });
          if (data.gameState.winnerId && table.status !== "finished") {
            table.status = "finished";
            const winningPlayer = table.players.find(
              (p) => p.userId === data.gameState.winnerId
            );
            const targetVP = table.targetVictoryPoints || data.gameState.targetVictoryPoints || 10;
            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : "\u{1F3DD}\uFE0F",
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1e3
              ),
              role: "Lord of Catan"
            };
            table.messages.push({
              id: "msg_" + Date.now(),
              senderId: "system",
              senderName: "Arena System",
              senderAvatar: "\u{1F3C6}",
              text: `Colony Dominated! ${table.winner.name} has triumphed on Catan with ${targetVP} Victory Points!`,
              timestamp: Date.now(),
              isSystem: true
            });
            io.to(table.id).emit("table:game_over", {
              table,
              winner: table.winner
            });
            broadcastLobbyList();
          }
        } catch (err) {
          console.error("Error handling catan:action:", err);
        }
      }
    );
    socket.on(
      "ticket-to-ride:action",
      (data) => {
        try {
          console.log("[TTR] Received raw event:", data);
          if (!data || !data.tableId || !data.action) {
            console.log("[TTR] Rejected: missing data fields");
            return;
          }
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user || !table.ttrState) {
            console.log("[TTR] Rejected: missing table, user, or ttrState", { hasTable: !!table, hasUser: !!user, hasTTRState: !!table?.ttrState });
            return;
          }
          const isInitialDraft = table.ttrState.turnState.state === "initial_draft";
          if (table.status !== "in-game" && !isInitialDraft) {
            console.log("[TTR] Rejected: table status is", table.status, "and not initial draft");
            return;
          }
          const actingUserId = data.forUserId && table.hostId === user.id ? data.forUserId : user.id;
          console.log("[TTR] Processing action:", data.action.type, "state:", table.ttrState.turnState.state, "actingUser:", actingUserId, "currentPlayer:", table.ttrState.playerOrder[table.ttrState.currentPlayerIndex]);
          table.ttrState = processTTRAction(table.ttrState, actingUserId, data.action);
          sanitizeTable(table);
          io.to(table.id).emit("table:ttr_sync", {
            gameState: table.ttrState
          });
          if (table.ttrState.winner && table.status !== "finished") {
            table.status = "finished";
            const winningPlayer = table.players.find(
              (p) => p.userId === table.ttrState.winner
            );
            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : "\u{1F682}",
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1e3
              ),
              role: "Railway Baron"
            };
            table.messages.push({
              id: "msg_" + Date.now(),
              senderId: "system",
              senderName: "Arena System",
              senderAvatar: "\u{1F3C6}",
              text: `Journey Complete! ${table.winner.name} has claimed victory across Europe!`,
              timestamp: Date.now(),
              isSystem: true
            });
            io.to(table.id).emit("table:game_over", {
              table,
              winner: table.winner
            });
            broadcastLobbyList();
          }
        } catch (err) {
          console.error("Error handling ticket-to-ride:action:", err);
          socket.emit("table:ttr_error", { message: err.message });
        }
      }
    );
    socket.on(
      "seven-wonders-duel:action",
      (data) => {
        try {
          if (!data || !data.tableId || !data.action) return;
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user || !table.sevenWondersState) return;
          const actingUserId = data.forUserId && table.hostId === user.id ? data.forUserId : user.id;
          table.sevenWondersState = processSWDAction(
            table.sevenWondersState,
            actingUserId,
            data.action
          );
          io.to(table.id).emit("table:swd_sync", {
            gameState: table.sevenWondersState
          });
          if (table.sevenWondersState.winner && table.status !== "finished") {
            table.status = "finished";
            const winnerInfo = table.sevenWondersState.winner;
            const winningPlayer = table.players.find((p) => p.userId === winnerInfo.userId);
            const reason = winnerInfo.reason;
            const reasonDesc = reason === "military" ? "Military Supremacy" : reason === "science" ? "Scientific Supremacy" : "Civilian Victory";
            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : "\u{1F3DB}\uFE0F",
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1e3
              ),
              role: `Master Builder (${reasonDesc})`
            };
            table.messages.push({
              id: "msg_" + Date.now(),
              senderId: "system",
              senderName: "Arena System",
              senderAvatar: "\u{1F3C6}",
              text: `Empire Ascendant! ${table.winner.name} triumphed in 7 Wonders Duel via ${reasonDesc}!`,
              timestamp: Date.now(),
              isSystem: true
            });
            io.to(table.id).emit("table:game_over", {
              table,
              winner: table.winner
            });
            broadcastLobbyList();
          }
        } catch (err) {
          console.error("Error handling seven-wonders-duel:action:", err);
        }
      }
    );
    socket.on(
      "table:chat",
      (data) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || !data.text?.trim()) return;
        const newMsg = {
          id: "msg_" + Date.now() + Math.random().toString(36).substring(2, 5),
          senderId: user.id,
          senderName: user.username,
          senderAvatar: user.avatar,
          text: data.text.trim().substring(0, 200),
          timestamp: Date.now()
        };
        table.messages.push(newMsg);
        if (table.messages.length > 50) table.messages.shift();
        io.to(table.id).emit("table:chat_message", newMsg);
      }
    );
    socket.on(
      "game:move",
      (data) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || table.status !== "in-game") return;
        const player = table.players.find((p) => p.userId === user.id);
        if (!player) return;
        player.boardProgress = {
          filledCells: data.filledCells,
          totalPieces: data.placedPieces.length,
          isComplete: data.isComplete,
          timeElapsed: data.timeElapsed,
          placedPieces: data.placedPieces
        };
        socket.to(table.id).emit("table:board_sync", {
          userId: user.id,
          progress: player.boardProgress
        });
        if (data.isComplete && data.placedPieces.length === 9 && data.filledCells === 29) {
          clearBotTimers(table.id);
          table.status = "finished";
          table.winner = {
            id: user.id,
            name: user.username,
            avatar: user.avatar,
            timeSeconds: data.timeElapsed
          };
          table.messages.push({
            id: "msg_" + Date.now(),
            senderId: "system",
            senderName: "Arena System",
            senderAvatar: "\u{1F3C6}",
            text: `\u{1F389} VICTORY! ${user.username} completed their Genius Square in ${data.timeElapsed}s!`,
            timestamp: Date.now(),
            isSystem: true
          });
          io.to(table.id).emit("table:game_over", {
            table,
            winner: table.winner
          });
          broadcastLobbyList();
        }
      }
    );
    socket.on("table:rematch", (data) => {
      try {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data?.tableId);
        if (!table || !user) return;
        clearBotTimers(table.id);
        table.status = "waiting";
        table.winner = null;
        if (table.gameId === "catan") {
          const vpTarget = table.targetVictoryPoints || 10;
          const playerConfigs = table.players.map((p) => ({
            id: p.userId,
            name: p.username,
            avatar: p.avatar,
            isBot: !!p.isBot
          }));
          table.catanState = createInitialCatanGame(playerConfigs, vpTarget);
        } else if (table.gameId === "ticket-to-ride") {
          table.ttrState = createInitialTTRGame(table.players.map((p) => p.userId));
        } else if (table.gameId === "mr-jack") {
          table.mrJackState = createInitialMrJackGame();
        } else {
          table.blockers = rollGeniusSquareDice();
        }
        table.players.forEach((p) => {
          p.isReady = true;
          p.boardProgress = void 0;
        });
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u2694\uFE0F",
          text: `${user.username} initiated a rematch! Ready for another round!`,
          timestamp: Date.now(),
          isSystem: true
        });
        io.to(table.id).emit("table:updated", table);
        broadcastLobbyList();
      } catch (err) {
        console.error("Error in table:rematch:", err);
      }
    });
    socket.on("table:remove_player", (data) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user || table.hostId !== user.id) return;
      const removedPlayer = table.players.find((p) => p.userId === data.userId);
      table.players = table.players.filter((p) => p.userId !== data.userId);
      if (removedPlayer && !removedPlayer.isBot && removedPlayer.socketId && removedPlayer.socketId !== "bot") {
        io.to(removedPlayer.socketId).emit("table:kicked", { tableId: table.id });
      }
      table.messages.push({
        id: "msg_" + Date.now(),
        senderId: "system",
        senderName: "Arena System",
        senderAvatar: "\u{1F6E1}\uFE0F",
        text: `${removedPlayer ? removedPlayer.username : "A player/bot"} was removed from the table.`,
        timestamp: Date.now(),
        isSystem: true
      });
      io.to(table.id).emit("table:updated", table);
      broadcastLobbyList();
    });
    socket.on(
      "table:add_bot",
      (data) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || table.hostId !== user.id) return;
        const maxPlayers = table.maxPlayers || (table.gameId === "catan" ? 4 : table.gameId === "ticket-to-ride" ? 5 : 2);
        if (table.players.length >= maxPlayers) return;
        const diff = data.difficulty || "intermediate";
        const botNames = {
          beginner: "Pawn Bot (AI)",
          intermediate: "Knight Bot (AI)",
          expert: "Merchant Bot (AI)",
          genius: "Explorer Bot (AI)"
        };
        const botAvatars = ["\u{1F916}", "\u{1F9ED}", "\u2694\uFE0F", "\u{1F9E0}"];
        const botIdx = table.players.filter((p) => p.isBot).length;
        const newBot = {
          userId: `bot_${diff}_${Date.now()}_${table.players.length + 1}`,
          socketId: "bot",
          username: data.name || botNames[diff] || "AI Bot",
          avatar: data.avatar || botAvatars[botIdx % botAvatars.length],
          rating: diff === "genius" ? 1850 : diff === "expert" ? 1550 : diff === "intermediate" ? 1300 : 1050,
          isReady: true,
          isHost: false,
          isBot: true
        };
        table.players.push(newBot);
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F916}",
          text: `${newBot.username} was added to the table.`,
          timestamp: Date.now(),
          isSystem: true
        });
        io.to(table.id).emit("table:updated", table);
        broadcastLobbyList();
      }
    );
    socket.on("table:leave", (data) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;
      table.players = table.players.filter((p) => p.userId !== user.id);
      socket.leave(table.id);
      if (table.players.length === 0 || table.players.length === 1 && table.players[0].isBot) {
        clearBotTimers(table.id);
        tables.delete(table.id);
      } else {
        if (table.hostId === user.id && table.players.length > 0) {
          table.hostId = table.players[0].userId;
          table.hostName = table.players[0].username;
          table.players[0].isHost = true;
        }
        table.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "Arena System",
          senderAvatar: "\u{1F44B}",
          text: `${user.username} left the table.`,
          timestamp: Date.now(),
          isSystem: true
        });
        io.to(table.id).emit("table:updated", table);
      }
      broadcastLobbyList();
    });
    socket.on("disconnect", () => {
      try {
        const user = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);
        tables.forEach((table, tableId) => {
          const idx = table.players.findIndex((p) => p.socketId === socket.id);
          if (idx !== -1) {
            const leavingPlayer = table.players[idx];
            table.players.splice(idx, 1);
            const remainingHumans = table.players.filter((p) => !p.isBot);
            if (table.players.length === 0 || remainingHumans.length === 0) {
              clearBotTimers(tableId);
              tables.delete(tableId);
            } else {
              if (table.hostId === leavingPlayer.userId && table.players.length > 0) {
                const newHost = remainingHumans[0] || table.players[0];
                table.hostId = newHost.userId;
                table.hostName = newHost.username;
                newHost.isHost = true;
              }
              if (table.status === "in-game") {
                if (table.gameId !== "catan" && table.players.length === 1) {
                  clearBotTimers(tableId);
                  table.status = "finished";
                  const remaining = table.players[0];
                  table.winner = {
                    id: remaining.userId,
                    name: remaining.username,
                    avatar: remaining.avatar,
                    timeSeconds: 0
                  };
                  io.to(tableId).emit("table:game_over", {
                    table,
                    winner: table.winner,
                    forfeit: true
                  });
                } else {
                  table.messages.push({
                    id: "msg_" + Date.now(),
                    senderId: "system",
                    senderName: "Arena System",
                    senderAvatar: "\u2139\uFE0F",
                    text: `${leavingPlayer.username} disconnected. Match continues with remaining players.`,
                    timestamp: Date.now(),
                    isSystem: true
                  });
                  io.to(tableId).emit("table:updated", table);
                }
              } else {
                io.to(tableId).emit("table:updated", table);
              }
            }
          }
        });
        broadcastLobbyList();
      } catch (err) {
        console.error("Error during disconnect cleanup:", err);
      }
    });
  });
  return { app: app2, server: server2, io, PORT: PORT2 };
}

// server.ts
import { createServer as createViteServer } from "vite";
import express2 from "express";
import path from "path";
import fs from "fs";
var { app, server, PORT } = createArenaServer({ isStandalone: false });
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api") || url.startsWith("/health") || url.startsWith("/socket.io")) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express2.static(path.resolve("dist")));
    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/health") || req.originalUrl.startsWith("/socket.io")) {
        return next();
      }
      res.sendFile(path.resolve("dist/index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ArenaBoard server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
