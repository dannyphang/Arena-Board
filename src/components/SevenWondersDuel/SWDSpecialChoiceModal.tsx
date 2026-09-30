import React from 'react';
import { SWDGameState } from '../../games/seven-wonders-duel/types';
import { BUILDINGS } from '../../games/seven-wonders-duel/constants';
import { SWDCard } from './SWDCard';
import { Swords, Flame, Sparkles, UserCheck } from 'lucide-react';

interface SWDSpecialChoiceModalProps {
  state: SWDGameState;
  userId: string;
  onChooseStartPlayer: (nextPlayerId: string) => void;
  onDestroyOpponentCard: (cardId: number) => void;
  onChooseDiscardedCard: (cardId: number) => void;
}

export const SWDSpecialChoiceModal: React.FC<SWDSpecialChoiceModalProps> = ({
  state,
  userId,
  onChooseStartPlayer,
  onDestroyOpponentCard,
  onChooseDiscardedCard,
}) => {
  const isMyTurn = state.pendingActionPlayerId === userId || state.activePlayerId === userId;
  const p1 = state.players[state.playerOrder[0]];
  const p2 = state.players[state.playerOrder[1]];
  const opponentId = state.playerOrder[0] === userId ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];

  // 1. Choose Start Player for Next Age
  if (state.currentPhase === 'choose_start_player') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 text-center space-y-4 font-['Outfit']">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-100 font-['Fredoka']">
              Choose Who Plays First in Age {state.currentAge === 2 ? 'II' : 'III'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Due to military positioning, you decide who starts the next Age.
            </p>
          </div>

          {isMyTurn ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => onChooseStartPlayer(userId)}
                className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                I Will Play First
              </button>
              <button
                onClick={() => onChooseStartPlayer(opponentId)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold text-xs transition cursor-pointer"
              >
                Opponent Plays First
              </button>
            </div>
          ) : (
            <div className="p-3 text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-850">
              Waiting for player to decide...
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Destroy Opponent Card
  if (state.currentPhase === 'destroy_opponent_card') {
    const color = state.destroyCardColor || 'brown';
    const destroyableCards = opponent.buildings.filter((id) => BUILDINGS[id]?.type === color);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4 font-['Outfit']">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 font-['Fredoka']">
                Destroy an Opponent's {color.toUpperCase()} Card
              </h3>
              <p className="text-xs text-slate-400">
                Your Wonder effect allows you to remove 1 {color} building from {opponent.name}'s city.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {destroyableCards.map((cid) => (
              <div
                key={cid}
                onClick={() => {
                  if (isMyTurn) onDestroyOpponentCard(cid);
                }}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isMyTurn
                    ? 'bg-slate-950/60 border-slate-700 hover:border-rose-400 hover:scale-105'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <SWDCard cardId={cid} size="small" showTooltip={false} />
                <div className="text-[11px] font-bold text-center mt-1 truncate">
                  {BUILDINGS[cid]?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Choose Discarded Card (Mausoleum)
  if (state.currentPhase === 'choose_discarded_card') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4 font-['Outfit'] max-h-[85vh] flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 font-['Fredoka']">
                The Mausoleum: Reclaim a Discarded Card
              </h3>
              <p className="text-xs text-slate-400">
                Select 1 card from the discard pile to construct for free into your city.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto p-1 flex-1">
            {state.discardPile.map((cid) => (
              <div
                key={cid}
                onClick={() => {
                  if (isMyTurn) onChooseDiscardedCard(cid);
                }}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isMyTurn
                    ? 'bg-slate-950/60 border-slate-700 hover:border-sky-400 hover:scale-105'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <SWDCard cardId={cid} size="small" showTooltip={false} />
                <div className="text-[11px] font-bold text-center mt-1 truncate">
                  {BUILDINGS[cid]?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
