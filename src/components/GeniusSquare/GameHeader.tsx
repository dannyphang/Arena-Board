import React from 'react';
import { CoordString } from '../../games/genius-square/types';
import { sounds } from '../../services/audio';
import { Clock, Lightbulb, RotateCcw, Flag, BookOpen, Dices } from 'lucide-react';

interface GameHeaderProps {
  blockers: CoordString[];
  timeElapsed: number;
  timeLimitSec?: number;
  onHint: () => void;
  onClearBoard: () => void;
  onOpenRules: () => void;
  onResign: () => void;
  isSoloPractice?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  blockers,
  timeElapsed,
  timeLimitSec,
  onHint,
  onClearBoard,
  onOpenRules,
  onResign,
  isSoloPractice = false,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}:${remainingSec < 10 ? '0' : ''}${remainingSec}`;
  };

  const isCountDown = !!timeLimitSec;
  const displayTime = isCountDown
    ? Math.max(0, timeLimitSec - timeElapsed)
    : timeElapsed;
  const isUrgent = isCountDown && displayTime <= 15;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl text-slate-100 flex flex-wrap items-center justify-between gap-3">
      {/* 7 Blockers Preview */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Dices className="w-4 h-4" />
          <span className="hidden sm:inline">Blockers:</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {blockers.map((b) => (
            <span
              key={b}
              className="px-2 py-0.5 rounded-lg bg-stone-800 border border-amber-600/50 text-[11px] font-mono font-bold text-amber-200 shadow-xs"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Center: Live Timer */}
      <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        <Clock
          className={`w-4 h-4 ${
            isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'
          }`}
        />
        <div className="text-right">
          <div
            className={`font-mono text-base sm:text-lg font-black tracking-tight ${
              isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-100'
            }`}
          >
            {formatTime(displayTime)}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            sounds.playPop();
            onHint();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer"
          title="Get a solution hint"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Hint</span>
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            onClearBoard();
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          title="Recall all pieces"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            onOpenRules();
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          title="View Rules"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sounds.playPop();
            onResign();
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition cursor-pointer"
          title="Resign or leave game"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>{isSoloPractice ? 'Exit' : 'Resign'}</span>
        </button>
      </div>
    </div>
  );
};
