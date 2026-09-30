import React from 'react';
import { SWDPlayerState, SWDGameState, BuildingColor } from '../../games/seven-wonders-duel/types';
import { BUILDINGS, WONDERS, SCIENTIFIC_SYMBOLS_INFO } from '../../games/seven-wonders-duel/constants';
import { SWDCard } from './SWDCard';
import { getPlayerProduction } from '../../games/seven-wonders-duel/engine';
import { SWD_RESOURCE_ICONS } from '../../games/seven-wonders-duel/assets';
import { Shield, Atom, Sparkles } from 'lucide-react';

interface SWDPlayerAreaProps {
  player: SWDPlayerState;
  state: SWDGameState;
  isCurrentPlayer: boolean;
  isActiveTurn: boolean;
  onSelectWonder?: (wonderId: number) => void;
}

export const SWDPlayerArea: React.FC<SWDPlayerAreaProps> = ({
  player,
  isCurrentPlayer,
  isActiveTurn,
  onSelectWonder,
}) => {
  const { basic, flexible } = getPlayerProduction(player);

  // Group constructed cards by type
  const colorGroups: Record<BuildingColor, number[]> = {
    brown: [],
    grey: [],
    blue: [],
    green: [],
    yellow: [],
    red: [],
    purple: [],
  };

  player.buildings.forEach((cid) => {
    const b = BUILDINGS[cid];
    if (b && colorGroups[b.type]) {
      colorGroups[b.type].push(cid);
    }
  });

  // Unique scientific symbols
  const uniqueSymbols = Array.from(new Set(player.scienceSymbols));

  // Total military shields
  let totalShields = 0;
  player.buildings.forEach((cid) => {
    const b = BUILDINGS[cid];
    if (b) totalShields += b.military;
  });
  player.wonders
    .filter((w) => w.isConstructed)
    .forEach((pw) => {
      const w = WONDERS[pw.id];
      if (w && w.military) totalShields += w.military;
    });
  if (player.progressTokens.includes(8)) {
    // Strategy token: +1 shield per red building
    const redCount = colorGroups.red.length;
    totalShields += redCount;
  }

  return (
    <div
      className={`rounded-2xl border transition-all p-2.5 sm:p-3 select-none overflow-visible relative z-30 hover:z-40 ${
        isActiveTurn
          ? 'bg-slate-900/95 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
          : 'bg-slate-950/80 border-slate-800'
      }`}
    >
      {/* Top Bar: Player Identity, Produced Resources & Core Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 border-b border-slate-800/80 overflow-visible relative z-10">
        {/* Identity & Turn Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-base shadow-inner">
              {player.avatar || '🏛️'}
            </div>
            {isActiveTurn && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-100 font-['Fredoka'] truncate max-w-[130px] sm:max-w-[200px]">
                {player.name}
              </span>
              {isCurrentPlayer && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 shrink-0">
                  YOU
                </span>
              )}
              {player.isBot && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 shrink-0">
                  AI
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Resources Produced Strip with real icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800 shadow-inner">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity ${
              basic.wood > 0
                ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60 font-bold'
                : 'opacity-30 text-slate-500'
            }`}
            title={`Wood: ${basic.wood}`}
          >
            <img src={SWD_RESOURCE_ICONS.wood} alt="Wood" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-[11px] sm:text-xs">{basic.wood}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity ${
              basic.clay > 0
                ? 'bg-orange-950/80 text-orange-200 border border-orange-800/60 font-bold'
                : 'opacity-30 text-slate-500'
            }`}
            title={`Clay: ${basic.clay}`}
          >
            <img src={SWD_RESOURCE_ICONS.clay} alt="Clay" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-[11px] sm:text-xs">{basic.clay}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity ${
              basic.stone > 0
                ? 'bg-stone-800/90 text-stone-200 border border-stone-600/60 font-bold'
                : 'opacity-30 text-slate-500'
            }`}
            title={`Stone: ${basic.stone}`}
          >
            <img src={SWD_RESOURCE_ICONS.stone} alt="Stone" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-[11px] sm:text-xs">{basic.stone}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity ${
              basic.glass > 0
                ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 font-bold'
                : 'opacity-30 text-slate-500'
            }`}
            title={`Glass: ${basic.glass}`}
          >
            <img src={SWD_RESOURCE_ICONS.glass} alt="Glass" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-[11px] sm:text-xs">{basic.glass}</span>
          </div>

          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-opacity ${
              basic.papyrus > 0
                ? 'bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 font-bold'
                : 'opacity-30 text-slate-500'
            }`}
            title={`Papyrus: ${basic.papyrus}`}
          >
            <img src={SWD_RESOURCE_ICONS.papyrus} alt="Papyrus" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span className="text-[11px] sm:text-xs">{basic.papyrus}</span>
          </div>

          {flexible.length > 0 && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold"
              title="Flexible choice produced from wonders or commercial buildings"
            >
              <span>✨+{flexible.length}</span>
            </div>
          )}
        </div>

        {/* Player Stats & Progress Tokens */}
        <div className="flex items-center gap-2">
          {/* Coins */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-amber-300 font-bold text-xs"
            title={`${player.coins} Coins`}
          >
            <img src={SWD_RESOURCE_ICONS.coins} alt="Coins" className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain" />
            <span>{player.coins}</span>
          </div>

          {/* Shields */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-rose-400 font-bold text-xs"
            title={`${totalShields} Military Shields`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>{totalShields}</span>
          </div>

          {/* Science */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-emerald-400 font-bold text-xs"
            title={`${uniqueSymbols.length}/6 Scientific Symbols`}
          >
            <Atom className="w-3.5 h-3.5 text-emerald-400" />
            <span>{uniqueSymbols.length}/6</span>
          </div>

          {/* Discovered science symbols */}
          {uniqueSymbols.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5">
              {uniqueSymbols.map((symId) => (
                <span
                  key={symId}
                  title={SCIENTIFIC_SYMBOLS_INFO[symId]?.name || `Symbol ${symId}`}
                  className="w-5 h-5 rounded-full bg-emerald-950/90 border border-emerald-500/60 flex items-center justify-center text-[10px] text-emerald-300 font-bold"
                >
                  #{symId}
                </span>
              ))}
            </div>
          )}

          {/* Progress Tokens */}
          {player.progressTokens.length > 0 && (
            <div className="flex items-center gap-1 overflow-visible">
              {player.progressTokens.map((tid) => (
                <SWDCard key={tid} tokenId={tid} size="compact" tooltipSide="left" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards Area: Just display the card! Wonders on left, Constructed Buildings on right */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-2.5 overflow-visible relative z-30 hover:z-50">
        {/* Wonders: The 4 Wonder Cards displayed directly */}
        <div className="flex items-center gap-2 shrink-0 overflow-visible">
          {player.wonders.map((pw) => {
            const wonder = WONDERS[pw.id];
            if (!wonder) return null;

            return (
              <div
                key={pw.id}
                onClick={() => onSelectWonder?.(pw.id)}
                className={`relative group/wonder transition-transform overflow-visible ${
                  onSelectWonder && !pw.isConstructed ? 'cursor-pointer hover:scale-105' : ''
                }`}
              >
                <SWDCard
                  wonderId={wonder.id}
                  size="compact"
                  showTooltip={true}
                  tooltipSide="right"
                  tooltipVertical={isCurrentPlayer ? 'bottom' : 'top'}
                  isSelected={false}
                />
                {pw.isConstructed && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 shadow-md border border-amber-300 z-10 flex items-center gap-0.5 tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" /> BUILT
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Subtle vertical divider between Wonders and City Buildings on large screens */}
        <div className="hidden lg:block w-px h-16 bg-slate-800/80 shrink-0 mx-1" />

        {/* City Buildings: Just display the constructed cards grouped by color */}
        <div className="flex-1 flex flex-wrap items-center gap-2 overflow-visible py-0.5 min-h-[40px]">
          {(Object.keys(colorGroups) as BuildingColor[]).map((color) => {
            const cardIds = colorGroups[color];
            if (cardIds.length === 0) return null;

            return (
              <div
                key={color}
                className="flex -space-x-10 hover:space-x-1 transition-all items-center p-0.5 rounded-lg bg-slate-900/40 border border-slate-800/50 overflow-visible"
              >
                {cardIds.map((cid) => (
                  <div
                    key={cid}
                    className="hover:z-50 hover:scale-110 transition-transform duration-150 relative overflow-visible"
                  >
                    <SWDCard
                      cardId={cid}
                      size="compact"
                      showTooltip={true}
                      tooltipSide={color === 'purple' || color === 'red' ? 'left' : 'right'}
                      tooltipVertical={isCurrentPlayer ? 'bottom' : 'top'}
                    />
                  </div>
                ))}
              </div>
            );
          })}
          {player.buildings.length === 0 && (
            <div className="text-[11px] text-slate-500 italic px-2">
              No buildings constructed yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
