import React, { useState } from 'react';
import { DraftCard, SWDGameState, ResourceType } from '../../games/seven-wonders-duel/types';
import { BUILDINGS, WONDERS, SCIENTIFIC_SYMBOLS_INFO } from '../../games/seven-wonders-duel/constants';
import { calculateCost, calculateDiscardGain } from '../../games/seven-wonders-duel/engine';
import { SWD_RESOURCE_ICONS } from '../../games/seven-wonders-duel/assets';
import { SWDCard } from './SWDCard';
import { X, Hammer, Trash2, Landmark, Sparkles, Check, AlertCircle, ArrowRight, Zap, Shield, Trophy } from 'lucide-react';

interface SWDActionModalProps {
  card: DraftCard | null;
  state: SWDGameState;
  userId: string;
  onClose: () => void;
  onConstructBuilding: (cardId: number) => void;
  onDiscardCard: (cardId: number) => void;
  onConstructWonder: (cardId: number, wonderId: number) => void;
}

export const SWDActionModal: React.FC<SWDActionModalProps> = ({
  card,
  state,
  userId,
  onClose,
  onConstructBuilding,
  onDiscardCard,
  onConstructWonder,
}) => {
  const [selectedWonderId, setSelectedWonderId] = useState<number | null>(null);

  if (!card) return null;

  const building = BUILDINGS[card.id];
  if (!building) return null;

  const player = state.players[userId];
  if (!player) return null;

  // 1. Calculate building cost
  const buildCost = calculateCost(state, userId, {
    type: 'building',
    building,
  });
  const totalBuildCoins = buildCost.requiredCoins + buildCost.totalTradeCost;

  // 2. Calculate discard gain
  const discardGain = calculateDiscardGain(player);
  const yellowBuildingsCount = player.buildings.filter(
    (cid) => BUILDINGS[cid]?.type === 'yellow'
  ).length;

  // 3. Wonders data
  const unconstructedWonders = player.wonders.filter((w) => !w.isConstructed);
  const totalWondersBuilt =
    state.players[state.playerOrder[0]].wonders.filter((w) => w.isConstructed).length +
    state.players[state.playerOrder[1]].wonders.filter((w) => w.isConstructed).length;

  // Active selected wonder (default to first unconstructed wonder)
  const activeWonderId =
    selectedWonderId ?? (unconstructedWonders.length > 0 ? unconstructedWonders[0].id : null);
  const activeWonder = activeWonderId ? WONDERS[activeWonderId] : null;
  const wonderCost = activeWonder
    ? calculateCost(state, userId, { type: 'wonder', wonder: activeWonder })
    : null;
  const totalWonderCoins = wonderCost ? wonderCost.requiredCoins + wonderCost.totalTradeCost : 0;

  // Type styling
  const typeColors: Record<string, { badge: string; border: string }> = {
    brown: { badge: 'bg-amber-950/80 text-amber-200 border-amber-800/60', border: 'from-amber-600/20' },
    grey: { badge: 'bg-slate-800 text-slate-200 border-slate-600/60', border: 'from-slate-500/20' },
    blue: { badge: 'bg-sky-950/80 text-sky-200 border-sky-800/60', border: 'from-sky-600/20' },
    green: { badge: 'bg-emerald-950/80 text-emerald-200 border-emerald-800/60', border: 'from-emerald-600/20' },
    yellow: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', border: 'from-amber-500/20' },
    red: { badge: 'bg-rose-950/80 text-rose-200 border-rose-800/60', border: 'from-rose-600/20' },
    purple: { badge: 'bg-purple-950/80 text-purple-200 border-purple-800/60', border: 'from-purple-600/20' },
  };
  const theme = typeColors[building.type] || typeColors.brown;

  const missingBuildingResources = Object.keys(buildCost.missingResources) as ResourceType[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden text-slate-100 flex flex-col font-['Outfit'] max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 font-['Fredoka'] leading-tight">
                Turn Action
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose 1 of 3 ways to use this card
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Player's Treasury */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-xs font-bold text-amber-300">
              <span className="text-slate-400 font-normal">Treasury:</span>
              <img src={SWD_RESOURCE_ICONS.coins} alt="Coins" className="w-4 h-4 object-contain" />
              <span>{player.coins} Coins</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Cancel & close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Card Hero Banner */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r ${theme.border} to-slate-900/60 border border-slate-800/80`}>
            {/* Card Thumbnail */}
            <div className="shrink-0 drop-shadow-lg">
              <SWDCard cardId={building.id} size="small" showTooltip={false} />
            </div>

            {/* Card Details & Rewards */}
            <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xl font-black text-slate-100 font-['Fredoka']">
                  {building.name}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${theme.badge}`}>
                  {building.type}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800/80 text-slate-300 border border-slate-700">
                  Age {building.age}
                </span>
              </div>

              {/* Rewards / Benefits */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-xs">
                {building.victoryPoints > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" /> +{building.victoryPoints} VP
                  </span>
                )}
                {building.military > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                    <Shield className="w-3.5 h-3.5 text-rose-400" /> +{building.military} Shields
                  </span>
                )}
                {building.scientificSymbol && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                    🔬 #{building.scientificSymbol} {SCIENTIFIC_SYMBOLS_INFO[building.scientificSymbol]?.name}
                  </span>
                )}
                {building.resources?.wood && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-200 border border-amber-800/60 font-bold">
                    <img src={SWD_RESOURCE_ICONS.wood} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.resources.wood} Wood
                  </span>
                )}
                {building.resources?.clay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-950/80 text-orange-200 border border-orange-800/60 font-bold">
                    <img src={SWD_RESOURCE_ICONS.clay} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.resources.clay} Clay
                  </span>
                )}
                {building.resources?.stone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-800 text-stone-200 border border-stone-600/60 font-bold">
                    <img src={SWD_RESOURCE_ICONS.stone} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.resources.stone} Stone
                  </span>
                )}
                {building.resources?.glass && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 font-bold">
                    <img src={SWD_RESOURCE_ICONS.glass} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.resources.glass} Glass
                  </span>
                )}
                {building.resources?.papyrus && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 font-bold">
                    <img src={SWD_RESOURCE_ICONS.papyrus} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.resources.papyrus} Papyrus
                  </span>
                )}
                {building.coins && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    <img src={SWD_RESOURCE_ICONS.coins} className="w-3.5 h-3.5 object-contain" alt="" /> +{building.coins} Coins
                  </span>
                )}
              </div>

              {/* Chain Link Status */}
              {building.freeIfHas && (
                <div className="text-xs">
                  {buildCost.isFreeThroughLink ? (
                    <span className="text-emerald-400 font-bold flex items-center justify-center sm:justify-start gap-1">
                      <Check className="w-3.5 h-3.5" /> Free construction: you own {BUILDINGS[building.freeIfHas]?.name}!
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                      🔗 Free if you owned: <strong className="text-slate-300">{BUILDINGS[building.freeIfHas]?.name}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3 Action Columns: Side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
            {/* ACTION 1: CONSTRUCT BUILDING */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400/60 transition-all shadow-md shadow-amber-500/5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Hammer className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                      1. Construct
                    </span>
                  </div>
                  {buildCost.isFreeThroughLink ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      Free
                    </span>
                  ) : buildCost.canAfford ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                      Affordable
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                      Need Coins
                    </span>
                  )}
                </div>

                {/* Cost Display */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Total Cost:</span>
                    {buildCost.isFreeThroughLink ? (
                      <span className="text-xl font-black text-emerald-400 font-['Fredoka']">
                        FREE
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <img src={SWD_RESOURCE_ICONS.coins} className="w-4 h-4 object-contain" alt="" />
                        <span className="text-xl font-black font-['Fredoka']">
                          {totalBuildCoins}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Coins</span>
                      </div>
                    )}
                  </div>

                  {/* Trade / Resource Details */}
                  {!buildCost.isFreeThroughLink && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 space-y-1">
                      {buildCost.totalTradeCost > 0 ? (
                        <>
                          <div className="text-amber-200/90 font-medium">
                            Bank trade: {buildCost.totalTradeCost} coins
                          </div>
                          {missingBuildingResources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              {missingBuildingResources.map((res) => (
                                <span
                                  key={res}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-amber-200"
                                >
                                  <img src={SWD_RESOURCE_ICONS[res]} className="w-3 h-3 object-contain" alt="" />
                                  <span>{buildCost.missingResources[res]}</span>
                                  <span className="text-slate-400 font-normal">
                                    ({buildCost.tradeCostPerResource[res]}c)
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-emerald-400/90 font-medium">
                          ✓ All resources produced by your city
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={!buildCost.canAfford}
                onClick={() => onConstructBuilding(card.id)}
                className={`w-full mt-4 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  buildCost.canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                {buildCost.canAfford
                  ? buildCost.isFreeThroughLink
                    ? 'Construct for Free'
                    : `Construct (${totalBuildCoins}c)`
                  : `Need ${totalBuildCoins - player.coins} more coins`}
              </button>
            </div>

            {/* ACTION 2: DISCARD FOR COINS */}
            <div className="bg-slate-900/90 border border-yellow-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-yellow-400/60 transition-all shadow-md shadow-yellow-500/5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center border border-yellow-500/30">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                      2. Discard
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 uppercase">
                    Available
                  </span>
                </div>

                {/* Gain Display */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Receive:</span>
                    <div className="flex items-center gap-1.5 text-yellow-300">
                      <img src={SWD_RESOURCE_ICONS.coins} className="w-4 h-4 object-contain" alt="" />
                      <span className="text-xl font-black font-['Fredoka']">
                        +{discardGain}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Coins</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 space-y-0.5">
                    <div>• 2 Base coins</div>
                    {yellowBuildingsCount > 0 && (
                      <div className="text-amber-300 font-medium">
                        • +{yellowBuildingsCount} from {yellowBuildingsCount} yellow commercial building{yellowBuildingsCount === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onDiscardCard(card.id)}
                className="w-full mt-4 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400 transition cursor-pointer hover:scale-[1.02]"
              >
                <img src={SWD_RESOURCE_ICONS.coins} className="w-3.5 h-3.5 object-contain" alt="" />
                Discard & Take +{discardGain}c
              </button>
            </div>

            {/* ACTION 3: BUILD WONDER */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-400/60 transition-all shadow-md shadow-purple-500/5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                      3. Build Wonder
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {totalWondersBuilt}/7 Built
                  </span>
                </div>

                {/* Wonder Picker / Status */}
                {totalWondersBuilt >= 7 ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Global limit reached: 7 Wonders already built.</span>
                  </div>
                ) : unconstructedWonders.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                    All 4 of your civilization wonders are already constructed!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Wonder chips */}
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {unconstructedWonders.map((pw) => {
                        const w = WONDERS[pw.id];
                        if (!w) return null;
                        const wCost = calculateCost(state, userId, {
                          type: 'wonder',
                          wonder: w,
                        });
                        const wTotalCoins = wCost.requiredCoins + wCost.totalTradeCost;
                        const isSelected = activeWonderId === w.id;

                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWonderId(w.id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-purple-950/70 border-purple-400 ring-1 ring-purple-400/60 shadow-md text-white'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="font-bold truncate font-['Fredoka'] mr-2">
                              {w.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <img src={SWD_RESOURCE_ICONS.coins} className="w-3.5 h-3.5 object-contain" alt="" />
                              <span
                                className={`font-black text-[11px] ${
                                  wCost.canAfford ? 'text-emerald-300' : 'text-rose-400'
                                }`}
                              >
                                {wTotalCoins}c
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active Wonder details */}
                    {activeWonder && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-800 space-y-0.5">
                        <div className="text-purple-300 font-bold truncate">
                          {activeWonder.name}
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {activeWonder.victoryPoints > 0 && (
                            <span className="text-amber-300 font-semibold">
                              +{activeWonder.victoryPoints} VP
                            </span>
                          )}
                          {activeWonder.military && (
                            <span className="text-rose-400 font-semibold">
                              • +{activeWonder.military} 🛡️
                            </span>
                          )}
                          {activeWonder.extraTurn && (
                            <span className="text-amber-400 font-semibold">
                              • ⚡ Extra Turn
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                disabled={
                  totalWondersBuilt >= 7 ||
                  unconstructedWonders.length === 0 ||
                  !activeWonderId ||
                  !wonderCost?.canAfford
                }
                onClick={() => {
                  if (activeWonderId) onConstructWonder(card.id, activeWonderId);
                }}
                className={`w-full mt-4 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  wonderCost?.canAfford && totalWondersBuilt < 7 && unconstructedWonders.length > 0
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                {totalWondersBuilt >= 7
                  ? 'Limit Reached (7 Built)'
                  : unconstructedWonders.length === 0
                  ? 'All Wonders Built'
                  : wonderCost?.canAfford
                  ? `Build Wonder (${totalWonderCoins}c)`
                  : `Need ${totalWonderCoins - player.coins} more coins`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
