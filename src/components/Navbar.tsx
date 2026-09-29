import React from 'react';
import { UserProfile } from '../types/user';
import { sounds } from '../services/audio';
import { getSoundEnabled, setSoundEnabled } from '../services/storage';
import { Volume2, VolumeX, BookOpen, User, Trophy, Play, LogIn, Users, Dices } from 'lucide-react';
import { AvatarSvg } from './Catan/CatanIcons';

interface NavbarProps {
  user: UserProfile;
  onlineCount: number;
  inGame: boolean;
  activeGameName?: string;
  onOpenRules: () => void;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onLeaveGame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onlineCount,
  inGame,
  activeGameName = 'Genius Square',
  onOpenRules,
  onOpenProfile,
  onOpenLogin,
  onLeaveGame,
}) => {
  const [soundOn, setSoundOn] = React.useState(getSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) sounds.playPop();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={inGame ? onLeaveGame : undefined}
            className={`flex items-center gap-2.5 ${inGame ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white border border-amber-300/30">
              <Dices className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400 bg-clip-text text-transparent font-['Fredoka']">
                  ArenaBoard
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineCount} Tabletop Players Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: In-game breadcrumb if active */}
        {inGame && (
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-amber-400 font-semibold">Active Match:</span>
            <span className="text-slate-200 font-medium">{activeGameName}</span>
            <button
              onClick={onLeaveGame}
              className="ml-2 text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              Exit to Lobby
            </button>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rules Guide Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm hover:border-slate-600 cursor-pointer"
            title="Read Rules & Tutorial"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">How to Play</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={soundOn ? 'Sound Effects Enabled' : 'Sound Effects Muted'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* User Profile Chip */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 pl-2">
            <button
              onClick={() => {
                sounds.playPop();
                onOpenProfile();
              }}
              className="flex items-center gap-2 hover:opacity-90 transition cursor-pointer pr-1"
            >
              <span className="p-1 rounded-lg bg-slate-900/60 text-amber-400 flex items-center justify-center">
                <AvatarSvg avatar={user.avatar} size={18} />
              </span>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-200 leading-tight">
                  {user.username}
                </div>
                <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 inline" />
                  {user.rating} ELO
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                sounds.playPop();
                onOpenLogin();
              }}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition cursor-pointer"
              title="Change Account or Login"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
