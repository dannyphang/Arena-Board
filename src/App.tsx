import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, MatchRecord } from './types/user';
import { TableRoom, GameType, TimeControl } from './types/lobby';
import { getStoredUser, saveUser, saveMatchRecord } from './services/storage';
import { getSocket, registerSocketUser } from './services/socket';
import { sounds } from './services/audio';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RulesModal } from './components/RulesModal';
import { CreateTableModal } from './components/CreateTableModal';
import { GameArena } from './components/GeniusSquare/GameArena';
import { MrJackArena } from './components/MrJack/MrJackArena';
import { CatanArena } from './components/Catan/CatanArena';
import { TicketToRideArena } from './components/TicketToRide/TicketToRideArena';
import { SevenWondersDuelArena } from './components/SevenWondersDuel/SevenWondersDuelArena';
import { AppVersionModal } from './components/AppVersionModal';
import { APP_VERSION_INFO } from './config/version';

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => getStoredUser());
  const [lobbies, setLobbies] = useState<TableRoom[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [activeTable, setActiveTable] = useState<TableRoom | null>(null);
  const [isSoloPractice, setIsSoloPractice] = useState(false);
  const [soloGameId, setSoloGameId] = useState<GameType>('genius-square');

  // Modals
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [rulesGameId, setRulesGameId] = useState<'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride' | 'seven-wonders-duel' | undefined>(undefined);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [createTableInitialGame, setCreateTableInitialGame] = useState<GameType | ''>('');
  const [isVersionOpen, setIsVersionOpen] = useState(false);

  // Keyboard shortcut: Esc -> close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setIsVersionOpen(false);
        setIsRulesOpen(false);
        setIsCreateTableOpen(false);
        setIsLoginOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, []);

  const socket = getSocket();

  // Socket event listeners
  useEffect(() => {
    registerSocketUser(user);

    const handleLobbyList = (list: TableRoom[]) => {
      setLobbies(list);
      // Rough online count based on lobbies + 1
      const totalInRooms = list.reduce((sum, r) => sum + r.players.length, 0);
      setOnlineCount(Math.max(1, totalInRooms + Math.floor(Math.random() * 3) + 1));
    };

    const handleTableCreated = (room: TableRoom) => {
      setActiveTable(room);
      setIsSoloPractice(false);
    };

    const handleTableUpdated = (room: TableRoom) => {
      setActiveTable((prev) => {
        if (prev && prev.id === room.id) {
          return room;
        }
        return prev;
      });
    };

    const handleGameStarted = (room: TableRoom) => {
      setActiveTable(room);
      sounds.playDiceRoll();
    };

    const handleBoardSync = (data: { userId: string; progress: any }) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        const updatedPlayers = prev.players.map((p) => {
          if (p.userId === data.userId) {
            return { ...p, boardProgress: data.progress };
          }
          return p;
        });
        return { ...prev, players: updatedPlayers };
      });
    };

    const handleChatMessage = (msg: any) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        return { ...prev, messages: [...prev.messages, msg] };
      });
    };

    const handleMrJackSync = (data: { gameState: any }) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        return { ...prev, mrJackState: data.gameState };
      });
    };

    const handleCatanSync = (data: { gameState: any }) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        return { ...prev, catanState: data.gameState };
      });
    };

    const handleTTRSync = (data: { gameState: any }) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        return { ...prev, ttrState: data.gameState };
      });
    };

    const handleSWDSync = (data: { gameState: any }) => {
      setActiveTable((prev) => {
        if (!prev) return null;
        return { ...prev, sevenWondersState: data.gameState };
      });
    };

    const handleTTRError = (data: { message: string }) => {
      alert(`Ticket to Ride Error: ${data.message}`);
    };

    socket.on('lobby:list', handleLobbyList);
    socket.on('table:created', handleTableCreated);
    socket.on('table:updated', handleTableUpdated);
    socket.on('table:game_started', handleGameStarted);
    socket.on('table:board_sync', handleBoardSync);
    socket.on('table:chat_message', handleChatMessage);
    socket.on('table:mrjack_sync', handleMrJackSync);
    socket.on('table:catan_sync', handleCatanSync);
    socket.on('table:ttr_sync', handleTTRSync);
    socket.on('table:swd_sync', handleSWDSync);
    socket.on('table:ttr_error', handleTTRError);

    socket.emit('lobby:get');

    return () => {
      socket.off('lobby:list', handleLobbyList);
      socket.off('table:created', handleTableCreated);
      socket.off('table:updated', handleTableUpdated);
      socket.off('table:game_started', handleGameStarted);
      socket.off('table:board_sync', handleBoardSync);
      socket.off('table:chat_message', handleChatMessage);
      socket.off('table:mrjack_sync', handleMrJackSync);
      socket.off('table:catan_sync', handleCatanSync);
      socket.off('table:ttr_sync', handleTTRSync);
      socket.off('table:swd_sync', handleSWDSync);
      socket.off('table:ttr_error', handleTTRError);
    };
  }, [user, socket]);

  // Handle user update from login/edit modal
  const handleUserUpdated = (updated: UserProfile) => {
    setUser(updated);
    registerSocketUser(updated);
  };

  // Join table
  const handleJoinTable = (tableId: string, roomCode?: string) => {
    sounds.playSnap();
    socket.emit('table:join', { tableId, roomCode }, (res: any) => {
      if (res?.success) {
        setActiveTable(res.table);
        setIsSoloPractice(false);
      } else {
        alert(res?.error || 'Could not join table');
      }
    });
  };

  const [soloTargetVP, setSoloTargetVP] = useState<number>(10);

  // Create table
  const handleCreateTable = (params: {
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
  }) => {
    sounds.playSnap();
    socket.emit('table:create', params);
  };

  // Open Create Table Modal with optional pre-selected game
  const handleOpenCreateTable = (gameId?: GameType | '') => {
    setCreateTableInitialGame(gameId || '');
    setIsCreateTableOpen(true);
  };

  // Solo practice
  const handleStartSolo = (gameId: GameType, targetVictoryPoints?: number) => {
    sounds.playSnap();
    setSoloGameId(gameId);
    if (targetVictoryPoints) {
      setSoloTargetVP(targetVictoryPoints);
    }
    setIsSoloPractice(true);
    setActiveTable(null);
  };

  // Exit game to lobby
  const handleLeaveGame = () => {
    sounds.playPop();
    if (activeTable) {
      socket.emit('table:leave', { tableId: activeTable.id });
    }
    setActiveTable(null);
    setIsSoloPractice(false);
  };

  // Record match stats
  const handleRecordMatch = useCallback(
    (timeSec: number, won: boolean) => {
      setUser((prev) => {
        const newPlayed = prev.gamesPlayed + 1;
        const newWins = prev.wins + (won ? 1 : 0);
        const ratingDelta = won ? 16 : -10;
        const newRating = Math.max(800, prev.rating + ratingDelta);
        const newBestTime =
          won && (!prev.bestTimeSeconds || timeSec < prev.bestTimeSeconds)
            ? timeSec
            : prev.bestTimeSeconds;

        const updated: UserProfile = {
          ...prev,
          gamesPlayed: newPlayed,
          wins: newWins,
          rating: newRating,
          bestTimeSeconds: newBestTime,
          level: Math.floor(newWins / 3) + 1,
        };

        saveUser(updated);

        // Record match entry
        const opponent = activeTable?.players.find((p) => p.userId !== prev.id);
        const record: MatchRecord = {
          id: 'rec_' + Date.now(),
          gameId: 'genius-square',
          date: new Date().toLocaleDateString(),
          opponentName: opponent ? opponent.username : isSoloPractice ? 'Solo Solver' : 'Opponent',
          opponentAvatar: opponent ? opponent.avatar : 'bot',
          result: won ? 'win' : 'loss',
          timeSeconds: timeSec,
          ratingChange: ratingDelta,
        };
        saveMatchRecord(record);

        return updated;
      });
    },
    [activeTable, isSoloPractice]
  );

  const isInGame = !!activeTable || isSoloPractice;

  return (
    <div className="min-h-screen bg-slate-950 font-['Outfit'] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onlineCount={onlineCount}
        inGame={isInGame}
        activeGameName={
          activeTable
            ? activeTable.gameId === 'catan'
              ? 'The Settlers of Catan'
              : activeTable.gameId === 'mr-jack'
              ? 'Mr. Jack in London'
              : activeTable.gameId === 'ticket-to-ride'
              ? 'Ticket to Ride: Europe'
              : activeTable.gameId === 'seven-wonders-duel'
              ? '7 Wonders - Duel'
              : 'Genius Square'
            : soloGameId === 'catan'
            ? 'Catan (Solo)'
            : soloGameId === 'mr-jack'
            ? 'Mr. Jack (Solo)'
            : soloGameId === 'ticket-to-ride'
            ? 'Ticket to Ride: Europe (Solo)'
            : soloGameId === 'seven-wonders-duel'
            ? '7 Wonders - Duel (Solo)'
            : 'Genius Square (Solo)'
        }
        onOpenRules={() => {
          const currentGame = activeTable
            ? (activeTable.gameId as 'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride' | 'seven-wonders-duel')
            : isSoloPractice
            ? (soloGameId as 'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride' | 'seven-wonders-duel')
            : undefined;
          setRulesGameId(currentGame);
          setIsRulesOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLeaveGame={handleLeaveGame}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {isInGame ? (
          activeTable?.gameId === 'seven-wonders-duel' || (!activeTable && soloGameId === 'seven-wonders-duel') ? (
            <SevenWondersDuelArena
              user={user}
              table={activeTable}
              isSoloPractice={isSoloPractice}
              onExit={handleLeaveGame}
              onOpenRules={() => {
                setRulesGameId('seven-wonders-duel');
                setIsRulesOpen(true);
              }}
              onRecordMatch={handleRecordMatch}
            />
          ) : activeTable?.gameId === 'catan' || (!activeTable && soloGameId === 'catan') ? (
            <CatanArena
              user={user}
              table={activeTable}
              isSoloPractice={isSoloPractice}
              soloTargetVictoryPoints={soloTargetVP}
              onExit={handleLeaveGame}
              onOpenRules={() => {
                setRulesGameId('catan');
                setIsRulesOpen(true);
              }}
              onRecordMatch={handleRecordMatch}
            />
          ) : activeTable?.gameId === 'ticket-to-ride' || (!activeTable && soloGameId === 'ticket-to-ride') ? (
            <TicketToRideArena
              user={user}
              table={activeTable}
              onExit={handleLeaveGame}
              onOpenRules={() => {
                setRulesGameId('ticket-to-ride');
                setIsRulesOpen(true);
              }}
              onRecordMatch={handleRecordMatch}
            />
          ) : activeTable?.gameId === 'mr-jack' || (!activeTable && soloGameId === 'mr-jack') ? (
            <MrJackArena
              user={user}
              table={activeTable}
              isSoloPractice={isSoloPractice}
              onExit={handleLeaveGame}
              onOpenRules={() => {
                setRulesGameId('mr-jack');
                setIsRulesOpen(true);
              }}
              onRecordMatch={handleRecordMatch}
            />
          ) : (
            <GameArena
              user={user}
              table={activeTable}
              isSoloPractice={isSoloPractice}
              onExit={handleLeaveGame}
              onOpenRules={() => {
                setRulesGameId('genius-square');
                setIsRulesOpen(true);
              }}
              onRecordMatch={handleRecordMatch}
            />
          )
        ) : (
          <Dashboard
            user={user}
            lobbies={lobbies}
            onRefreshLobbies={() => socket.emit('lobby:get')}
            onOpenCreateTable={handleOpenCreateTable}
            onJoinTable={handleJoinTable}
            onOpenRules={() => {
              setRulesGameId(undefined);
              setIsRulesOpen(true);
            }}
          />
        )}
      </main>

      {/* Footer (Hidden during active games to minimize viewport scrolling) */}
      {!isInGame && (
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-extrabold font-['Fredoka']">ArenaBoard</span>
              <span>• Online Real-Time Board Game Platform</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Featured Game: Genius Square</span>
              <button
                onClick={() => {
                  setRulesGameId(undefined);
                  setIsRulesOpen(true);
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Rules & Solver
              </button>
              <span>62,208 Mathematically Solvable Setups</span>
            </div>
          </div>

          {/* Under Footer: App Version Info */}
          <div className="mt-3 pt-3 border-t border-slate-900/60 max-w-7xl mx-auto px-4 flex items-center justify-center">
            <button
              onClick={() => {
                sounds.playPop();
                setIsVersionOpen(true);
              }}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400/50 text-slate-400 hover:text-amber-300 transition-all cursor-pointer shadow-xs text-[11px]"
              title="Click to view app version, release prompt, and deployment status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>App Version: <strong className="text-slate-200 group-hover:text-amber-300 font-bold">{APP_VERSION_INFO.version}</strong></span>
            </button>
          </div>
        </footer>
      )}

      {/* Modals */}
      <LoginModal
        currentUser={user}
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onUserUpdated={handleUserUpdated}
      />

      <UserProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onEditProfile={() => setIsLoginOpen(true)}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        currentGame={rulesGameId}
      />

      <CreateTableModal
        isOpen={isCreateTableOpen}
        onClose={() => setIsCreateTableOpen(false)}
        currentUser={user}
        initialGameId={createTableInitialGame}
        onCreateTable={handleCreateTable}
        onStartSolo={handleStartSolo}
      />

      <AppVersionModal
        isOpen={isVersionOpen}
        onClose={() => setIsVersionOpen(false)}
      />
    </div>
  );
}
