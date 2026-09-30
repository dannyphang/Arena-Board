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

export const SWDBoard: React.FC<SWDBoardProps> = ({
  state,
  onSelectToken,
  selectableTokens,
}) => {
  const p1Name = state.players[state.playerOrder[0]]?.name || 'Player 1';
  const p2Name = state.players[state.playerOrder[1]]?.name || 'Player 2';

  // Conflict Pawn vertical position:
  // -9 (p2 capital) -> 0 (center) -> +9 (p1 capital)
  // Normalized 0..1: (pos + 9) / 18
  const pawnProgress = (state.conflictPawnPosition + 9) / 18;
  const pawnTopPercent = 4.8 + pawnProgress * 86.4;

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
      <div
        className="relative shadow-2xl rounded-2xl overflow-hidden border-2 border-amber-950/70 bg-stone-950"
        style={{
          width: '240px',
          height: '740px',
          backgroundImage: `url('${SWD_BOARD_IMAGES.militaryBoard}')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Plunder / Military Loss Tokens (-6, -3, +3, +6) */}
        {state.militaryTokens.map((tok) => {
          if (tok.isTaken) return null;
          // Config for placement alongside military track
          const posMap: Record<number, { top: string; left: string; width: string; height: string; img: string }> = {
            '-6': { top: '16.5%', left: '7%', width: '38px', height: '86px', img: SWD_BOARD_IMAGES.loot5 },
            '-3': { top: '30.5%', left: '8%', width: '32px', height: '74px', img: SWD_BOARD_IMAGES.loot2 },
            '3': { top: '61.2%', left: '8%', width: '32px', height: '74px', img: SWD_BOARD_IMAGES.loot2 },
            '6': { top: '75.2%', left: '7%', width: '38px', height: '86px', img: SWD_BOARD_IMAGES.loot5 },
          };
          const cfg = posMap[tok.position];
          if (!cfg) return null;

          return (
            <div
              key={tok.position}
              title={`Plunder Token: Opponent loses ${tok.value} coins when crossed`}
              className="absolute z-10 transition-transform hover:scale-105"
              style={{
                top: cfg.top,
                left: cfg.left,
                width: cfg.width,
                height: cfg.height,
              }}
            >
              <img
                src={cfg.img}
                alt={`Loot ${tok.value}`}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
              />
            </div>
          );
        })}

        {/* Military Lead Pawn (slidable along the track) */}
        <div
          className="absolute z-20 transition-all duration-500 ease-out pointer-events-none"
          style={{
            top: `${pawnTopPercent}%`,
            left: '27.5%',
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

        {/* 5 Board Progress Tokens in the right-column slots */}
        <div
          className="absolute flex flex-col items-center justify-between z-15"
          style={{
            top: '23%',
            bottom: '19%',
            left: '61%',
            width: '60px',
          }}
        >
          {state.boardProgressTokens.map((tokenId) => {
            const isSelectable = selectableTokens?.includes(tokenId);
            return (
              <div key={tokenId} className="relative group my-auto">
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
