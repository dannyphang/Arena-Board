import React, { useState, useEffect } from 'react';
import { UserProfile, MatchRecord } from '../types/user';
import { getStoredMatches } from '../services/storage';
import {
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  History,
  Award,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';

interface UserStatsSummaryCardProps {
  user: UserProfile;
  onOpenProfile?: () => void;
}

export const UserStatsSummaryCard: React.FC<UserStatsSummaryCardProps> = ({
  user,
  onOpenProfile,
}) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  useEffect(() => {
    setMatches(getStoredMatches());
  }, [user]);

  const winRate =
    user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;

  // Rank title and tier based on ELO
  const getRankInfo = (rating: number) => {
    if (rating >= 1600) return { title: 'Grandmaster', color: 'text-purple-400', badge: 'bg-purple-500/20 border-purple-500/30' };
    if (rating >= 1400) return { title: 'Diamond Strategist', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/30' };
    if (rating >= 1300) return { title: 'Gold Tactician', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' };
    if (rating >= 1200) return { title: 'Silver Competitor', color: 'text-slate-300', badge: 'bg-slate-700/50 border-slate-600/50' };
    return { title: 'Bronze Challenger', color: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500/30' };
  };

  const rank = getRankInfo(user.rating);

  // Compute rating trajectory from match history
  // Matches in storage are newest first. Reverse to get chronologic order
  const recentMatches = matches.slice(0, 10).reverse();

  let ratingHistory: { rating: number; change?: number; label: string; result?: string; opponent?: string }[] = [];

  if (recentMatches.length === 0) {
    // Baseline if no matches played yet
    ratingHistory = [
      { rating: 1200, label: 'Initial Placement' },
      { rating: user.rating, label: 'Current' },
    ];
  } else {
    // Reconstruct rating at each step backwards from current rating
    let runningRating = user.rating;
    const pointsReversed: { rating: number; change?: number; label: string; result?: string; opponent?: string }[] = [];

    // Most recent is current rating
    pointsReversed.push({
      rating: runningRating,
      label: 'Current Rating',
      result: recentMatches[recentMatches.length - 1]?.result,
      opponent: recentMatches[recentMatches.length - 1]?.opponentName,
    });

    for (let i = recentMatches.length - 1; i >= 0; i--) {
      const m = recentMatches[i];
      const change = m.ratingChange || 0;
      runningRating -= change;
      pointsReversed.push({
        rating: runningRating,
        change,
        label: `vs ${m.opponentName}`,
        result: m.result,
        opponent: m.opponentName,
      });
    }

    ratingHistory = pointsReversed.reverse();
  }

  // Calculate net rating change across the window
  const startRating = ratingHistory[0]?.rating ?? 1200;
  const netRatingChange = user.rating - startRating;

  // Chart dimensions & math
  const chartWidth = 260;
  const chartHeight = 64;
  const padX = 14;
  const padY = 12;

  const minRating = Math.min(...ratingHistory.map((p) => p.rating), 1180);
  const maxRating = Math.max(...ratingHistory.map((p) => p.rating), 1220);
  const ratingRange = maxRating - minRating || 1;

  const coords = ratingHistory.map((pt, i) => {
    const x = padX + (i / Math.max(1, ratingHistory.length - 1)) * (chartWidth - 2 * padX);
    const y = chartHeight - padY - ((pt.rating - minRating) / ratingRange) * (chartHeight - 2 * padY);
    return { x, y, ...pt };
  });

  const linePathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPathD =
    coords.length > 0
      ? `${linePathD} L ${coords[coords.length - 1].x},${chartHeight} L ${coords[0].x},${chartHeight} Z`
      : '';

  // Circular progress for win rate
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden font-['Outfit']">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Strip: User Profile & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-2xl shadow-md shadow-orange-500/20 border border-amber-300/30 shrink-0">
            {user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-100 font-['Fredoka']">
                {user.username}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${rank.badge} ${rank.color}`}>
                {rank.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Level {user.level}</span>
              <span aria-hidden="true">•</span>
              <span>{user.badges?.[0] || 'Active Competitor'}</span>
              {user.country && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{user.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-amber-400 border border-slate-700/60 hover:border-amber-400/40 transition cursor-pointer self-start sm:self-auto"
          >
            <History className="w-3.5 h-3.5" />
            <span>Full Profile & History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Core 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 relative z-10">
        {/* Pillar 1: Total Games Played */}
        <div className="bg-slate-950/50 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Games Played
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {user.wins}W - {Math.max(0, user.gamesPlayed - user.wins)}L
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-100 font-['Fredoka']">
              {user.gamesPlayed}
            </span>
            <span className="text-xs text-slate-400">Total Matches</span>
          </div>

          {/* Ratio bar */}
          <div className="space-y-1.5 pt-2">
            <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${winRate}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
                title={`${user.wins} Wins (${winRate}%)`}
              />
              <div
                style={{ width: `${100 - winRate}%` }}
                className="h-full bg-slate-700/80 rounded-r-full transition-all duration-500"
                title={`${user.gamesPlayed - user.wins} Losses`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span className="text-emerald-400">Wins: {user.wins}</span>
              <span className="text-slate-400">Losses: {Math.max(0, user.gamesPlayed - user.wins)}</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Win Rate Percentage */}
        <div className="bg-slate-950/50 border border-slate-800/70 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Win Rate
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-3xl font-black text-emerald-400 font-['Fredoka']">
                {winRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-[130px] leading-tight mt-1">
              {winRate >= 60
                ? 'Outstanding winning momentum!'
                : winRate >= 50
                ? 'Positive win/loss ratio.'
                : user.gamesPlayed === 0
                ? 'Ready for your first match!'
                : 'Climbing the tabletop ranks.'}
            </p>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="35"
                cy="35"
                r={radius}
                className="stroke-emerald-400 transition-all duration-700 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute text-center">
              <Trophy className="w-4 h-4 text-emerald-400 mx-auto" />
            </div>
          </div>
        </div>

        {/* Pillar 3: ELO Rating & History Trendline */}
        <div className="bg-slate-950/50 border border-slate-800/70 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> ELO Rating
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-400 font-['Fredoka']">
                  {user.rating}
                </span>
                {netRatingChange !== 0 && (
                  <span
                    className={`inline-flex items-center text-xs font-bold ${
                      netRatingChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {netRatingChange > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    )}
                    {netRatingChange > 0 ? `+${netRatingChange}` : netRatingChange}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block">Peak: {Math.max(...ratingHistory.map((p) => p.rating), user.rating)}</span>
              <span className="text-[10px] text-slate-500 font-mono block">Low: {Math.min(...ratingHistory.map((p) => p.rating), user.rating)}</span>
            </div>
          </div>

          {/* SVG Sparkline Curve */}
          <div className="relative pt-2">
            <svg
              className="w-full h-14 overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Baseline guide line */}
              <line
                x1={0}
                y1={chartHeight - padY - ((1200 - minRating) / ratingRange) * (chartHeight - 2 * padY)}
                x2={chartWidth}
                y2={chartHeight - padY - ((1200 - minRating) / ratingRange) * (chartHeight - 2 * padY)}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Area fill */}
              {areaPathD && <path d={areaPathD} fill="url(#ratingGradient)" />}

              {/* Trendline */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Nodes */}
              {coords.map((pt, i) => {
                const isHovered = hoveredPointIndex === i;
                const isLast = i === coords.length - 1;
                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : isLast ? 4 : 2.5}
                      className={`transition-all duration-150 cursor-pointer ${
                        isLast
                          ? 'fill-amber-400 stroke-slate-900 stroke-2'
                          : pt.result === 'win'
                          ? 'fill-emerald-400 stroke-slate-900 stroke-1'
                          : pt.result === 'loss'
                          ? 'fill-rose-400 stroke-slate-900 stroke-1'
                          : 'fill-amber-300 stroke-slate-900 stroke-1'
                      }`}
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip or Subtext */}
            <div className="h-4 flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
              {hoveredPointIndex !== null && coords[hoveredPointIndex] ? (
                <span className="text-amber-300 font-semibold truncate">
                  {coords[hoveredPointIndex].label}: {coords[hoveredPointIndex].rating} ELO
                  {coords[hoveredPointIndex].change
                    ? ` (${coords[hoveredPointIndex].change! > 0 ? '+' : ''}${coords[hoveredPointIndex].change})`
                    : ''}
                </span>
              ) : (
                <>
                  <span>10-Match Trend</span>
                  <span>1200 Baseline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
