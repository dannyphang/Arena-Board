import React from 'react';
import { UserProfile, MatchRecord } from '../types/user';
import { getStoredMatches } from '../services/storage';
import { sounds } from '../services/audio';
import { X, Trophy, Award, Clock, Target, Calendar, User, Zap, Shield, Brain } from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onEditProfile,
}) => {
  if (!isOpen) return null;

  const matches: MatchRecord[] = getStoredMatches();
  const winRate =
    user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-slate-900">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 border border-amber-300/40">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-100 font-['Fredoka']">
                  {user.username}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Level {user.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ArenaBoard Competitor • Tabletop Strategist
              </p>
              <button
                onClick={() => {
                  sounds.playPop();
                  onClose();
                  onEditProfile();
                }}
                className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                Edit Avatar or Handle →
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <div className="flex justify-center mb-1 text-amber-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 font-medium">Rating</div>
              <div className="text-lg font-black text-amber-400">{user.rating}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <div className="flex justify-center mb-1 text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 font-medium">Win Rate</div>
              <div className="text-lg font-black text-emerald-400">{winRate}%</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <div className="flex justify-center mb-1 text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 font-medium">Best Time</div>
              <div className="text-lg font-black text-cyan-400">
                {user.bestTimeSeconds ? `${user.bestTimeSeconds}s` : '--'}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
              <div className="flex justify-center mb-1 text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 font-medium">Matches</div>
              <div className="text-lg font-black text-slate-200">
                {user.gamesPlayed} ({user.wins}W)
              </div>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Achievements & Badges
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5 inline text-amber-400" />
                <span>New Challenger</span>
              </div>
              {user.wins >= 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <Trophy className="w-3.5 h-3.5 inline text-emerald-400" />
                  <span>First Blood</span>
                </div>
              )}
              {user.bestTimeSeconds && user.bestTimeSeconds < 40 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 inline text-indigo-400" />
                  <span>Speed Demon (&lt;40s)</span>
                </div>
              )}
              {user.gamesPlayed >= 5 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                  <Brain className="w-3.5 h-3.5 inline text-purple-400" />
                  <span>Polyomino Veteran</span>
                </div>
              )}
            </div>
          </div>

          {/* Match History */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Recent Match History
            </div>
            {matches.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 text-center text-slate-400 text-xs">
                No recent matches recorded yet. Jump into an arena match to start your record!
              </div>
            ) : (
              <div className="space-y-2">
                {matches.slice(0, 5).map((m, idx) => (
                  <div
                    key={`${m.id || 'match'}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{m.opponentAvatar}</span>
                      <div>
                        <div className="font-semibold text-slate-200">
                          vs {m.opponentName}
                        </div>
                        <div className="text-[10px] text-slate-500">{m.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`font-bold uppercase tracking-wider ${
                            m.result === 'win'
                              ? 'text-emerald-400'
                              : m.result === 'loss'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {m.result}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.timeSeconds}s
                        </div>
                      </div>
                      <div
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          m.ratingChange >= 0
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {m.ratingChange >= 0 ? `+${m.ratingChange}` : m.ratingChange}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
