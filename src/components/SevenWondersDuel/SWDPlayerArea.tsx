import React from 'react';
import { SWDPlayerState, SWDGameState, BuildingColor } from '../../games/seven-wonders-duel/types';
import { BUILDINGS, WONDERS, PROGRESS_TOKENS, SCIENTIFIC_SYMBOLS_INFO } from '../../games/seven-wonders-duel/constants';
import { SWDCard } from './SWDCard';
import { getPlayerProduction } from '../../games/seven-wonders-duel/engine';
import { Coins, Shield, Atom, Trophy, Sparkles } from 'lucide-react';

interface SWDPlayerAreaProps {
  player: SWDPlayerState;
  state: SWDGameState;
  isCurrentPlayer: boolean;
  isActiveTurn: boolean;
  onSelectWonder?: (wonderId: number) => void;
}

export const SWDPlayerArea: React.FC<SWDPlayerAreaProps> = ({
  player,
  state,
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
      className={`rounded-2xl border transition-all p-3 sm:p-4 select-none ${
        isActiveTurn
          ? 'bg-slate-900/95 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
          : 'bg-slate-950/80 border-slate-800'
      }`}
    >
      {/* Top Bar: Player Stats & Resources */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Identity & Turn Badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl shadow-inner">
              {player.avatar || '🏛️'}
            </div>
            {isActiveTurn && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                {player.name}
              </span>
              {isCurrentPlayer && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                  YOU
                </span>
              )}
              {player.isBot && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  AI BOT
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> {player.coins} Coins
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <Shield className="w-3.5 h-3.5 text-rose-500" /> {totalShields} Shields
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Atom className="w-3.5 h-3.5 text-emerald-400" /> {uniqueSymbols.length}/6 Science
              </span>
            </div>
          </div>
        </div>

        {/* Resources Produced Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Produces:</span>
          {basic.wood > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-800/60 text-xs font-bold" title="Wood">
              🪵 {basic.wood}
            </span>
          )}
          {basic.clay > 0 && (
            <span className="px-2 py-0.5 rounded bg-orange-950/80 text-orange-200 border border-orange-800/60 text-xs font-bold" title="Clay">
              🧱 {basic.clay}
            </span>
          )}
          {basic.stone > 0 && (
            <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-600/60 text-xs font-bold" title="Stone">
              🪨 {basic.stone}
            </span>
          )}
          {basic.glass > 0 && (
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 text-xs font-bold" title="Glass">
              🧪 {basic.glass}
            </span>
          )}
          {basic.papyrus > 0 && (
            <span className="px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 text-xs font-bold" title="Papyrus">
              📜 {basic.papyrus}
            </span>
          )}
          {flexible.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold" title="Flexible choice from commercial buildings/wonders">
              ✨ +{flexible.length} Choice
            </span>
          )}
          {basic.wood === 0 && basic.clay === 0 && basic.stone === 0 && basic.glass === 0 && basic.papyrus === 0 && flexible.length === 0 && (
            <span className="text-xs text-slate-500 italic">None yet</span>
          )}
        </div>

        {/* Progress Tokens & Science Badges */}
        <div className="flex items-center gap-1">
          {player.progressTokens.map((tid) => (
            <SWDCard key={tid} tokenId={tid} size="compact" />
          ))}
          {uniqueSymbols.map((symId) => (
            <span
              key={symId}
              title={SCIENTIFIC_SYMBOLS_INFO[symId]?.name || `Symbol ${symId}`}
              className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-xs text-emerald-300 font-bold"
            >
              #{symId}
            </span>
          ))}
        </div>
      </div>

      {/* Middle: 4 Wonders Row */}
      <div className="mt-3">
        <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Wonders ({player.wonders.filter((w) => w.isConstructed).length}/4 Constructed):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {player.wonders.map((pw) => {
            const wonder = WONDERS[pw.id];
            if (!wonder) return null;

            return (
              <div
                key={pw.id}
                onClick={() => onSelectWonder?.(pw.id)}
                className={`relative rounded-xl border p-2 flex flex-col justify-between transition-all ${
                  pw.isConstructed
                    ? 'bg-amber-950/40 border-amber-500/70 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-slate-200 truncate font-['Fredoka']">
                    {wonder.name}
                  </span>
                  {pw.isConstructed ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-0.5 shrink-0">
                      <Sparkles className="w-2.5 h-2.5" /> BUILT
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      Unbuilt
                    </span>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-lg aspect-[5/3] my-1">
                  <SWDCard wonderId={wonder.id} size="compact" showTooltip={false} />
                </div>

                {/* Wonder Cost / Effects Summary */}
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                  <span className="font-medium truncate">
                    {wonder.victoryPoints > 0 ? `+${wonder.victoryPoints} VP` : ''}
                    {wonder.extraTurn ? ' • Extra Turn' : ''}
                    {wonder.military ? ` • ${wonder.military} 🛡️` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Constructed City Buildings Columns */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] font-bold text-slate-400 mb-1.5">
          Constructed Buildings ({player.buildings.length}):
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(colorGroups) as BuildingColor[]).map((color) => {
            const cardIds = colorGroups[color];
            if (cardIds.length === 0) return null;

            return (
              <div
                key={color}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-900/80 border border-slate-800"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{
                  backgroundColor:
                    color === 'brown' ? '#92400e' :
                    color === 'grey' ? '#64748b' :
                    color === 'blue' ? '#0284c7' :
                    color === 'green' ? '#10b981' :
                    color === 'yellow' ? '#f59e0b' :
                    color === 'red' ? '#ef4444' : '#a855f7'
                }} />
                <span className="text-xs font-bold text-slate-200 capitalize mr-1">{color} ({cardIds.length}):</span>
                <div className="flex -space-x-4">
                  {cardIds.map((cid) => (
                    <div key={cid} className="hover:z-30 hover:scale-125 transition-transform duration-150">
                      <SWDCard cardId={cid} size="micro" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {player.buildings.length === 0 && (
            <span className="text-xs text-slate-500 italic">No buildings constructed yet</span>
          )}
        </div>
      </div>
    </div>
  );
};
