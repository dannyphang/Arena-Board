import React, { useState } from 'react';
import { TableRoom, GameType } from '../types/lobby';
import { UserProfile } from '../types/user';
import { UserStatsSummaryCard } from './UserStatsSummaryCard';
import { sounds } from '../services/audio';
import {
  Swords,
  Bot,
  Play,
  Users,
  Trophy,
  Lock,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle,
  Search,
  Gamepad2,
  Dices,
  Compass,
  RotateCw,
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  lobbies: TableRoom[];
  onRefreshLobbies: () => void;
  onOpenCreateTable: (gameId?: GameType | '') => void;
  onJoinTable: (tableId: string, code?: string) => void;
  onOpenRules: () => void;
  onOpenProfile?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  lobbies,
  onRefreshLobbies,
  onOpenCreateTable,
  onJoinTable,
  onOpenRules,
  onOpenProfile,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>('genius-square');
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'in-game'>('all');
  const [joinCode, setJoinCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLobbies = lobbies.filter((l) => {
    if (filterStatus === 'waiting' && l.status !== 'waiting') return false;
    if (filterStatus === 'in-game' && l.status !== 'in-game') return false;
    if (
      searchQuery &&
      !l.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !l.hostName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 text-slate-100">
      {/* Player Career & Rating Summary */}
      <UserStatsSummaryCard user={user} onOpenProfile={onOpenProfile} />

      {/* Game Catalog Selection */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black font-['Fredoka'] text-slate-100 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-amber-400" /> Tabletop Game Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Click any game or click New Table to create a table, play with friends, challenge a bot, or play solo
            </p>
          </div>

          {/* Quick Action Buttons removed per request */}
          <div className="flex flex-wrap items-center gap-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Game 1: Genius Square */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedGame('genius-square');
              onOpenCreateTable('genius-square');
            }}
            className="p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between bg-slate-900/80 border-slate-800 hover:border-amber-400 hover:bg-slate-900 hover:shadow-xl hover:shadow-amber-500/10 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 group-hover:scale-105 transition">
                <Dices className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active & Playable
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-100 mb-1 font-['Fredoka'] group-hover:text-amber-300 transition">
                Genius Square
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Speed race polyomino puzzle. 6x6 grid, 7 blocker dice, 9 shapes.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Users className="w-3.5 h-3.5" /> 2 Players / Solo
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~5 mins
              </span>
            </div>
          </div>

          {/* Game 2: Mr. Jack in London */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedGame('mr-jack');
              onOpenCreateTable('mr-jack');
            }}
            className="p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between bg-slate-900/80 border-slate-800 hover:border-amber-400 hover:bg-slate-900 hover:shadow-xl hover:shadow-amber-500/10 group"
          >
            {/* Background Cover Overlay from repo */}
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none">
              <img
                src="/mrjack/cover.jpg"
                alt="Mr. Jack in London"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            </div>

            <div className="relative z-10 flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-stone-900 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/20 border border-amber-400/30 group-hover:scale-105 transition overflow-hidden">
                <img src="/mrjack/cover.jpg" alt="Mr Jack" className="w-full h-full object-cover" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active & Playable
              </span>
            </div>

            <div className="relative z-10">
              <h3 className="font-extrabold text-base text-slate-100 mb-1 font-['Fredoka'] group-hover:text-amber-300 transition">
                Mr. Jack in London
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Asymmetric deduction in Whitechapel. Sherlock vs Jack the Ripper across 8 tense rounds.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Users className="w-3.5 h-3.5" /> 2 Players / Solo
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~15 mins
              </span>
            </div>
          </div>

          {/* Game 3: The Settlers of Catan */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedGame('catan');
              onOpenCreateTable('catan');
            }}
            className="p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between bg-slate-900/80 border-slate-800 hover:border-amber-400 hover:bg-slate-900 hover:shadow-xl hover:shadow-amber-500/10 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-emerald-700 flex items-center justify-center text-amber-300 shadow-md shadow-orange-500/20 border border-amber-400/30 group-hover:scale-105 transition">
                <Compass className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active & Playable
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-100 mb-1 font-['Fredoka'] group-hover:text-amber-300 transition">
                The Settlers of Catan
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Island colonization, resource harvesting, robber mechanics, and road race to 10 VP.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Users className="w-3.5 h-3.5" /> 2 - 4 Players / Solo
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~20 mins
              </span>
            </div>
          </div>

          {/* Game 4: Ticket to Ride */}
          <div 
            onClick={() => {
              sounds.playPop();
              setSelectedGame('ticket-to-ride');
              onOpenCreateTable('ticket-to-ride');
            }}
            className="p-5 rounded-2xl border bg-slate-900/60 border-slate-700 hover:border-amber-500 hover:bg-slate-800/80 hover:-translate-y-1 transition-all cursor-pointer shadow-sm group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <span className="text-2xl">🚂</span>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded bg-emerald-500/20 text-emerald-400">
                ACTIVE & PLAYABLE
              </span>
            </div>
            
            <div>
              <h3 className="font-extrabold text-base text-amber-500 mb-1 group-hover:text-amber-400 transition-colors font-['Fredoka']">
                Ticket to Ride: Europe
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Build your train empire across turn-of-the-century Europe! Claim routes and complete destination tickets.
              </p>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5 text-amber-500/80">
                <Users className="w-3.5 h-3.5" /> 2 - 5 Players / Solo
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> ~25 mins
              </span>
            </div>
          </div>

          {/* Game 5: 7 Wonders - Duel */}
          <div
            onClick={() => {
              sounds.playPop();
              setSelectedGame('seven-wonders-duel');
              onOpenCreateTable('seven-wonders-duel');
            }}
            className="p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between bg-slate-900/80 border-slate-800 hover:border-amber-400 hover:bg-slate-900 hover:shadow-xl hover:shadow-amber-500/10 group"
          >
            {/* Background Cover Overlay from repo */}
            <div className="absolute inset-0 opacity-25 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none">
              <img
                src="/swd/game_display3.jpg"
                alt="7 Wonders - Duel"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            </div>

            <div className="relative z-10 flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-purple-800 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/20 border border-amber-400/30 group-hover:scale-105 transition overflow-hidden p-0.5">
                <img src="/swd/game_icon.png" alt="7 Wonders Duel" className="w-full h-full object-contain" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active & Playable
              </span>
            </div>

            <div className="relative z-10">
              <h3 className="font-extrabold text-base text-slate-100 mb-1 font-['Fredoka'] group-hover:text-amber-300 transition">
                7 Wonders - Duel
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Epic 2-player civilization clash. Draft wonders, construct age cards, and vie for military or scientific supremacy!
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Users className="w-3.5 h-3.5" /> 2 Players / Solo
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> ~20 mins
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Active Multiplayer Lobbies */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black font-['Fredoka'] text-slate-100 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Multiplayer Lobbies
            </h2>
            <p className="text-xs text-slate-400">
              Join an open table or challenge players in real-time
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Refresh */}
            <button
              onClick={() => {
                sounds.playPop();
                onRefreshLobbies();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Lobbies"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Create Table */}
            <button
              onClick={() => {
                sounds.playPop();
                onOpenCreateTable('');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Table
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            {(['all', 'waiting', 'in-game'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  sounds.playPop();
                  setFilterStatus(st);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer capitalize ${
                  filterStatus === st
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'waiting' ? 'Open Tables' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Private code quick join */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="text"
                placeholder="Code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-16 bg-transparent text-xs font-mono font-bold text-amber-300 outline-none uppercase"
              />
              <button
                disabled={!joinCode.trim()}
                onClick={() => {
                  sounds.playPop();
                  // Find table with code
                  const match = lobbies.find((l) => l.roomCode === joinCode.trim());
                  if (match) {
                    onJoinTable(match.id, joinCode.trim());
                  } else {
                    alert('No table found with this room code');
                  }
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 disabled:opacity-30 cursor-pointer"
              >
                Join
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 outline-none w-36 sm:w-44 focus:border-amber-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Lobbies Grid */}
        {filteredLobbies.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mx-auto">
              <Dices className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200 font-['Fredoka']">
              No Open Tables Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Be the first to open a table, or challenge an AI Bot for immediate action!
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  onOpenCreateTable('');
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Table
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLobbies.map((room) => {
              const isOpen = room.status === 'waiting' && room.players.length < 2;
              const isFull = room.players.length >= 2;
              return (
                <div
                  key={room.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition flex flex-col justify-between shadow-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-100 font-['Fredoka']">
                          {room.name}
                        </span>
                        {room.isPrivate && (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Host:{' '}
                        <strong className="text-slate-300">
                          {room.hostName}
                        </strong>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        room.status === 'in-game'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isOpen
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {room.status === 'in-game'
                        ? 'In Game'
                        : isOpen
                        ? 'Waiting'
                        : 'Full'}
                    </span>
                  </div>

                  {/* Players list */}
                  <div className="bg-slate-950/60 rounded-xl p-2.5 my-2 flex items-center justify-between text-xs overflow-hidden">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-2">
                      {room.players.map((p) => (
                        <div
                          key={p.userId}
                          className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0"
                        >
                          <span>{p.avatar}</span>
                          <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                            {p.username}
                          </span>
                        </div>
                      ))}
                      {room.players.length === 1 && (
                        <div className="text-[11px] text-slate-500 italic shrink-0">
                          + Waiting for Player 2...
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0 pl-1">
                      {room.timeControl}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      {room.players.length}/2 Players
                    </span>

                    {isOpen ? (
                      <button
                        onClick={() => {
                          sounds.playSnap();
                          onJoinTable(room.id);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        Join Table →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playPop();
                          onJoinTable(room.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Spectate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
