import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types/user';
import { TableRoom } from '../../types/lobby';
import { SWDGameState, SWDAction, DraftCard } from '../../games/seven-wonders-duel/types';
import { createInitialSWDGame, processSWDAction } from '../../games/seven-wonders-duel/engine';
import { computeBotMove } from '../../games/seven-wonders-duel/bot';
import { getSocket } from '../../services/socket';
import { sounds } from '../../services/audio';
import { SWDBoard } from './SWDBoard';
import { SWDDraftpool } from './SWDDraftpool';
import { SWDPlayerArea } from './SWDPlayerArea';
import { SWDWonderDraft } from './SWDWonderDraft';
import { SWDActionModal } from './SWDActionModal';
import { SWDTokenSelectionModal } from './SWDTokenSelectionModal';
import { SWDSpecialChoiceModal } from './SWDSpecialChoiceModal';
import { SWDGameOverModal } from './SWDGameOverModal';
import { SWD_BOARD_IMAGES } from '../../games/seven-wonders-duel/assets';
import {
  BookOpen,
  LogOut,
  Swords,
  Scroll,
  Sparkles,
  Volume2,
  VolumeX,
  History,
  RotateCcw,
} from 'lucide-react';

interface SevenWondersDuelArenaProps {
  user: UserProfile;
  table: TableRoom | null;
  isSoloPractice?: boolean;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch?: (timeSec: number, won: boolean) => void;
}

export const SevenWondersDuelArena: React.FC<SevenWondersDuelArenaProps> = ({
  user,
  table,
  isSoloPractice = false,
  onExit,
  onOpenRules,
  onRecordMatch,
}) => {
  const socket = getSocket();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedDraftCard, setSelectedDraftCard] = useState<DraftCard | null>(null);

  // Initialize or synchronize game state
  const [gameState, setGameState] = useState<SWDGameState>(() => {
    if (table?.sevenWondersState) {
      return table.sevenWondersState;
    }
    // Solo practice initial game setup
    const p1 = { id: user.id, name: user.username, avatar: user.avatar, isBot: false };
    const p2 = { id: 'bot_duel_ai', name: 'Aristotle (AI)', avatar: '🏛️', isBot: true };
    return createInitialSWDGame(p1, p2);
  });

  const startTimeRef = useRef<number>(Date.now());
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state from multiplayer socket
  useEffect(() => {
    if (isSoloPractice || !table) return;

    const handleSWDSync = (data: { gameState: SWDGameState }) => {
      setGameState(data.gameState);
    };

    socket.on('table:swd_sync', handleSWDSync);
    return () => {
      socket.off('table:swd_sync', handleSWDSync);
    };
  }, [table, isSoloPractice, socket]);

  // Execute action (either local solo or socket multiplayer)
  const handleAction = (action: SWDAction) => {
    sounds.playSnap();
    setSelectedDraftCard(null);

    if (isSoloPractice || !table) {
      try {
        const next = processSWDAction(gameState, gameState.activePlayerId, action);
        setGameState(next);

        if (next.winner && onRecordMatch) {
          const won = next.winner.userId === user.id;
          const timeSec = Math.round((Date.now() - startTimeRef.current) / 1000);
          onRecordMatch(timeSec, won);
        }
      } catch (err: any) {
        console.error('SWD action error:', err.message);
      }
    } else {
      socket.emit('seven-wonders-duel:action', {
        tableId: table.id,
        action,
        forUserId: gameState.activePlayerId,
      });
    }
  };

  // Bot automation for Solo mode (or when host handles AI opponent)
  useEffect(() => {
    if (gameState.currentPhase === 'game_over') return;

    const activePlayer = gameState.players[gameState.activePlayerId];
    if (activePlayer?.isBot) {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

      botTimeoutRef.current = setTimeout(() => {
        try {
          const botMove = computeBotMove(gameState, gameState.activePlayerId);
          if (botMove) {
            handleAction(botMove);
          }
        } catch (e) {
          console.error('Bot move failed:', e);
        }
      }, 1200);
    }

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState.activePlayerId, gameState.currentPhase, gameState.wonderDraftStep]);

  const p1Id = gameState.playerOrder[0];
  const p2Id = gameState.playerOrder[1];
  const myId = user.id;
  const isMePlayer1 = p1Id === myId;
  const opponentId = isMePlayer1 ? p2Id : p1Id;
  const me = gameState.players[myId] || gameState.players[p1Id];
  const opponent = gameState.players[opponentId] || gameState.players[p2Id];

  const isMyTurn = gameState.activePlayerId === me.userId;

  const handleRestart = () => {
    startTimeRef.current = Date.now();
    const p1 = { id: user.id, name: user.username, avatar: user.avatar, isBot: false };
    const p2 = { id: 'bot_duel_ai', name: 'Aristotle (AI)', avatar: '🏛️', isBot: true };
    const fresh = createInitialSWDGame(p1, p2);
    setGameState(fresh);
  };

  return (
    <div
      className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-['Outfit'] select-none relative"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 15, 29, 0.88), rgba(10, 15, 29, 0.94)), url('${SWD_BOARD_IMAGES.boardBackground}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Game Bar */}
      <header className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-slate-100 font-['Fredoka']">
                7 Wonders - Duel
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {gameState.currentPhase === 'wonder_draft'
                  ? `Wonder Draft • R${gameState.wonderDraftRound}`
                  : `Age ${gameState.currentAge === 1 ? 'I' : gameState.currentAge === 2 ? 'II' : 'III'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Turn Status Message */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs">
          {isMyTurn ? (
            <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> Your Turn to play!
            </span>
          ) : (
            <span className="text-slate-400">
              Waiting for <strong className="text-slate-200">{gameState.players[gameState.activePlayerId]?.name}</strong>...
            </span>
          )}
        </div>

        {/* Utility Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenRules}
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>
          <button
            onClick={onExit}
            className="px-2.5 py-1.5 rounded-lg border border-rose-900/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-4">
        {gameState.currentPhase === 'wonder_draft' ? (
          /* 1. Wonder Drafting Phase View */
          <SWDWonderDraft
            state={gameState}
            userId={me.userId}
            onDraftWonder={(wonderId) => handleAction({ type: 'draft_wonder', wonderId })}
          />
        ) : (
          /* 2. Main Game Arena View */
          <div className="space-y-4">
            {/* Opponent Area (Top) */}
            <SWDPlayerArea
              player={opponent}
              state={gameState}
              isCurrentPlayer={false}
              isActiveTurn={gameState.activePlayerId === opponent.userId}
            />

            {/* Central Board & Draftpool Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column: Military Conflict Track & Board Tokens */}
              <div className="lg:col-span-4 xl:col-span-3 flex justify-center bg-slate-900/60 border border-slate-800 rounded-2xl p-3 shadow-xl relative z-20">
                <SWDBoard
                  state={gameState}
                  selectableTokens={
                    gameState.currentPhase === 'choose_progress_token'
                      ? gameState.availableSelectionTokens || gameState.boardProgressTokens
                      : undefined
                  }
                  onSelectToken={(tokenId) => {
                    if (gameState.currentPhase === 'choose_progress_token' && isMyTurn) {
                      handleAction({ type: 'choose_progress_token', tokenId });
                    }
                  }}
                />
              </div>

              {/* Right/Center Column: Draftpool Card Pyramid & Action Logs */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center justify-between bg-slate-900/40 border border-slate-800 rounded-2xl p-3 sm:p-4 min-h-[500px]">
                {/* Draftpool Instructions / Turn Header */}
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-300 font-['Fredoka']">
                      Age {gameState.currentAge} Structure
                    </span>
                    <span className="text-slate-400">
                      ({gameState.draftPool.filter((c) => !c.isTaken).length} cards remaining)
                    </span>
                  </div>
                  {isMyTurn ? (
                    <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Click an uncovered card to take action!
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Waiting for {gameState.players[gameState.activePlayerId]?.name}...
                    </span>
                  )}
                </div>

                {/* Overlapping Card Pyramid */}
                <SWDDraftpool
                  draftPool={gameState.draftPool}
                  currentAge={gameState.currentAge}
                  isMyTurn={isMyTurn}
                  onSelectCard={(card) => setSelectedDraftCard(card)}
                  selectedCardId={selectedDraftCard?.id}
                />

                {/* Real-Time Action Log Ticker */}
                <div className="w-full mt-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">Latest:</span>
                  </div>
                  <div className="truncate text-slate-300 font-medium flex-1">
                    {gameState.actionLog[gameState.actionLog.length - 1] || 'Game started.'}
                  </div>
                  {gameState.extraTurn && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse shrink-0">
                      ⚡ Play Again Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* My Player Area (Bottom) */}
            <SWDPlayerArea
              player={me}
              state={gameState}
              isCurrentPlayer={true}
              isActiveTurn={isMyTurn}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {/* 1. Card Action Modal (Construct / Discard / Wonder) */}
      {selectedDraftCard && (
        <SWDActionModal
          card={selectedDraftCard}
          state={gameState}
          userId={me.userId}
          onClose={() => setSelectedDraftCard(null)}
          onConstructBuilding={(cardId) => handleAction({ type: 'construct_building', cardId })}
          onDiscardCard={(cardId) => handleAction({ type: 'discard_card', cardId })}
          onConstructWonder={(cardId, wonderId) => handleAction({ type: 'construct_wonder', cardId, wonderId })}
        />
      )}

      {/* 2. Progress Token Selection Modal */}
      {gameState.currentPhase === 'choose_progress_token' && (
        <SWDTokenSelectionModal
          tokenIds={gameState.availableSelectionTokens || gameState.boardProgressTokens}
          isMyTurn={isMyTurn}
          onSelectToken={(tokenId) => handleAction({ type: 'choose_progress_token', tokenId })}
        />
      )}

      {/* 3. Special Choice Modal (Start Player, Zeus/Circus destroy, Mausoleum reclaim) */}
      {(gameState.currentPhase === 'choose_start_player' ||
        gameState.currentPhase === 'destroy_opponent_card' ||
        gameState.currentPhase === 'choose_discarded_card') && (
        <SWDSpecialChoiceModal
          state={gameState}
          userId={me.userId}
          onChooseStartPlayer={(nextPlayerId) => handleAction({ type: 'choose_start_player', nextPlayerId })}
          onDestroyOpponentCard={(cardId) => handleAction({ type: 'destroy_opponent_card', cardId })}
          onChooseDiscardedCard={(cardId) => handleAction({ type: 'choose_discarded_card', cardId })}
        />
      )}

      {/* 4. Game Over Modal */}
      {gameState.currentPhase === 'game_over' && (
        <SWDGameOverModal
          state={gameState}
          userId={me.userId}
          onRestart={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
