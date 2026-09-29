import React from 'react';
import { ALL_PIECE_IDS, PIECES } from '../../games/genius-square/constants';
import { PieceId, PlacedPiece } from '../../games/genius-square/types';
import { PieceOrientation } from '../../games/genius-square/solver';
import { sounds } from '../../services/audio';
import { RotateCw, FlipHorizontal, X, Undo2, Check } from 'lucide-react';

interface PieceTrayProps {
  placedPieces: PlacedPiece[];
  selectedOrientation: PieceOrientation | null;
  onSelectOrientation: (ori: PieceOrientation | null) => void;
  onRotate: () => void;
  onFlip: () => void;
  onRecallAll: () => void;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  placedPieces,
  selectedOrientation,
  onSelectOrientation,
  onRotate,
  onFlip,
  onRecallAll,
}) => {
  const placedPieceIds = new Set(placedPieces.map((p) => p.pieceId));
  const remainingCount = ALL_PIECE_IDS.length - placedPieceIds.size;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl text-slate-100">
      {/* Top action / status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Piece Dock
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {remainingCount} Remaining
          </span>
        </div>

        {/* Selected piece controls */}
        {selectedOrientation ? (
          <div className="flex items-center gap-1.5 animate-in fade-in">
            <span className="text-xs font-semibold text-amber-400 mr-1 hidden sm:inline">
              {PIECES[selectedOrientation.pieceId].name}:
            </span>

            <button
              onClick={() => {
                sounds.playRotate();
                onRotate();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Rotate 90 degrees clockwise (Shortcut: R)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
              <kbd className="hidden sm:inline text-[9px] bg-slate-900/40 text-slate-950 px-1 rounded">
                R
              </kbd>
            </button>

            <button
              onClick={() => {
                sounds.playRotate();
                onFlip();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
              title="Flip horizontally (Shortcut: F)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip</span>
              <kbd className="hidden sm:inline text-[9px] bg-slate-900/40 text-slate-950 px-1 rounded">
                F
              </kbd>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                onSelectOrientation(null);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Deselect piece (Shortcut: Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          placedPieces.length > 0 && (
            <button
              onClick={() => {
                sounds.playPop();
                onRecallAll();
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Recall All
            </button>
          )
        )}
      </div>

      {/* 9 Pieces Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
        {ALL_PIECE_IDS.map((id) => {
          const pieceDef = PIECES[id];
          const isPlaced = placedPieceIds.has(id);
          const isSelected = selectedOrientation?.pieceId === id;

          // Determine current orientation shape for rendering in card
          const renderShape = isSelected
            ? selectedOrientation.shape
            : pieceDef.defaultShape;

          // Bounding box of piece
          let maxR = 0;
          let maxC = 0;
          renderShape.forEach(([r, c]) => {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
          });
          const rows = maxR + 1;
          const cols = maxC + 1;

          return (
            <button
              key={id}
              disabled={isPlaced}
              onClick={() => {
                if (isPlaced) return;
                sounds.playPop();
                if (isSelected) {
                  // Rotate if already selected
                  onRotate();
                } else {
                  // Select default orientation
                  onSelectOrientation({
                    pieceId: id,
                    orientationIndex: 0,
                    shape: pieceDef.defaultShape,
                    rows: Math.max(...pieceDef.defaultShape.map((p) => p[0])) + 1,
                    cols: Math.max(...pieceDef.defaultShape.map((p) => p[1])) + 1,
                  });
                }
              }}
              className={`relative h-22 sm:h-24 p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer overflow-hidden ${
                isPlaced
                  ? 'opacity-30 bg-slate-950/40 border-slate-800 cursor-not-allowed'
                  : isSelected
                  ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20 scale-[1.03]'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 shadow-sm'
              }`}
            >
              {/* Placed badge */}
              {isPlaced && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10">
                  <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                </div>
              )}

              {/* Piece shape render */}
              <div className="flex-1 flex items-center justify-center w-full">
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateRows: `repeat(${rows}, 12px)`,
                    gridTemplateColumns: `repeat(${cols}, 12px)`,
                  }}
                >
                  {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: cols }).map((_, c) => {
                      const isCell = renderShape.some(
                        ([pr, pc]) => pr === r && pc === c
                      );
                      return (
                        <div
                          key={`${r}-${c}`}
                          className="w-3 h-3 rounded-xs"
                          style={{
                            backgroundColor: isCell
                              ? pieceDef.color
                              : 'transparent',
                            border: isCell
                              ? `1px solid ${pieceDef.borderColor}`
                              : 'none',
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Label & size */}
              <div className="w-full text-center mt-1">
                <div className="text-[10px] font-bold text-slate-300 truncate">
                  {pieceDef.name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  {pieceDef.size} sq
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
