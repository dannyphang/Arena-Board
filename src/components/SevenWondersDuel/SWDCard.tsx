import React from 'react';
import { SWDBuilding, SWDWonder, SWDProgressToken } from '../../games/seven-wonders-duel/types';
import { BUILDINGS, WONDERS, PROGRESS_TOKENS } from '../../games/seven-wonders-duel/constants';
import {
  SWD_BUILDING_IMAGES,
  SWD_WONDER_IMAGES,
  SWD_TOKEN_IMAGES,
  SWD_CARD_BACKS,
} from '../../games/seven-wonders-duel/assets';

interface SWDCardProps {
  cardId?: number;
  building?: SWDBuilding;
  wonderId?: number;
  wonder?: SWDWonder;
  tokenId?: number;
  progressToken?: SWDProgressToken;
  isFaceUp?: boolean;
  age?: number | string;
  size?: 'normal' | 'small' | 'compact' | 'micro';
  isAvailable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  showTooltip?: boolean;
}

export const SWDCard: React.FC<SWDCardProps> = ({
  cardId,
  building: propBuilding,
  wonderId,
  wonder: propWonder,
  tokenId,
  progressToken: propToken,
  isFaceUp = true,
  age = 1,
  size = 'normal',
  isAvailable = false,
  isSelected = false,
  onClick,
  showTooltip = true,
}) => {
  const building = propBuilding || (cardId ? BUILDINGS[cardId] : undefined);
  const wonder = propWonder || (wonderId ? WONDERS[wonderId] : undefined);
  const token = propToken || (tokenId ? PROGRESS_TOKENS[tokenId] : undefined);

  // 1. Progress Token rendering
  if (token || tokenId) {
    const t = token || PROGRESS_TOKENS[tokenId!];
    if (!t) return null;
    const imgUrl = SWD_TOKEN_IMAGES[t.id] || '/swd/pterodactyl/tokens/agriculture.png';

    const tokenDimensions = {
      normal: 'w-14 h-14',
      small: 'w-11 h-11',
      compact: 'w-8 h-8',
      micro: 'w-6 h-6',
    }[size];

    return (
      <div className="relative group/card flex items-center justify-center">
        <div
          onClick={onClick}
          className={`relative rounded-full shadow-lg transition-all select-none overflow-hidden ${
            isAvailable ? 'ring-2 ring-emerald-400 cursor-pointer hover:scale-110 hover:shadow-emerald-500/40' : ''
          } ${tokenDimensions}`}
        >
          <img
            src={imgUrl}
            alt={t.name}
            className="w-full h-full object-contain rounded-full bg-amber-950/40"
            loading="lazy"
          />
        </div>
        {/* Token info card — right side */}
        {showTooltip && (
          <div className="absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 w-52 p-3 rounded-xl bg-slate-950/95 backdrop-blur-sm border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-0 group-hover/card:opacity-100 pointer-events-none transition-opacity duration-200 z-[200] flex flex-col gap-2">
            {imgUrl && (
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border border-slate-800 shadow-inner">
                <img src={imgUrl} alt={t.name} className="w-full h-full object-contain bg-amber-950/40" loading="lazy" />
              </div>
            )}
            <div className="text-center font-extrabold text-slate-100 text-sm font-['Fredoka']">{t.name}</div>
            <div className="text-center text-xs text-emerald-300 font-medium">{t.description}</div>
          </div>
        )}
      </div>
    );
  }

  // 2. Wonder rendering
  if (wonder || wonderId) {
    const w = wonder || WONDERS[wonderId!];
    if (!w) return null;
    const imgUrl = SWD_WONDER_IMAGES[w.id] || '/swd/pterodactyl/wonders/the_pyramids.png';

    const wonderDimensions = {
      normal: 'w-48 h-32',
      small: 'w-36 h-24',
      compact: 'w-28 h-18',
      micro: 'w-20 h-14',
    }[size];

    return (
      <div
        onClick={onClick}
        className={`relative rounded-xl border border-amber-800/80 shadow-xl transition-all select-none overflow-hidden bg-slate-900 ${
          isAvailable ? 'ring-2 ring-amber-400 hover:ring-4 cursor-pointer hover:scale-105 hover:shadow-amber-500/30' : ''
        } ${isSelected ? 'ring-4 ring-emerald-400 scale-105 shadow-emerald-500/40' : ''} ${wonderDimensions}`}
      >
        <img src={imgUrl} alt={w.name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute bottom-1 inset-x-1 text-center">
          <span className="text-[10px] sm:text-xs font-bold font-['Fredoka'] text-amber-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] truncate block px-1">
            {w.name}
          </span>
        </div>
      </div>
    );
  }

  // 3. Building / Age Card rendering
  const b = building;

  const cardDimensions = {
    normal: 'w-24 h-36 sm:w-28 sm:h-42',
    small: 'w-20 h-30 sm:w-22 sm:h-34',
    compact: 'w-16 h-24 sm:w-18 sm:h-28',
    micro: 'w-12 h-18 sm:w-14 sm:h-21',
  }[size];

  if (!isFaceUp) {
    const backUrl = SWD_CARD_BACKS[age || 1] || SWD_CARD_BACKS[1];
    return (
      <div className={`relative rounded-lg shadow-md border border-slate-700/80 select-none overflow-hidden bg-slate-900 ${cardDimensions}`}>
        <img src={backUrl} alt={`Age ${age} Card Back`} className="w-full h-full object-cover rounded-lg" loading="lazy" />
        <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />
      </div>
    );
  }

  if (!b) return null;

  const imgUrl = SWD_BUILDING_IMAGES[b.id];

  const colorBorders: Record<string, string> = {
    brown: 'border-amber-900 shadow-amber-950/40',
    grey: 'border-slate-500 shadow-slate-900/40',
    blue: 'border-sky-500 shadow-sky-900/40',
    green: 'border-emerald-500 shadow-emerald-900/40',
    yellow: 'border-amber-400 shadow-amber-900/40',
    red: 'border-rose-500 shadow-rose-900/40',
    purple: 'border-purple-500 shadow-purple-900/40',
  };

  return (
    <div className="relative group/card flex items-center justify-center">
      <div
        onClick={isAvailable ? onClick : undefined}
        className={`relative rounded-lg border-2 shadow-lg transition-all select-none overflow-hidden bg-slate-900 ${
          colorBorders[b.type] || 'border-slate-700'
        } ${
          isAvailable
            ? 'cursor-pointer ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-950'
            : 'opacity-95'
        } ${isSelected ? 'ring-4 ring-emerald-400 scale-105 z-30' : ''} ${cardDimensions}`}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={b.name} className="w-full h-full object-cover rounded-md" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs font-bold text-slate-300">
            {b.name}
          </div>
        )}
        {isAvailable && (
          <div className="absolute inset-0 bg-amber-400/10 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Building info card — right side */}
      {showTooltip && isFaceUp && (
        <div className="absolute left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 w-48 sm:w-56 p-3 rounded-xl bg-slate-950/95 backdrop-blur-sm border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-0 group-hover/card:opacity-100 pointer-events-none transition-opacity duration-200 z-[200] flex flex-col gap-2">
          {imgUrl && (
            <div className="w-full aspect-[4/6] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
              <img src={imgUrl} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="text-center font-extrabold text-slate-100 text-sm font-['Fredoka']">{b.name}</div>

          <div className="space-y-1.5 text-xs">
            <div className="flex flex-wrap items-center justify-center gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Cost:</span>
              {(!b.cost || Object.keys(b.cost).length === 0) ? (
                <span className="text-[10px] font-bold text-slate-400">Free</span>
              ) : (
                <>
                  {b.cost?.wood ? <span className="px-1 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-800/60 text-[10px] font-bold">🪵 {b.cost.wood}</span> : null}
                  {b.cost?.clay ? <span className="px-1 py-0.5 rounded bg-orange-950/80 text-orange-200 border border-orange-800/60 text-[10px] font-bold">🧱 {b.cost.clay}</span> : null}
                  {b.cost?.stone ? <span className="px-1 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-600/60 text-[10px] font-bold">🪨 {b.cost.stone}</span> : null}
                  {b.cost?.glass ? <span className="px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 text-[10px] font-bold">🧪 {b.cost.glass}</span> : null}
                  {b.cost?.papyrus ? <span className="px-1 py-0.5 rounded bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 text-[10px] font-bold">📜 {b.cost.papyrus}</span> : null}
                  {b.cost?.coins ? <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">🪙 {b.cost.coins}</span> : null}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 pt-1 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Reward:</span>
              {b.victoryPoints ? <span className="text-amber-300 font-bold px-1 text-[10px]">🏆 +{b.victoryPoints} VP</span> : null}
              {b.military ? <span className="text-rose-400 font-bold px-1 text-[10px]">🛡️ +{b.military}</span> : null}
              {b.coins ? <span className="text-amber-400 font-bold px-1 text-[10px]">🪙 +{b.coins}</span> : null}
              {b.scientificSymbol ? <span className="text-emerald-300 font-bold px-1 text-[10px]">🔬 #{b.scientificSymbol}</span> : null}
              {b.resources?.wood ? <span className="px-1 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-800/60 text-[10px] font-bold">🪵 {b.resources.wood}</span> : null}
              {b.resources?.clay ? <span className="px-1 py-0.5 rounded bg-orange-950/80 text-orange-200 border border-orange-800/60 text-[10px] font-bold">🧱 {b.resources.clay}</span> : null}
              {b.resources?.stone ? <span className="px-1 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-600/60 text-[10px] font-bold">🪨 {b.resources.stone}</span> : null}
              {b.resources?.glass ? <span className="px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 text-[10px] font-bold">🧪 {b.resources.glass}</span> : null}
              {b.resources?.papyrus ? <span className="px-1 py-0.5 rounded bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 text-[10px] font-bold">📜 {b.resources.papyrus}</span> : null}
              {b.resourceChoice && (
                <span className="px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-800/60 text-[10px] font-bold">
                  ✨ {b.resourceChoice.join('/')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
