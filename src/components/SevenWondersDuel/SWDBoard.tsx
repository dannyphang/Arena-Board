import React from 'react';
import { SWDGameState } from '../../games/seven-wonders-duel/types';
import { SWDCard } from './SWDCard';
import { PROGRESS_TOKENS } from '../../games/seven-wonders-duel/constants';
import { SWD_BOARD_IMAGES } from '../../games/seven-wonders-duel/assets';

interface SWDBoardProps {
  state: SWDGameState;
  onSelectToken?: (tokenId: number) => void;
  selectableTokens?: number[];
}

// Maps a conflict position (-9..+9) to a top% on the 740px board.
// Track runs from ~4.8% (pos=-9, p2 capital) to ~91.2% (pos=+9, p1 capital).
function trackTop(pos: number): string {
  return `${4.8 + ((pos + 9) / 18) * 86.4}%`;
}

export const SWDBoard: React.FC<SWDBoardProps> = ({
  state,
  onSelectToken,
  selectableTokens,
}) => {
  const p1Name = state.players[state.playerOrder[0]]?.name || 'Player 1';
  const p2Name = state.players[state.playerOrder[1]]?.name || 'Player 2';

  // Progress token slots: evenly spaced across the 5 positions on the right column
  // Corresponding to conflict positions -6, -3, 0, +3, +6
  const progressSlotPositions = [-6, -3, 0, 3, 6];

  return (
    <div className="flex flex-col items-center select-none">
      {/* Board Title & Conflict Tracker Header */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/95 backdrop-blur-sm rounded-lg border border-amber-900/50 shadow-md text-xs">
        <div className="flex items-center gap-1.5 font-bold text-rose-400">
          <span>🛡️</span>
          <span className="truncate max-w-[85px]">{p2Name}</span>
        </div>
        <div className="font-extrabold text-amber-400 font-['Fredoka'] text-sm tracking-wide">
          {state.conflictPawnPosition === 0 ? (
            <span className="text-slate-300">Neutral (0)</span>
          ) : state.conflictPawnPosition > 0 ? (
            <span className="text-sky-400">+{state.conflictPawnPosition} ({p1Name})</span>
          ) : (
            <span className="text-rose-400">{state.conflictPawnPosition} ({p2Name})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-bold text-sky-400">
          <span className="truncate max-w-[85px]">{p1Name}</span>
          <span>🛡️</span>
        </div>
      </div>

      {/* Main Conflict Board from pterodactylstfw repository */}
      {/* ponytail: overflow-visible required so token tooltips escape the board div */}
      <div
        className="relative shadow-2xl rounded-2xl border-2 border-amber-950/70 bg-stone-950 overflow-visible"
        style={{
          width: '240px',
          height: '740px',
          backgroundImage: `url('${SWD_BOARD_IMAGES.militaryBoard}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Plunder / Military Loss Tokens at ±3 and ±6 on the left of the track */}
        {state.militaryTokens.map((tok) => {
          if (tok.isTaken) return null;
          const isLarge = tok.position === -6 || tok.position === 6;
          return (
            <div
              key={tok.position}
              title={`Plunder Token: Opponent loses ${tok.value} coins when crossed`}
              className="absolute z-10 transition-transform hover:scale-105"
              style={{
                top: trackTop(tok.position),
                left: isLarge ? '5%' : '8%',
                width: isLarge ? '38px' : '32px',
                height: isLarge ? '86px' : '74px',
                transform: 'translateY(-50%)',
              }}
            >
              <img
                src={isLarge ? SWD_BOARD_IMAGES.loot5 : SWD_BOARD_IMAGES.loot2}
                alt={`Loot ${tok.value}`}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
              />
            </div>
          );
        })}

        {/* Military Lead Pawn — z-10 so token tooltips (z-50) render above it */}
        <div
          className="absolute z-10 transition-all duration-500 ease-out pointer-events-none"
          style={{
            top: trackTop(state.conflictPawnPosition),
            left: '28%',
            width: '52px',
            height: '26px',
            transform: 'translateY(-50%)',
          }}
        >
          <img
            src={SWD_BOARD_IMAGES.militaryLead}
            alt="Military Conflict Pawn"
            className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] animate-pulse"
          />
        </div>

        {/* 5 Board Progress Tokens — z-50 so their tooltips show above everything */}
        {state.boardProgressTokens.map((tokenId, index) => {
          const isSelectable = selectableTokens?.includes(tokenId);
          return (
            <div
              key={tokenId}
              className="absolute z-50"
              style={{
                top: trackTop(progressSlotPositions[index]),
                left: '72%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <SWDCard
                tokenId={tokenId}
                size="small"
                isAvailable={isSelectable}
                onClick={() => onSelectToken?.(tokenId)}
              />
            </div>
          );
        })}
      </div>

      {/* Progress Tokens Quick Reference Legend */}
      <div className="w-full mt-2 p-2.5 bg-slate-900/90 rounded-lg border border-amber-900/40 text-[11px] space-y-1.5 shadow-md">
        <div className="font-bold text-slate-300 flex items-center justify-between">
          <span className="text-amber-300">Board Tokens ({state.boardProgressTokens.length}):</span>
          <span className="text-emerald-400 font-medium">Pair = Pick 1</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {state.boardProgressTokens.map((tid) => {
            const t = PROGRESS_TOKENS[tid];
            return (
              <span
                key={tid}
                title={t?.description}
                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-medium hover:border-amber-400 transition-colors"
              >
                {t?.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
