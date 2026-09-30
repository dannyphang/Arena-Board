import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SWDGameState } from '../../games/seven-wonders-duel/types';
import { Trophy, Swords, Atom, Landmark, RotateCcw, Home } from 'lucide-react';

interface SWDGameOverModalProps {
  state: SWDGameState;
  userId: string;
  onRestart: () => void;
  onExit: () => void;
}

export const SWDGameOverModal: React.FC<SWDGameOverModalProps> = ({
  state,
  userId,
  onRestart,
  onExit,
}) => {
  const winner = state.winner;
  if (!winner) return null;

  const isMeWinner = winner.userId === userId;
  const winningPlayer = state.players[winner.userId];
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];
  const p1 = state.players[p1Id];
  const p2 = state.players[p2Id];

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const reasonTitles = {
    military: 'Military Supremacy Victory!',
    science: 'Scientific Supremacy Victory!',
    civilian: 'Civilian Victory (Points Total)!',
  }[winner.reason];

  const scores = winner.scores;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-['Outfit']">
        {/* Top Victory Header */}
        <div className="px-6 pt-8 pb-6 text-center space-y-3 bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            {winner.reason === 'military' ? (
              <Swords className="w-8 h-8 text-rose-400" />
            ) : winner.reason === 'science' ? (
              <Atom className="w-8 h-8 text-emerald-400" />
            ) : (
              <Trophy className="w-8 h-8 text-amber-400" />
            )}
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              {reasonTitles}
            </div>
            <h2 className="text-3xl font-black text-slate-100 font-['Fredoka']">
              {isMeWinner ? 'Victory is Yours!' : `${winningPlayer?.name} Triumphed!`}
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
              {winner.reason === 'military'
                ? `${winningPlayer?.name} marched into the opposing capital and claimed complete military domination.`
                : winner.reason === 'science'
                ? `${winningPlayer?.name} gathered 6 scientific disciplines and unlocked the secrets of civilization.`
                : 'After 3 Ages of empire building, the scores have been tallied across all monuments and achievements.'}
            </p>
          </div>
        </div>

        {/* Scores Table (for Civilian Victory or overview) */}
        {scores && (
          <div className="px-6 py-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              Civilization Victory Point Breakdown
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-bold text-sky-400 text-right">{p1.name}</th>
                    <th className="py-2.5 px-3 font-bold text-rose-400 text-right">{p2.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Civilian Buildings (Blue)
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.civilian || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.civilian || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Scientific Buildings (Green)
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.science || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.science || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Military Track
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.military || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.military || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> Constructed Wonders
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.wonders || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.wonders || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-teal-400" /> Progress Tokens
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.tokens || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.tokens || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> Guilds (Purple)
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.guilds || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.guilds || 0}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" /> Treasury (1 VP per 3 Coins)
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p1Id]?.treasury || 0}</td>
                    <td className="py-2 px-3 text-right font-semibold">{scores[p2Id]?.treasury || 0}</td>
                  </tr>
                  <tr className="bg-slate-900/90 font-extrabold text-sm text-white">
                    <td className="py-3 px-3">TOTAL VICTORY POINTS</td>
                    <td className="py-3 px-3 text-right text-amber-300 font-['Fredoka'] text-base">
                      {scores[p1Id]?.total || 0}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-300 font-['Fredoka'] text-base">
                      {scores[p2Id]?.total || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
          <button
            onClick={onExit}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Home className="w-4 h-4" /> Return to Lobby
          </button>
          <button
            onClick={onRestart}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Rematch / Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
