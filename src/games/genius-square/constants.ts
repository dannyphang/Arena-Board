import { Coord, CoordString, PieceDef, PieceId, BotDifficulty } from './types';

export const GRID_SIZE = 6;
export const TOTAL_CELLS = 36;
export const BLOCKER_COUNT = 7;
export const PLAYABLE_CELLS = 29; // 36 - 7

export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export const ROW_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

// The 7 official Genius Square dice configurations:
// Mathematically guarantees 6 * 6 * 6 * 6 * 6 * 4 * 2 = 62,208 unique solvable combinations
export const GENIUS_SQUARE_DICE: CoordString[][] = [
  // Die 1 (6 faces)
  ['A1', 'C1', 'D1', 'D2', 'E2', 'F3'],
  // Die 2 (6 faces)
  ['B1', 'C2', 'C3', 'D3', 'E3', 'F1'],
  // Die 3 (6 faces)
  ['A2', 'B2', 'B3', 'A3', 'E1', 'F2'],
  // Die 4 (6 faces)
  ['B4', 'C4', 'D4', 'D5', 'E4', 'E5'],
  // Die 5 (6 faces)
  ['A4', 'B5', 'C6', 'D6', 'F6', 'F5'],
  // Die 6 (4 distinct values)
  ['A5', 'B6', 'F4', 'A6'],
  // Die 7 (2 distinct values)
  ['C5', 'E6'],
];

export function coordToString(r: number, c: number): CoordString {
  const colChar = COL_LETTERS[c] ?? 'A';
  const rowNum = (r + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  return `${colChar}${rowNum}` as CoordString;
}

export function stringToCoord(str: string): Coord {
  const colChar = str.charAt(0).toUpperCase();
  const rowChar = str.charAt(1);
  const c = COL_LETTERS.indexOf(colChar as any);
  const r = parseInt(rowChar, 10) - 1;
  return [Math.max(0, Math.min(5, r)), Math.max(0, Math.min(5, c))];
}

// 9 Pieces: Exact polyomino shapes and colors
export const PIECES: Record<PieceId, PieceDef> = {
  monomino: {
    id: 'monomino',
    name: '1-Square (Monomino)',
    size: 1,
    color: '#8D6E63', // Warm Earth Brown
    hoverColor: '#A1887F',
    borderColor: '#5D4037',
    defaultShape: [[0, 0]],
  },
  domino: {
    id: 'domino',
    name: '2-Bar (Domino)',
    size: 2,
    color: '#F97316', // Vibrant Orange
    hoverColor: '#FB923C',
    borderColor: '#C2410C',
    defaultShape: [
      [0, 0],
      [0, 1],
    ],
  },
  straight_3: {
    id: 'straight_3',
    name: '3-Line (Tromino I)',
    size: 3,
    color: '#EAB308', // Amber Gold
    hoverColor: '#FACC15',
    borderColor: '#A16207',
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  corner_3: {
    id: 'corner_3',
    name: '3-Corner (Tromino L)',
    size: 3,
    color: '#06B6D4', // Cyan
    hoverColor: '#22D3EE',
    borderColor: '#0E7490',
    defaultShape: [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  },
  straight_4: {
    id: 'straight_4',
    name: '4-Line (Tetromino I)',
    size: 4,
    color: '#3B82F6', // Royal Blue
    hoverColor: '#60A5FA',
    borderColor: '#1D4ED8',
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
  L_4: {
    id: 'L_4',
    name: '4-L (Tetromino L)',
    size: 4,
    color: '#A855F7', // Magenta / Purple
    hoverColor: '#C084FC',
    borderColor: '#7E22CE',
    defaultShape: [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  },
  square_4: {
    id: 'square_4',
    name: '4-Square (Tetromino O)',
    size: 4,
    color: '#22C55E', // Emerald Green
    hoverColor: '#4ADE80',
    borderColor: '#15803D',
    defaultShape: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  T_4: {
    id: 'T_4',
    name: '4-T (Tetromino T)',
    size: 4,
    color: '#EF4444', // Crimson Red
    hoverColor: '#F87171',
    borderColor: '#B91C1C',
    defaultShape: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
  },
  Z_4: {
    id: 'Z_4',
    name: '4-Z (Tetromino Z)',
    size: 4,
    color: '#6366F1', // Indigo / Slate
    hoverColor: '#818CF8',
    borderColor: '#4338CA',
    defaultShape: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  },
};

export const ALL_PIECE_IDS: PieceId[] = [
  'monomino',
  'domino',
  'straight_3',
  'corner_3',
  'straight_4',
  'L_4',
  'square_4',
  'T_4',
  'Z_4',
];

export const BOT_DIFFICULTIES: BotDifficulty[] = [
  {
    id: 'beginner',
    name: 'Pawn Bot (Beginner)',
    avgSolveTimeSec: 85,
    description: 'Casual pace, makes deliberate pauses between moves.',
  },
  {
    id: 'intermediate',
    name: 'Knight Bot (Intermediate)',
    avgSolveTimeSec: 45,
    description: 'Solid spatial thinker, steady solving rhythm.',
  },
  {
    id: 'expert',
    name: 'Rook Bot (Expert)',
    avgSolveTimeSec: 25,
    description: 'Fast solver with quick pattern recognition.',
  },
  {
    id: 'genius',
    name: 'Genius AI (Grandmaster)',
    avgSolveTimeSec: 14,
    description: 'Tournament-grade speed. Blazing fast polyomino placement.',
  },
];
