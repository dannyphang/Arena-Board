import React, { useState } from 'react';
import { UserProfile } from '../types/user';
import { saveUser } from '../services/storage';
import { sounds } from '../services/audio';
import { X, Sparkles, Check, UserCheck, Shield, User } from 'lucide-react';
import { AvatarSvg } from './Catan/CatanIcons';

interface LoginModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

const AVATAR_OPTIONS = [
  'dice', 'crown', 'brain', 'shield', 'zap', 'rocket', 'trophy', 'wizard',
  'bot', 'target', 'gem', 'flame', 'compass', 'swords', 'star', 'user'
];

const RANDOM_TITLES = [
  'MeepleMaster',
  'SquareNinja',
  'DiceWizard',
  'HexChampion',
  'TacticsBaron',
  'GridCaptain',
  'PuzzleRider',
  'BlockerKing',
  'BoardCrafter',
  'SpeedyGenius',
];

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [username, setUsername] = useState(currentUser.username);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRandomize = () => {
    sounds.playPop();
    const title = RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setUsername(`${title}${num}`);
    const randAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setAvatar(randAvatar);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      sounds.playBuzz();
      return;
    }
    if (trimmed.length > 18) {
      setError('Username must be 18 characters or less');
      sounds.playBuzz();
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      username: trimmed,
      avatar,
    };

    saveUser(updated);
    sounds.playSnap();
    onUserUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 font-['Fredoka']">
                  Player Profile & Login
                </h3>
                <p className="text-xs text-slate-400">
                  Set your arena nickname and tabletop avatar
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Choose Tabletop Avatar
            </label>
            <div className="grid grid-cols-8 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {AVATAR_OPTIONS.map((icon) => (
                <button
                  type="button"
                  key={icon}
                  onClick={() => {
                    sounds.playPop();
                    setAvatar(icon);
                  }}
                  className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    avatar === icon
                      ? 'bg-amber-500/30 border border-amber-400 scale-110 shadow-md shadow-amber-500/20 text-amber-300'
                      : 'hover:bg-slate-800/80 border border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AvatarSvg avatar={icon} size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Player Username
              </label>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Randomize
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400">
                <AvatarSvg avatar={avatar} size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                maxLength={18}
                placeholder="Enter username (e.g. MeepleKing)"
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
            {error && <p className="text-xs font-medium text-rose-400 mt-1.5">{error}</p>}
          </div>

          {/* Player Stats preview */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Arena Rating</div>
              <div className="font-bold text-amber-400 text-sm mt-0.5">
                {currentUser.rating} ELO
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Games Played</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">
                {currentUser.gamesPlayed}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Wins</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                {currentUser.wins}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
