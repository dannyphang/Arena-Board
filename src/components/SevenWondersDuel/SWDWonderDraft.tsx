import React from 'react';
import { SWDGameState } from '../../games/seven-wonders-duel/types';
import { WONDERS } from '../../games/seven-wonders-duel/constants';
import { SWDCard } from './SWDCard';
import { Landmark, Sparkles, UserCheck } from 'lucide-react';

interface SWDWonderDraftProps {
  state: SWDGameState;
  userId: string;
  onDraftWonder: (wonderId: number) => void;
}

export const SWDWonderDraft: React.FC<SWDWonderDraftProps> = ({
  state,
  userId,
  onDraftWonder,
}) => {
  const isMyTurn = state.activePlayerId === userId;
  const activePlayer = state.players[state.activePlayerId];
  const p1 = state.players[state.playerOrder[0]];
  const p2 = state.players[state.playerOrder[1]];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 select-none font-['Outfit']">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-purple-600/20 border border-amber-500/30 text-center space-y-2 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
          <Landmark className="w-4 h-4" /> Wonder Selection • Round {state.wonderDraftRound} of 2
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Fredoka']">
          Draft Your Civilizations' Great Wonders
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          {state.wonderDraftRound === 1
            ? `${p1?.name} drafts 1 wonder, then ${p2?.name} drafts 2 wonders, and ${p1?.name} takes the remaining wonder.`
            : `${p2?.name} drafts 1 wonder, then ${p1?.name} drafts 2 wonders, and ${p2?.name} takes the remaining wonder.`}
        </p>

        <div className="pt-2">
          {isMyTurn ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/30 animate-bounce">
              <Sparkles className="w-4 h-4" /> It is YOUR TURN to pick a Wonder!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 text-sm font-semibold">
              <UserCheck className="w-4 h-4" /> Waiting for {activePlayer?.name} to select...
            </div>
          )}
        </div>
      </div>

      {/* Available Wonders Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider text-center">
          Available Wonders in Draft Pool:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.wonderDraftPool.map((wid) => {
            const wonder = WONDERS[wid];
            if (!wonder) return null;

            return (
              <div
                key={wid}
                onClick={() => {
                  if (isMyTurn) onDraftWonder(wid);
                }}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isMyTurn
                    ? 'bg-slate-900 border-amber-400/80 hover:border-amber-300 shadow-lg shadow-amber-500/10 cursor-pointer hover:scale-105 hover:bg-slate-850'
                    : 'bg-slate-900/60 border-slate-800 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                      {wonder.name}
                    </span>
                    {wonder.victoryPoints > 0 && (
                      <span className="text-xs font-bold text-amber-300">
                        +{wonder.victoryPoints} VP
                      </span>
                    )}
                  </div>
                  <div className="aspect-[5/3] overflow-hidden rounded-xl mb-3 flex items-center justify-center">
                    <SWDCard wonderId={wid} size="normal" showTooltip={false} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-[11px] text-slate-400">
                    {wonder.extraTurn && <span className="text-amber-300 font-bold">⚡ Play Again • </span>}
                    {wonder.military && <span className="text-rose-400 font-bold">🛡️ +{wonder.military} Shields • </span>}
                    {wonder.coins && <span className="text-amber-400 font-bold">💰 +{wonder.coins} Coins • </span>}
                    {wonder.opponentCoinLoss && <span className="text-rose-300 font-bold">💸 Opponent -{wonder.opponentCoinLoss} Coins • </span>}
                    {wonder.resourceChoice && (
                      <span className="text-emerald-300 font-bold">✨ Choice ({wonder.resourceChoice.join('/')}) • </span>
                    )}
                    {wonder.discardBuildingTake && <span className="text-sky-300 font-bold">📜 Take from discard • </span>}
                    {wonder.progressTokenFromBox && <span className="text-purple-300 font-bold">🔬 Pick token from box • </span>}
                    {wonder.destroyOpponentBrown && <span className="text-amber-500 font-bold">⚡ Destroy opponent brown • </span>}
                    {wonder.destroyOpponentGrey && <span className="text-slate-400 font-bold">⚡ Destroy opponent grey • </span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-0.5">Cost:</span>
                    {wonder.cost?.wood ? <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-800/60 text-[10px] font-bold">🪵 {wonder.cost.wood}</span> : null}
                    {wonder.cost?.clay ? <span className="px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-200 border border-orange-800/60 text-[10px] font-bold">🧱 {wonder.cost.clay}</span> : null}
                    {wonder.cost?.stone ? <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-600/60 text-[10px] font-bold">🪨 {wonder.cost.stone}</span> : null}
                    {wonder.cost?.glass ? <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 text-[10px] font-bold">🧪 {wonder.cost.glass}</span> : null}
                    {wonder.cost?.papyrus ? <span className="px-1.5 py-0.5 rounded bg-yellow-950/80 text-yellow-200 border border-yellow-800/60 text-[10px] font-bold">📜 {wonder.cost.papyrus}</span> : null}
                  </div>

                  {isMyTurn && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDraftWonder(wid);
                      }}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
                    >
                      Select {wonder.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drafted Wonders Preview for Both Players */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        {[p1, p2].map((p) => {
          if (!p) return null;
          return (
            <div key={p.userId} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-300">
                <span className="text-lg">{p.avatar}</span>
                <span>{p.name}’s Drafted Wonders ({p.wonders.length}/4):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.wonders.map((w) => (
                  <div key={w.id} className="w-24">
                    <SWDCard wonderId={w.id} size="compact" />
                  </div>
                ))}
                {p.wonders.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No wonders drafted yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
