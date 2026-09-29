import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../services/audio';
import { Trophy, Swords, Home, Eye, Sparkles, RotateCcw } from 'lucide-react';
import { AvatarSvg } from '../Catan/CatanIcons';

interface VictoryModalProps {
  isOpen: boolean;
  isWinner: boolean;
  winnerName: string;
  winnerAvatar: string;
  timeSeconds: number;
  isDraw?: boolean;
  forfeit?: boolean;
  onRematch: () => void;
  onReturnLobby: () => void;
  onShowSolution?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  isWinner,
  winnerName,
  winnerAvatar,
  timeSeconds,
  isDraw = false,
  forfeit = false,
  onRematch,
  onReturnLobby,
  onShowSolution,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isWinner) {
        sounds.playVictory();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        sounds.playBuzz();
      }
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 text-center p-6 sm:p-8">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            isWinner ? 'bg-amber-400' : 'bg-rose-500'
          }`}
        />

        {/* Big Avatar / Trophy */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 shadow-xl shadow-orange-500/30 border border-amber-300/40">
          <AvatarSvg avatar={winnerAvatar} size={36} />
          {isWinner && (
            <div className="absolute -top-2 -right-2 p-1.5 bg-amber-400 text-slate-950 rounded-full shadow-md">
              <Trophy className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl font-black font-['Fredoka'] mb-1">
          {isWinner ? (
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent">
              GENIUS VICTORY!
            </span>
          ) : (
            <span className="text-rose-400">Match Completed</span>
          )}
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 font-medium">
          {isWinner
            ? `Spectacular solve! You conquered the square in ${timeSeconds}s.`
            : forfeit
            ? `${winnerName} won by opponent forfeit.`
            : `${winnerName} conquered the board first in ${timeSeconds}s.`}
        </p>

        {/* Match recap box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500 font-semibold mb-1">Champion</div>
            <div className="text-slate-200 font-bold truncate">{winnerName}</div>
          </div>
          <div>
            <div className="text-slate-500 font-semibold mb-1">Solve Time</div>
            <div className="text-amber-400 font-bold font-mono text-sm">
              {timeSeconds}s
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              sounds.playPop();
              onRematch();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play again
          </button>

          {onShowSolution && (
            <button
              onClick={() => {
                sounds.playPop();
                onShowSolution();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              View Computer Solution
            </button>
          )}

          <button
            onClick={() => {
              sounds.playPop();
              onReturnLobby();
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Arena Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
