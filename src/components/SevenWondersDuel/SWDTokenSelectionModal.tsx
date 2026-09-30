import React from 'react';
import { SWDProgressToken } from '../../games/seven-wonders-duel/types';
import { PROGRESS_TOKENS } from '../../games/seven-wonders-duel/constants';
import { SWDCard } from './SWDCard';
import { Sparkles, Atom } from 'lucide-react';

interface SWDTokenSelectionModalProps {
  tokenIds: number[];
  isMyTurn: boolean;
  onSelectToken: (tokenId: number) => void;
  title?: string;
  subtitle?: string;
}

export const SWDTokenSelectionModal: React.FC<SWDTokenSelectionModalProps> = ({
  tokenIds,
  isMyTurn,
  onSelectToken,
  title = 'Select a Progress Token',
  subtitle = 'You earned a matching pair of scientific disciplines or built The Great Library!',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col font-['Outfit']">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 font-['Fredoka']">
              {title}
            </h3>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tokenIds.map((tid) => {
              const token = PROGRESS_TOKENS[tid];
              if (!token) return null;

              return (
                <div
                  key={tid}
                  onClick={() => {
                    if (isMyTurn) onSelectToken(tid);
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    isMyTurn
                      ? 'bg-slate-950/60 border-slate-700 hover:border-emerald-400 hover:bg-slate-950 cursor-pointer hover:scale-[1.02]'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="shrink-0">
                    <SWDCard tokenId={tid} size="small" showTooltip={false} />
                  </div>
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-emerald-300 font-['Fredoka']">
                      {token.name}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {token.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!isMyTurn && (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
              Waiting for active player to select a token...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
