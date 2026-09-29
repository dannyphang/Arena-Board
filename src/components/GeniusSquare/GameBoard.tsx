import React, { useState } from 'react';
import { Coord, CoordString, PieceId, PlacedPiece } from '../../games/genius-square/types';
import {
  COL_LETTERS,
  GRID_SIZE,
  PIECES,
  ROW_NUMBERS,
  coordToString,
  stringToCoord,
} from '../../games/genius-square/constants';
import { PieceOrientation, validatePlacement } from '../../games/genius-square/solver';
import { sounds } from '../../services/audio';
import { X, AlertTriangle } from 'lucide-react';

interface GameBoardProps {
  blockers: CoordString[];
  placedPieces: PlacedPiece[];
  selectedOrientation: PieceOrientation | null;
  onPiecePlaced: (piece: PlacedPiece) => void;
  onPieceRemoved: (pieceId: PieceId) => void;
  isInteractive?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  blockers,
  placedPieces,
  selectedOrientation,
  onPiecePlaced,
  onPieceRemoved,
  isInteractive = true,
}) => {
  const [hoverCell, setHoverCell] = useState<Coord | null>(null);

  // Set of blocker coordinate strings
  const blockerSet = new Set(blockers);

  // Map of "row,col" -> { pieceId, isPlaced }
  const cellOccupancy = new Map<string, { pieceId: PieceId; piece: PlacedPiece }>();
  placedPieces.forEach((piece) => {
    piece.coords.forEach(([r, c]) => {
      cellOccupancy.set(`${r},${c}`, { pieceId: piece.pieceId, piece });
    });
  });

  // Calculate ghost preview coordinates
  let ghostCoords: Coord[] = [];
  let isGhostValid = false;
  let invalidReason = '';

  if (selectedOrientation && hoverCell && isInteractive) {
    const [anchorR, anchorC] = hoverCell;
    ghostCoords = selectedOrientation.shape.map(([dr, dc]) => [
      anchorR + dr,
      anchorC + dc,
    ]);

    const val = validatePlacement(
      selectedOrientation.pieceId,
      ghostCoords,
      blockers,
      placedPieces
    );
    isGhostValid = val.valid;
    invalidReason = val.reason || '';
  }

  const handleCellClick = (r: number, c: number) => {
    if (!isInteractive) return;

    const cellKey = `${r},${c}`;
    const occupied = cellOccupancy.get(cellKey);

    // If clicking on an existing placed piece and no piece is currently selected:
    // recall/remove that piece so it can be repositioned!
    if (!selectedOrientation && occupied) {
      sounds.playSnap();
      onPieceRemoved(occupied.pieceId);
      return;
    }

    // If a piece is selected and we click a cell:
    if (selectedOrientation) {
      if (isGhostValid && ghostCoords.length > 0) {
        sounds.playSnap();
        onPiecePlaced({
          pieceId: selectedOrientation.pieceId,
          orientationIndex: selectedOrientation.orientationIndex,
          row: r,
          col: c,
          coords: ghostCoords,
        });
      } else {
        sounds.playBuzz();
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Top Column Letter Headers */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2 mb-1.5 w-full max-w-[340px] sm:max-w-[420px] px-6 sm:px-8">
        {COL_LETTERS.map((letter) => (
          <div
            key={letter}
            className="text-center font-mono font-bold text-xs sm:text-sm text-amber-400/90 tracking-wider"
          >
            {letter}
          </div>
        ))}
      </div>

      <div className="flex items-center w-full max-w-[340px] sm:max-w-[420px]">
        {/* Left Row Number Headers */}
        <div className="flex flex-col justify-around h-full py-2 pr-1.5 sm:pr-2 text-right">
          {ROW_NUMBERS.map((num) => (
            <div
              key={num}
              className="h-10 sm:h-13 flex items-center justify-end font-mono font-bold text-xs sm:text-sm text-amber-400/90"
            >
              {num}
            </div>
          ))}
        </div>

        {/* 6x6 Wooden Board Frame */}
        <div className="relative flex-1 p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950 border-4 border-amber-800/80 shadow-2xl shadow-black/80 ring-1 ring-amber-500/30">
          <div
            className="grid grid-cols-6 gap-1.5 sm:gap-2 bg-slate-950/90 p-2 sm:p-2.5 rounded-xl border border-amber-900/60 shadow-inner"
            onMouseLeave={() => setHoverCell(null)}
          >
            {Array.from({ length: GRID_SIZE }).map((_, r) =>
              Array.from({ length: GRID_SIZE }).map((_, c) => {
                const coordStr = coordToString(r, c);
                const isBlocker = blockerSet.has(coordStr);
                const occupied = cellOccupancy.get(`${r},${c}`);
                const isGhost = ghostCoords.some(
                  ([gr, gc]) => gr === r && gc === c
                );

                let cellBg = 'bg-slate-900/80';
                let cellBorder = 'border-slate-800/90';
                let cellContent: React.ReactNode = null;

                if (isBlocker) {
                  // Cylindrical wooden blocker with brass ring
                  cellBg =
                    'bg-gradient-to-br from-amber-900 via-stone-800 to-black';
                  cellBorder = 'border-amber-600/70';
                  cellContent = (
                    <div className="w-full h-full rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-stone-700 to-stone-900 border-2 border-amber-400/60 shadow-md shadow-black/60 transform scale-90">
                      <span className="text-[9px] sm:text-[11px] font-mono font-black text-amber-200 tracking-tighter">
                        {coordStr}
                      </span>
                    </div>
                  );
                } else if (occupied) {
                  // Placed piece cell
                  const pieceDef = PIECES[occupied.pieceId];
                  cellBg = '';
                  cellContent = (
                    <div
                      className="w-full h-full rounded-lg flex items-center justify-center shadow-md relative group cursor-pointer transition transform hover:scale-[1.03]"
                      style={{
                        backgroundColor: pieceDef.color,
                        border: `2px solid ${pieceDef.borderColor}`,
                        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.5)`,
                      }}
                      title={`Click to pick up ${pieceDef.name}`}
                    >
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-white/90 drop-shadow">
                        {coordStr}
                      </span>
                    </div>
                  );
                } else if (isGhost) {
                  // Ghost hover preview
                  const ghostColor = isGhostValid
                    ? selectedOrientation
                      ? PIECES[selectedOrientation.pieceId].color
                      : '#22c55e'
                    : '#ef4444';

                  cellBg = isGhostValid ? 'bg-emerald-500/30' : 'bg-rose-500/40';
                  cellBorder = isGhostValid
                    ? 'border-emerald-400'
                    : 'border-rose-400';
                  cellContent = (
                    <div
                      className="w-full h-full rounded-lg animate-pulse flex items-center justify-center opacity-85"
                      style={{
                        backgroundColor: isGhostValid ? ghostColor : '#ef4444',
                        border: `2px dashed ${
                          isGhostValid ? '#ffffff' : '#fecaca'
                        }`,
                      }}
                    >
                      <span className="text-[10px] font-mono font-bold text-white/90 flex items-center justify-center">
                        {isGhostValid ? coordStr : <X className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={coordStr}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => setHoverCell([r, c])}
                    className={`relative w-10 h-10 sm:w-13 sm:h-13 rounded-xl border flex items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${cellBg} ${cellBorder} ${
                      !occupied && !isBlocker
                        ? 'hover:border-amber-400/60 hover:bg-slate-800/80 shadow-inner'
                        : ''
                    }`}
                  >
                    {cellContent || (
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-700/60 select-none">
                        {coordStr}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Row Number Headers */}
        <div className="flex flex-col justify-around h-full py-2 pl-1.5 sm:pr-2 text-left">
          {ROW_NUMBERS.map((num) => (
            <div
              key={num}
              className="h-10 sm:h-13 flex items-center justify-start font-mono font-bold text-xs sm:text-sm text-amber-400/90"
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Column Letter Headers */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2 mt-1.5 w-full max-w-[340px] sm:max-w-[420px] px-6 sm:px-8">
        {COL_LETTERS.map((letter) => (
          <div
            key={letter}
            className="text-center font-mono font-bold text-xs sm:text-sm text-amber-400/90 tracking-wider"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Placement guide tooltip if hovering invalid */}
      {selectedOrientation && hoverCell && !isGhostValid && (
        <div className="mt-2 text-xs font-semibold text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800 animate-in fade-in flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 inline text-rose-400" />
          <span>{invalidReason || 'Cannot place here'}</span>
        </div>
      )}
    </div>
  );
};
