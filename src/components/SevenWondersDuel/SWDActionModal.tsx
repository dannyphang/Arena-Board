import React, { useState } from 'react';
import { DraftCard, SWDGameState, CostBreakdown } from '../../games/seven-wonders-duel/types';
import { BUILDINGS, WONDERS, SCIENTIFIC_SYMBOLS_INFO } from '../../games/seven-wonders-duel/constants';
import { calculateCost, calculateDiscardGain } from '../../games/seven-wonders-duel/engine';
import { SWDCard } from './SWDCard';
import { X, Hammer, Trash2, Landmark, Sparkles, Coins, AlertCircle, Check } from 'lucide-react';

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

  const buildCost: CostBreakdown = calculateCost(state, userId, {
    type: 'building',
    building,
  });

  const discardGain = calculateDiscardGain(player);

  const unconstructedWonders = player.wonders.filter((w) => !w.isConstructed);
  const totalWondersBuilt =
    state.players[state.playerOrder[0]].wonders.filter((w) => w.isConstructed).length +
    state.players[state.playerOrder[1]].wonders.filter((w) => w.isConstructed).length;

  const totalBuildCoins = buildCost.requiredCoins + buildCost.totalTradeCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-['Outfit'] max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 font-['Fredoka']">
                Action: {building.name}
              </h3>
              <p className="text-xs text-slate-400">
                Choose how to use this card in your turn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Card Showcase Banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="shrink-0">
              <SWDCard cardId={building.id} size="normal" showTooltip={false} />
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-100 font-['Fredoka']">
                  {building.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {building.type}
                </span>
              </div>
              <div>Age: {building.age}</div>
              {building.victoryPoints > 0 && (
                <div className="text-amber-300 font-semibold">🏆 Victory Points: +{building.victoryPoints}</div>
              )}
              {building.military > 0 && (
                <div className="text-rose-400 font-semibold">🛡️ Military Shields: +{building.military}</div>
              )}
              {building.scientificSymbol && (
                <div className="text-emerald-300 font-semibold">
                  🔬 Scientific Discipline: {SCIENTIFIC_SYMBOLS_INFO[building.scientificSymbol]?.name || `#${building.scientificSymbol}`}
                </div>
              )}
              {building.freeIfHas && (
                <div className="text-sky-300">
                  🔗 Free if you have: <strong className="text-white">{BUILDINGS[building.freeIfHas]?.name}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Action 1: Construct Building */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-400" />
                <h4 className="font-extrabold text-slate-100 font-['Fredoka']">
                  1. Construct Building
                </h4>
              </div>
              <div>
                {buildCost.isFreeThroughLink ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    FREE via Chain Link!
                  </span>
                ) : (
                  <span className="font-bold text-amber-300 text-sm">
                    Cost: {totalBuildCoins} Coin{totalBuildCoins === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>

            {/* Cost Details */}
            {!buildCost.isFreeThroughLink && (
              <div className="text-xs text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                {buildCost.totalTradeCost > 0 && (
                  <div>
                    Trade from bank: <strong className="text-amber-300">{buildCost.totalTradeCost} coins</strong> for missing resources
                  </div>
                )}
                {buildCost.requiredCoins > 0 && (
                  <div>
                    Building coin cost: <strong className="text-amber-300">{buildCost.requiredCoins} coins</strong>
                  </div>
                )}
                {buildCost.totalTradeCost === 0 && buildCost.requiredCoins === 0 && (
                  <div className="text-emerald-400 font-medium">
                    All required resources are produced by your city!
                  </div>
                )}
              </div>
            )}

            <button
              disabled={!buildCost.canAfford}
              onClick={() => onConstructBuilding(card.id)}
              className={`w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                buildCost.canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-[1.01]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Hammer className="w-4 h-4" />
              {buildCost.canAfford
                ? `Construct ${building.name} (${buildCost.isFreeThroughLink ? 'Free' : `${totalBuildCoins} coins`})`
                : `Cannot Afford (Need ${totalBuildCoins} coins, you have ${player.coins})`}
            </button>
          </div>

          {/* Action 2: Discard for Coins */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-yellow-400" />
                <h4 className="font-extrabold text-slate-100 font-['Fredoka']">
                  2. Discard for Coins
                </h4>
              </div>
              <span className="font-extrabold text-yellow-300 text-sm flex items-center gap-1">
                <Coins className="w-4 h-4" /> +{discardGain} Coins
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Discard this card to receive 2 coins plus 1 additional coin per Yellow commercial building in your city.
            </p>

            <button
              onClick={() => onDiscardCard(card.id)}
              className="w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition cursor-pointer hover:scale-[1.01]"
            >
              <Coins className="w-4 h-4" />
              Discard Card & Take +{discardGain} Coins
            </button>
          </div>

          {/* Action 3: Construct a Wonder */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-purple-400" />
                <h4 className="font-extrabold text-slate-100 font-['Fredoka']">
                  3. Construct a Wonder
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {totalWondersBuilt}/7 Wonders Built Worldwide
              </span>
            </div>

            {totalWondersBuilt >= 7 ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Maximum limit reached: 7 Wonders have already been built in this game.</span>
              </div>
            ) : unconstructedWonders.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                You have already constructed all 4 of your wonders.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">
                  Select which wonder to construct using this card:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unconstructedWonders.map((pw) => {
                    const wonder = WONDERS[pw.id];
                    if (!wonder) return null;

                    const wonderCost = calculateCost(state, userId, {
                      type: 'wonder',
                      wonder,
                    });

                    const totalWCoins = wonderCost.requiredCoins + wonderCost.totalTradeCost;
                    const isSelected = selectedWonderId === wonder.id;

                    return (
                      <div
                        key={wonder.id}
                        onClick={() => setSelectedWonderId(wonder.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/50'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs text-slate-200 font-['Fredoka']">
                            {wonder.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              wonderCost.canAfford
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {totalWCoins} Coins
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {wonder.victoryPoints > 0 ? `+${wonder.victoryPoints} VP` : ''}
                          {wonder.extraTurn ? ' • Play Again' : ''}
                          {wonder.military ? ` • ${wonder.military} Shields` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedWonderId && (
                  <button
                    onClick={() => onConstructWonder(card.id, selectedWonderId)}
                    disabled={
                      !calculateCost(state, userId, {
                        type: 'wonder',
                        wonder: WONDERS[selectedWonderId],
                      }).canAfford
                    }
                    className="w-full py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 transition cursor-pointer mt-2"
                  >
                    <Landmark className="w-4 h-4" />
                    Construct {WONDERS[selectedWonderId]?.name}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
