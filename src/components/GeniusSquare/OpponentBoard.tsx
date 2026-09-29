import React from 'react';
import { CoordString } from '../../games/genius-square/types';
import {
  COL_LETTERS,
  GRID_SIZE,
  PIECES,
  ROW_NUMBERS,
  coordToString,
} from '../../games/genius-square/constants';
import { PlayerSlot } from '../../types/lobby';
import { Trophy, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { AvatarSvg } from '../Catan/CatanIcons';

interface OpponentBoardProps {
  opponent: PlayerSlot | null;
  blockers: CoordString[];
}

export const OpponentBoard: React.FC<OpponentBoardProps> = ({
  opponent,
  blockers,
}) => {
  const blockerSet = new Set(blockers);
  const progress = opponent?.boardProgress;
  const placedPieces = progress?.placedPieces || [];

  const filledCells = progress?.filledCells || 0;
  const percent = Math.min(100, Math.round((filledCells / 29) * 100));

  // Map "r,c" to piece
  const cellMap = new Map<string, string>();
  placedPieces.forEach((p) => {
    p.coords.forEach(([r, c]) => {
      cellMap.set(`${r},${c}`, p.pieceId);
    });
  });

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 flex flex-col items-center">
      {/* Opponent Profile Header */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner overflow-hidden">
            <AvatarSvg avatar={opponent?.avatar || 'bot'} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-100 font-['Fredoka']">
                {opponent ? opponent.username : 'Waiting for Opponent...'}
              </span>
              {opponent?.isBot && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI
                </span>
              )}
            </div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <Trophy className="w-3 h-3 inline" />
              {opponent ? `${opponent.rating} ELO` : '---'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-300">
            {progress?.isComplete ? (
              <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-400" />
                Finished!
              </span>
            ) : opponent ? (
              <span className="text-amber-400 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Racing...
              </span>
            ) : (
              <span className="text-slate-500">Idle</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            {placedPieces.length}/9 pieces
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-3">
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
          <span>Grid Progress</span>
          <span className="text-amber-400 font-mono">
            {filledCells}/29 cells ({percent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Mini 6x6 Opponent Board */}
      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const coordStr = coordToString(r, c);
              const isBlocker = blockerSet.has(coordStr);
              const pieceId = cellMap.get(`${r},${c}`);

              let bg = 'bg-slate-900/60';
              let border = 'border-slate-800';

              if (isBlocker) {
                bg = 'bg-stone-800 border-amber-500/50';
              } else if (pieceId) {
                const pDef = PIECES[pieceId as keyof typeof PIECES];
                return (
                  <div
                    key={coordStr}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-all duration-150 shadow-sm"
                    style={{
                      backgroundColor: pDef?.color || '#3b82f6',
                      border: `1.5px solid ${pDef?.borderColor || '#1d4ed8'}`,
                    }}
                    title={coordStr}
                  >
                    <span className="text-[8px] font-mono font-bold text-white/80">
                      {coordStr}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={coordStr}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border flex items-center justify-center ${bg} ${border}`}
                  title={coordStr}
                >
                  {isBlocker && (
                    <div className="w-3.5 h-3.5 rounded-full bg-stone-900 border border-amber-400/60" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
