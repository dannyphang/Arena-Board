export type Coord = [number, number]; // [row, col] 0..5

export type CoordString = `${'A' | 'B' | 'C' | 'D' | 'E' | 'F'}${1 | 2 | 3 | 4 | 5 | 6}`;

export type PieceId =
  | 'monomino'     // 1 cell (brown)
  | 'domino'       // 2 cells (orange)
  | 'straight_3'   // 3 cells (yellow)
  | 'corner_3'     // 3 cells (cyan)
  | 'straight_4'   // 4 cells (blue)
  | 'L_4'          // 4 cells (purple)
  | 'square_4'     // 4 cells (green)
  | 'T_4'          // 4 cells (red)
  | 'Z_4';         // 4 cells (indigo)

export interface PieceDef {
  id: PieceId;
  name: string;
  size: number;
  color: string;
  hoverColor: string;
  borderColor: string;
  defaultShape: Coord[]; // relative coordinates from (0,0)
}

export interface PlacedPiece {
  pieceId: PieceId;
  orientationIndex: number;
  row: number; // anchor top-left row on grid
  col: number; // anchor top-left col on grid
  coords: Coord[]; // absolute board coordinates
}

export interface GeniusSquareState {
  blockers: CoordString[]; // 7 coordinate strings, e.g. ["A1", "C2", ...]
  placedPieces: PlacedPiece[];
  filledCells: number; // total filled out of 29 required
  isComplete: boolean;
  timeElapsed: number; // seconds
}

export interface BotDifficulty {
  id: 'beginner' | 'intermediate' | 'expert' | 'genius';
  name: string;
  avgSolveTimeSec: number;
  description: string;
}
