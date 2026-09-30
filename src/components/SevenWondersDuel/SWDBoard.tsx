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

// Maps a conflict position (-9..+9) to a top% on the board.
// Measured from military_board.png (268x949):
// Center oval (pos=0) is at 50.23% (y=476.7).
// Step per position is 4.78% (45.36px per step).
function trackTop(pos: number): string {
  return `${50.23 + pos * 4.78}%`;
}

// 5 printed circle slots on the green right panel:
// Measured from military_board.png: cx = 80.2% (215px / 268px)
// cy: 29.4%, 39.7%, 50.0%, 60.2%, 70.1%
const PROGRESS_TOKEN_SLOTS = [
  { top: '29.4%', left: '80.2%' },
  { top: '39.7%', left: '80.2%' },
  { top: '50.0%', left: '80.2%' },
  { top: '60.2%', left: '80.2%' },
  { top: '70.1%', left: '80.2%' },
];

// 4 printed rounded rectangle slots on the left for plunder/loot tokens:
// Measured directly from military_board.png (268x949):
// -6 (Northern Loot 5): top = 16.1%, left = 16.8%, width = 45px, height = 105px
// -3 (Northern Loot 2): top = 30.1%, left = 15.5%, width = 40px, height = 94px
// +3 (Southern Loot 2): top = 69.9%, left = 15.5%, width = 40px, height = 94px
// +6 (Southern Loot 5): top = 83.7%, left = 16.8%, width = 45px, height = 105px
const LOOT_TOKEN_SLOTS: Record<number, { top: string; left: string; width: string; height: string }> = {
  [-6]: { top: '16.1%', left: '16.8%', width: '45px', height: '105px' },
  [-3]: { top: '30.1%', left: '15.5%', width: '40px', height: '94px' },
  [3]:  { top: '69.9%', left: '15.5%', width: '40px', height: '94px' },
  [6]:  { top: '83.7%', left: '16.8%', width: '45px', height: '105px' },
};

export const SWDBoard: React.FC<SWDBoardProps> = ({
  state,
  onSelectToken,
  selectableTokens,
}) => {
  const p1Name = state.players[state.playerOrder[0]]?.name || 'Player 1';
  const p2Name = state.players[state.playerOrder[1]]?.name || 'Player 2';

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
          const slot = LOOT_TOKEN_SLOTS[tok.position] || {
            top: trackTop(tok.position),
            left: isLarge ? '16.8%' : '15.5%',
            width: isLarge ? '45px' : '40px',
            height: isLarge ? '105px' : '94px',
          };
          return (
            <div
              key={tok.position}
              title={`Plunder Token: Opponent loses ${tok.value} coins when crossed`}
              className="absolute z-10 transition-transform hover:scale-105"
              style={{
                top: slot.top,
                left: slot.left,
                width: slot.width,
                height: slot.height,
                transform: 'translate(-50%, -50%)',
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

        {/* Military Lead Pawn — centered exactly on the track ovals */}
        <div
          className="absolute z-10 transition-all duration-500 ease-out pointer-events-none"
          style={{
            top: trackTop(state.conflictPawnPosition),
            left: '43.1%',
            width: '50px',
            height: '24px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={SWD_BOARD_IMAGES.militaryLead}
            alt="Military Conflict Pawn"
            className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] animate-pulse"
          />
        </div>

        {/* 5 Board Progress Tokens — aligned with the 5 printed circular slots */}
        {state.boardProgressTokens.map((tokenId, index) => {
          const isSelectable = selectableTokens?.includes(tokenId);
          const slot = PROGRESS_TOKEN_SLOTS[index] || { top: '50.0%', left: '80.2%' };
          return (
            <div
              key={tokenId}
              className="absolute z-50"
              style={{
                top: slot.top,
                left: slot.left,
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
