import React, { useState, useEffect } from 'react';
import { GameType, TimeControl } from '../types/lobby';
import { UserProfile } from '../types/user';
import { sounds } from '../services/audio';
import { AvatarSvg } from './Catan/CatanIcons';
import {
  X,
  Bot,
  UserPlus,
  AlertCircle,
  ChevronDown,
  Swords,
  Play,
  Users,
  Trash2,
  Trophy,
  Pencil,
  Smile,
} from 'lucide-react';

export interface OpponentConfig {
  id: string;
  name: string;
  avatar: string;
  type: 'human' | 'bot';
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'genius';
}

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialGameId?: GameType | '';
  onCreateTable: (params: {
    name: string;
    gameId: GameType;
    isPrivate: boolean;
    roomCode?: string;
    timeControl: TimeControl;
    withBot?: boolean;
    botDifficulty?: 'beginner' | 'intermediate' | 'expert' | 'genius';
    bots?: { name: string; avatar: string; difficulty: 'beginner' | 'intermediate' | 'expert' | 'genius' }[];
    hasHumanSlots?: boolean;
    maxPlayers?: number;
    targetVictoryPoints?: number;
  }) => void;
  onStartSolo: (gameId: GameType, targetVictoryPoints?: number) => void;
}

const BOT_PRESETS = [
  { name: 'Knight Bot', avatar: 'bot', diff: 'intermediate' as const },
  { name: 'Settler Bot', avatar: 'compass', diff: 'intermediate' as const },
  { name: 'Merchant Bot', avatar: 'swords', diff: 'expert' as const },
  { name: 'Explorer AI', avatar: 'brain', diff: 'genius' as const },
];

const BOT_AVATARS = [
  'bot', 'compass', 'swords', 'brain', 'wizard', 'crown',
  'shield', 'target', 'rocket', 'gem', 'flame', 'zap'
];

export const CreateTableModal: React.FC<CreateTableModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialGameId = '',
  onCreateTable,
  onStartSolo,
}) => {
  const [gameId, setGameId] = useState<GameType | ''>(initialGameId);
  const [opponents, setOpponents] = useState<OpponentConfig[]>([]);
  const [tableName, setTableName] = useState('');
  const [targetVictoryPoints, setTargetVictoryPoints] = useState<number>(10);
  const [editingAvatarIdx, setEditingAvatarIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Keep game selection synchronized when opened with a specific game or empty
  useEffect(() => {
    if (isOpen) {
      setGameId(initialGameId);
      setOpponents([]);
      setError('');
      setTableName('');
      setTargetVictoryPoints(10);
      setEditingAvatarIdx(null);
    }
  }, [isOpen, initialGameId]);

  // Keyboard shortcut: Esc -> close/cancel modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, [isOpen, onClose]);

  // Max players depends on the selected game:
  // Catan (and empty initial selection): up to 4 players total (1 host + 3 opponents)
  // Genius Square & Mr. Jack: strictly 2 players total (1 host + 1 opponent)
  const isTwoPlayerOnly = gameId === 'genius-square' || gameId === 'mr-jack';
  const maxTotalPlayers = gameId === 'ticket-to-ride' ? 5 : isTwoPlayerOnly ? 2 : 4;
  const maxOpponents = maxTotalPlayers - 1;

  // Trim opponents if game changes to one with lower player limit
  const handleGameChange = (newGame: GameType | '') => {
    setGameId(newGame);
    setError('');
    const is2P = newGame === 'genius-square' || newGame === 'mr-jack';
    const newMaxOpp = is2P ? 1 : 3;
    if (opponents.length > newMaxOpp) {
      setOpponents((prev) => prev.slice(0, newMaxOpp));
    }
  };

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    if (opponents.length >= maxOpponents) return;
    sounds.playPop();
    const nextSeatNum = opponents.length + 2;
    setOpponents((prev) => [
      ...prev,
      {
        id: 'human_' + Date.now() + '_' + nextSeatNum,
        name: `Player ${nextSeatNum}`,
        avatar: 'user',
        type: 'human',
        difficulty: 'intermediate',
      },
    ]);
  };

  const handleAddBot = () => {
    if (opponents.length >= maxOpponents) return;
    sounds.playPop();
    const botIdx = opponents.filter((o) => o.type === 'bot').length;
    const preset = BOT_PRESETS[botIdx % BOT_PRESETS.length];
    setOpponents((prev) => [
      ...prev,
      {
        id: 'bot_' + Date.now() + '_' + (prev.length + 1),
        name: `${preset.name} (AI)`,
        avatar: preset.avatar,
        type: 'bot',
        difficulty: preset.diff,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameId) {
      setError('Please select a game from the dropdown first.');
      sounds.playBuzz();
      return;
    }

    sounds.playSnap();

    // 1. Solo Mode (if no opponents added)
    if (opponents.length === 0) {
      onStartSolo(gameId, targetVictoryPoints);
      onClose();
      return;
    }

    // 2. Prepare opponents configuration
    const botOpponents = opponents.filter((o) => o.type === 'bot');
    const humanOpponents = opponents.filter((o) => o.type === 'human');
    const calculatedMaxPlayers = gameId === 'catan' ? 4 : gameId === 'ticket-to-ride' ? 5 : (opponents.length + 1);

    const defaultName =
      tableName.trim() ||
      (gameId === 'catan'
        ? `${currentUser.username}'s Catan Colony`
        : gameId === 'mr-jack'
        ? `${currentUser.username}'s Mr. Jack Table`
        : `${currentUser.username}'s Genius Square Table`);

    onCreateTable({
      name: defaultName,
      gameId,
      isPrivate: false,
      timeControl: 'casual',
      withBot: botOpponents.length > 0,
      botDifficulty: botOpponents[0]?.difficulty || 'intermediate',
      bots: botOpponents.map((b) => ({
        name: b.name,
        avatar: b.avatar,
        difficulty: b.difficulty,
      })),
      hasHumanSlots: humanOpponents.length > 0,
      maxPlayers: calculatedMaxPlayers,
      targetVictoryPoints: gameId === 'catan' ? targetVictoryPoints : undefined,
    });
    onClose();
  };

  const isFull = opponents.length >= maxOpponents;
  const botCount = opponents.filter((o) => o.type === 'bot').length;
  const humanCount = opponents.filter((o) => o.type === 'human').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col font-['Outfit']">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-100 font-['Fredoka']">
                  New Game Table & Config
                </h3>
                <p className="text-xs text-slate-400">
                  Configure room name, victory points to win, and customize bot names & avatars
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Top Section: Game Selector & Room Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field: Game */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Game Selection <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={gameId}
                  onChange={(e) => handleGameChange(e.target.value as GameType | '')}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm font-semibold transition appearance-none cursor-pointer outline-none ${
                    !gameId
                      ? 'border-slate-700 text-slate-400'
                      : 'border-amber-500/80 text-amber-300 bg-slate-950/90 shadow-sm shadow-amber-500/10'
                  } focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50`}
                >
                  <option value="" className="text-slate-500 bg-slate-950">
                    -- Select a Game --
                  </option>
                  <option value="genius-square" className="text-slate-100 bg-slate-900">
                    Genius Square (2 Players / Solo)
                  </option>
                  <option value="mr-jack" className="text-slate-100 bg-slate-900">
                    Mr. Jack in London (2 Players / Solo)
                  </option>
                  <option value="catan" className="text-slate-100 bg-slate-900">
                    The Settlers of Catan (2 - 4 Players / Solo)
                  </option>
                  <option value="ticket-to-ride" className="text-slate-100 bg-slate-900">
                    Ticket to Ride: Europe (2 - 5 Players / Solo)
                  </option>
                  <option value="quoridor" disabled className="text-slate-500 bg-slate-900">
                    Quoridor Arena (Coming Soon)
                  </option>
                  <option value="pentago" disabled className="text-slate-500 bg-slate-900">
                    Pentago 360 (Coming Soon)
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Field: Room Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Room / Table Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={
                    gameId === 'catan'
                      ? `${currentUser.username}'s Catan Colony`
                      : gameId === 'mr-jack'
                      ? `${currentUser.username}'s Mr. Jack Mystery`
                      : `${currentUser.username}'s Arena Table`
                  }
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  maxLength={40}
                />
                {tableName && (
                  <button
                    type="button"
                    onClick={() => setTableName('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Catan Game Config: Victory Points to Win */}
          {gameId === 'catan' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Victory Points To Win
                  </span>
                </div>
                <div className="text-xs font-black text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {targetVictoryPoints} VP Target
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[8, 10, 12, 14, 16].map((vp) => (
                  <button
                    key={vp}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setTargetVictoryPoints(vp);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      targetVictoryPoints === vp
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {vp} VP {vp === 10 ? '(Standard)' : vp === 8 ? '(Fast)' : ''}
                  </button>
                ))}

                {/* Custom Stepper */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 ml-auto">
                  <span className="text-[11px] text-slate-400 mr-1">Custom:</span>
                  <button
                    type="button"
                    disabled={targetVictoryPoints <= 6}
                    onClick={() => setTargetVictoryPoints((prev) => Math.max(6, prev - 1))}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-amber-300">
                    {targetVictoryPoints}
                  </span>
                  <button
                    type="button"
                    disabled={targetVictoryPoints >= 20}
                    onClick={() => setTargetVictoryPoints((prev) => Math.min(20, prev + 1))}
                    className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-amber-200/80">
                Rule: First player or bot to reach <strong className="text-white">{targetVictoryPoints} Victory Points</strong> through settlements, cities, longest road, largest army, and dev cards claims victory.
              </p>
            </div>
          )}

          {/* 3. Field: Players Table & Bot Config */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Players & AI Bots ({opponents.length + 1} / {maxTotalPlayers})
                </label>
                <p className="text-[11px] text-slate-400">
                  Configure seats. Rename bots, change bot avatars, or invite players.
                </p>
              </div>

              {/* Action Buttons to Add Player / Add Bot */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isFull}
                  onClick={handleAddPlayer}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                  title={isFull ? `Table is full (max ${maxTotalPlayers} players)` : 'Add player seat for online opponent'}
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                  Add Player
                </button>

                <button
                  type="button"
                  disabled={isFull}
                  onClick={handleAddBot}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                  title={isFull ? `Table is full (max ${maxTotalPlayers} players)` : 'Add AI Bot opponent'}
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  Add Bot
                </button>
              </div>
            </div>

            {/* Avatar Picker Palette (if open) */}
            {editingAvatarIdx !== null && opponents[editingAvatarIdx] && (
              <div className="p-3 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5" /> Choose Avatar for {opponents[editingAvatarIdx].name}:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingAvatarIdx(null)}
                    className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BOT_AVATARS.map((avatarKey) => (
                    <button
                      key={avatarKey}
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        const idx = editingAvatarIdx;
                        setOpponents((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, avatar: avatarKey } : o))
                        );
                        setEditingAvatarIdx(null);
                      }}
                      className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-400 flex items-center justify-center transition cursor-pointer text-purple-300"
                    >
                      <AvatarSvg avatar={avatarKey} size={18} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Table Component */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">Player / Bot Name</th>
                    <th className="py-2.5 px-3 w-14 text-center">Type</th>
                    <th className="py-2.5 px-4 w-44">Difficulty</th>
                    <th className="py-2.5 px-4 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {/* Seat 1: Host (Current User) */}
                  <tr className="hover:bg-slate-900/30 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">1</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-slate-800/80 rounded-lg text-amber-400 flex items-center justify-center">
                          <AvatarSvg avatar={currentUser.avatar} size={18} />
                        </span>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            {currentUser.username}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                              You (Host)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">Rating: {currentUser.rating}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-xs" title="Human Player">
                        <Users className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      —
                    </td>
                  </tr>

                  {/* Seat 2..N: Added Opponents (Bots or Players) */}
                  {opponents.map((opp, idx) => (
                    <tr key={opp.id} className="hover:bg-slate-900/30 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 2}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {opp.type === 'bot' ? (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playPop();
                                setEditingAvatarIdx(editingAvatarIdx === idx ? null : idx);
                              }}
                              className="p-1.5 rounded-lg border bg-purple-950/70 border-purple-500/40 hover:border-amber-400 transition cursor-pointer text-purple-300 flex items-center justify-center"
                              title="Click to change bot avatar"
                            >
                              <AvatarSvg avatar={opp.avatar} size={18} />
                            </button>
                          ) : (
                            <span className="p-1.5 rounded-lg border bg-blue-950/60 border-blue-500/30 text-blue-300 flex items-center justify-center">
                              <AvatarSvg avatar={opp.avatar} size={18} />
                            </span>
                          )}

                          <div className="flex-1 min-w-0">
                            {opp.type === 'bot' ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={opp.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOpponents((prev) =>
                                      prev.map((o, i) => (i === idx ? { ...o, name: val } : o))
                                    );
                                  }}
                                  className="bg-slate-900/90 border border-slate-700 hover:border-slate-600 focus:border-amber-400 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold outline-none w-44 transition"
                                  placeholder="Bot Name..."
                                  maxLength={25}
                                />
                                <Pencil className="w-3 h-3 text-slate-500" />
                              </div>
                            ) : (
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                {opp.name}
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold border bg-blue-500/20 text-blue-300 border-blue-500/30">
                                  Open Seat
                                </span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {opp.type === 'bot' ? 'Click avatar to change emoji' : 'Waiting for opponent in lobby'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {opp.type === 'bot' ? (
                          <span className="inline-flex p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-xs" title="AI Bot">
                            <Bot className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs" title="Human Player">
                            <Users className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {opp.type === 'bot' ? (
                          <select
                            value={opp.difficulty}
                            onChange={(e) => {
                              const diff = e.target.value as any;
                              setOpponents((prev) =>
                                prev.map((o, i) => (i === idx ? { ...o, difficulty: diff } : o))
                              );
                            }}
                            className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold outline-none cursor-pointer w-full max-w-[160px]"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="expert">Expert</option>
                            <option value="genius">Grandmaster</option>
                          </select>
                        ) : (
                          <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            Open Lobby Seat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sounds.playPop();
                            setOpponents((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="inline-flex items-center justify-center text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 p-1.5 rounded-lg transition cursor-pointer"
                          title="Remove opponent seat"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Solo mode info bar when no opponents added */}
              {opponents.length === 0 ? (
                <div className="bg-slate-900/60 p-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                      Solo Mode
                    </span>
                    <span>No opponent added. You will play in single-player solo mode.</span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                    Click "Add Player" or "Add Bot" to add opponents (up to {maxOpponents})
                  </span>
                </div>
              ) : (
                <div className="bg-slate-900/60 px-3.5 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Table Setup: 1 Host + {humanCount} Human(s) + {botCount} Bot(s)
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    {opponents.length < maxOpponents
                      ? `Can add ${maxOpponents - opponents.length} more`
                      : 'Table full'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              {opponents.length === 0 ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Solo Practice</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Create Game Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
