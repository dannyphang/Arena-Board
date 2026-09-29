import { Coord, CoordString, PieceId, PlacedPiece } from './types';
import {
  ALL_PIECE_IDS,
  GENIUS_SQUARE_DICE,
  GRID_SIZE,
  PIECES,
  coordToString,
  stringToCoord,
} from './constants';

export interface PieceOrientation {
  pieceId: PieceId;
  orientationIndex: number;
  shape: Coord[]; // normalized coords starting from (0,0)
  rows: number;
  cols: number;
}

// Generate all unique orientations for a piece (rotations & flips)
export function getUniqueOrientations(pieceId: PieceId): PieceOrientation[] {
  const baseShape = PIECES[pieceId].defaultShape;
  const orientations: PieceOrientation[] = [];
  const seenSignatures = new Set<string>();

  const rotate90 = (coords: Coord[]): Coord[] => coords.map(([r, c]) => [c, -r]);
  const flipH = (coords: Coord[]): Coord[] => coords.map(([r, c]) => [r, -c]);

  const normalize = (coords: Coord[]): Coord[] => {
    let minR = Infinity;
    let minC = Infinity;
    for (const [r, c] of coords) {
      if (r < minR) minR = r;
      if (c < minC) minC = c;
    }
    const shifted = coords.map(([r, c]) => [r - minR, c - minC] as Coord);
    // Sort canonically by row, then col
    shifted.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return shifted;
  };

  const getSignature = (coords: Coord[]): string =>
    coords.map(([r, c]) => `${r},${c}`).join(';');

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
          cols: maxC + 1,
        });
      }
      current = rotate90(current);
    }
    current = flipH(baseShape);
  }

  return orientations;
}

// Precomputed orientations for all 9 pieces
export const ALL_ORIENTATIONS: Record<PieceId, PieceOrientation[]> = {
  monomino: getUniqueOrientations('monomino'),
  domino: getUniqueOrientations('domino'),
  straight_3: getUniqueOrientations('straight_3'),
  corner_3: getUniqueOrientations('corner_3'),
  straight_4: getUniqueOrientations('straight_4'),
  L_4: getUniqueOrientations('L_4'),
  square_4: getUniqueOrientations('square_4'),
  T_4: getUniqueOrientations('T_4'),
  Z_4: getUniqueOrientations('Z_4'),
};

export interface PlacementPlacement {
  pieceId: PieceId;
  orientationIndex: number;
  row: number;
  col: number;
  coords: Coord[];
  mask: bigint;
}

// Precompute all valid placements on a clean 6x6 board
const ALL_PLACEMENTS: PlacementPlacement[] = [];
// Index placements by pieceId and by covering cell index (0..35)
const PLACEMENTS_BY_CELL: PlacementPlacement[][] = Array.from({ length: 36 }, () => []);

for (const pieceId of ALL_PIECE_IDS) {
  const oris = ALL_ORIENTATIONS[pieceId];
  for (const ori of oris) {
    for (let r = 0; r <= GRID_SIZE - ori.rows; r++) {
      for (let c = 0; c <= GRID_SIZE - ori.cols; c++) {
        const coords: Coord[] = ori.shape.map(([dr, dc]) => [r + dr, c + dc]);
        let mask = 0n;
        for (const [cr, cc] of coords) {
          const idx = cr * GRID_SIZE + cc;
          mask |= 1n << BigInt(idx);
        }
        const item: PlacementPlacement = {
          pieceId,
          orientationIndex: ori.orientationIndex,
          row: r,
          col: c,
          coords,
          mask,
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

// Roll 7 fair dice according to the exact dice combinations
export function rollGeniusSquareDice(): CoordString[] {
  return GENIUS_SQUARE_DICE.map((die) => {
    const idx = Math.floor(Math.random() * die.length);
    return die[idx];
  });
}

// Convert blocker coordinates to a 36-bit BigInt mask
export function blockersToMask(blockers: (CoordString | Coord)[]): bigint {
  let mask = 0n;
  for (const b of blockers) {
    let r: number, c: number;
    if (typeof b === 'string') {
      [r, c] = stringToCoord(b);
    } else {
      [r, c] = b;
    }
    const idx = r * GRID_SIZE + c;
    mask |= 1n << BigInt(idx);
  }
  return mask;
}

export interface SolveResult {
  solved: boolean;
  solution: PlacedPiece[] | null;
  totalSolutionsFound?: number;
}

// Ultra-fast backtracking solver using bitmasks
export function solveGeniusSquare(
  blockers: (CoordString | Coord)[],
  prePlacedPieces: PlacedPiece[] = [],
  findMultiple = false
): SolveResult {
  const initialBlockerMask = blockersToMask(blockers);
  let currentMask = initialBlockerMask;
  const usedPieces = new Set<PieceId>();
  const currentPlacements: PlacedPiece[] = [];

  // Apply pre-placed pieces if any
  for (const p of prePlacedPieces) {
    usedPieces.add(p.pieceId);
    currentPlacements.push(p);
    for (const [r, c] of p.coords) {
      const idx = r * GRID_SIZE + c;
      const bit = 1n << BigInt(idx);
      if ((currentMask & bit) !== 0n) {
        // Conflict with blockers or other pieces
        return { solved: false, solution: null };
      }
      currentMask |= bit;
    }
  }

  let finalSolution: PlacedPiece[] | null = null;
  let solutionsCount = 0;

  // Find first empty cell (first 0 bit from 0 to 35)
  function search(mask: bigint): boolean {
    if (usedPieces.size === ALL_PIECE_IDS.length) {
      finalSolution = [...currentPlacements];
      solutionsCount++;
      return !findMultiple; // Return true to stop if not finding multiple
    }

    // Find the lowest unset bit
    let targetCell = -1;
    for (let i = 0; i < 36; i++) {
      if ((mask & (1n << BigInt(i))) === 0n) {
        targetCell = i;
        break;
      }
    }

    if (targetCell === -1) return false;

    // Try all candidate placements that cover targetCell
    const candidates = PLACEMENTS_BY_CELL[targetCell];
    for (const cand of candidates) {
      if (usedPieces.has(cand.pieceId)) continue;
      if ((mask & cand.mask) !== 0n) continue; // Collision

      // Place piece
      usedPieces.add(cand.pieceId);
      currentPlacements.push({
        pieceId: cand.pieceId,
        orientationIndex: cand.orientationIndex,
        row: cand.row,
        col: cand.col,
        coords: cand.coords,
      });

      const nextMask = mask | cand.mask;
      const success = search(nextMask);
      if (success && !findMultiple) return true;

      // Backtrack
      usedPieces.delete(cand.pieceId);
      currentPlacements.pop();
    }

    return false;
  }

  const success = search(currentMask);
  return {
    solved: success || finalSolution !== null,
    solution: finalSolution,
    totalSolutionsFound: solutionsCount,
  };
}

// Validate a piece placement
export function validatePlacement(
  pieceId: PieceId,
  coords: Coord[],
  blockers: (CoordString | Coord)[],
  existingPieces: PlacedPiece[],
  ignoreSelfPieceId?: PieceId
): { valid: boolean; reason?: string } {
  const blockerSet = new Set(
    blockers.map((b) => (typeof b === 'string' ? b : coordToString(b[0], b[1])))
  );

  // Check board bounds
  for (const [r, c] of coords) {
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
      return { valid: false, reason: 'Out of grid bounds' };
    }
    const coordStr = coordToString(r, c);
    if (blockerSet.has(coordStr)) {
      return { valid: false, reason: `Collides with blocker at ${coordStr}` };
    }
  }

  // Check collision with other pieces
  const occupied = new Set<string>();
  for (const piece of existingPieces) {
    if (ignoreSelfPieceId && piece.pieceId === ignoreSelfPieceId) continue;
    for (const [r, c] of piece.coords) {
      occupied.add(`${r},${c}`);
    }
  }

  for (const [r, c] of coords) {
    if (occupied.has(`${r},${c}`)) {
      return { valid: false, reason: `Overlaps with another placed piece` };
    }
  }

  return { valid: true };
}

// Get next hint placement for a player who is stuck
export function getHint(
  blockers: CoordString[],
  placedPieces: PlacedPiece[]
): PlacedPiece | null {
  // First test if current state is still solvable
  const res = solveGeniusSquare(blockers, placedPieces);
  if (res.solved && res.solution) {
    // Find the first piece in the solution that hasn't been placed yet
    const placedSet = new Set(placedPieces.map((p) => p.pieceId));
    for (const p of res.solution) {
      if (!placedSet.has(p.pieceId)) {
        return p;
      }
    }
  }

  // If current configuration has a dead end, solve from scratch and return the first piece
  const freshRes = solveGeniusSquare(blockers);
  if (freshRes.solved && freshRes.solution && freshRes.solution.length > 0) {
    return freshRes.solution[0];
  }
  return null;
}
