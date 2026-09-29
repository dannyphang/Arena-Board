import React, { useState, useEffect, useCallback } from 'react';
import { TableRoom, PlayerSlot } from '../../types/lobby';
import { UserProfile } from '../../types/user';
import { PieceId, PlacedPiece, CoordString } from '../../games/genius-square/types';
import {
  ALL_PIECE_IDS,
  PIECES,
  GENIUS_SQUARE_DICE,
} from '../../games/genius-square/constants';
import {
  PieceOrientation,
  getUniqueOrientations,
  getHint,
  solveGeniusSquare,
  rollGeniusSquareDice,
} from '../../games/genius-square/solver';
import { sounds } from '../../services/audio';
import { getSocket } from '../../services/socket';
import { GameBoard } from './GameBoard';
import { PieceTray } from './PieceTray';
import { OpponentBoard } from './OpponentBoard';
import { InGameChat } from './InGameChat';
import { GameHeader } from './GameHeader';
import { VictoryModal } from './VictoryModal';
import { Play, Copy, Check, Users, Swords, Bot, Sparkles, AlertCircle, Dices } from 'lucide-react';

interface GameArenaProps {
  user: UserProfile;
  table: TableRoom | null; // null if solo practice
  isSoloPractice?: boolean;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch: (timeSec: number, won: boolean) => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  user,
  table,
  isSoloPractice = false,
  onExit,
  onOpenRules,
  onRecordMatch,
}) => {
  // Board state
  const [blockers, setBlockers] = useState<CoordString[]>(() =>
    table ? table.blockers : rollGeniusSquareDice()
  );
  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>([]);
  const [selectedOrientation, setSelectedOrientation] = useState<PieceOrientation | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Time tracking
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Victory / Game over state
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{
    id: string;
    name: string;
    avatar: string;
    timeSeconds: number;
  } | null>(null);
  const [isForfeit, setIsForfeit] = useState(false);

  // Opponent state
  const isHost = table ? table.hostId === user.id : true;
  const opponent = table
    ? table.players.find((p) => p.userId !== user.id) || null
    : null;

  // Socket instance
  const socket = getSocket();

  // Reset local board for a new round
  const resetRound = useCallback(
    (newBlockers: CoordString[]) => {
      setBlockers(newBlockers);
      setPlacedPieces([]);
      setSelectedOrientation(null);
      setTimeElapsed(0);
      setIsGameOver(false);
      setWinnerInfo(null);
      setIsForfeit(false);
    },
    []
  );

  // Synchronize when table updates from server
  useEffect(() => {
    if (!table) return;

    if (table.status === 'in-game' && !timerActive && !isGameOver) {
      setTimerActive(true);
      resetRound(table.blockers);
    } else if (table.status === 'waiting') {
      setTimerActive(false);
    }

    if (table.winner && !isGameOver) {
      setIsGameOver(true);
      setWinnerInfo(table.winner);
      setTimerActive(false);
      const isMeWinner = table.winner.id === user.id;
      onRecordMatch(table.winner.timeSeconds, isMeWinner);
    }
  }, [table, timerActive, isGameOver, resetRound, user.id, onRecordMatch]);

  // Solo practice auto-start timer
  useEffect(() => {
    if (isSoloPractice) {
      setTimerActive(true);
      resetRound(rollGeniusSquareDice());
    }
  }, [isSoloPractice, resetRound]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Socket event listener for game over and board sync
  useEffect(() => {
    if (!table) return;

    const handleGameOver = (data: { table: TableRoom; winner: any; forfeit?: boolean }) => {
      setIsGameOver(true);
      setWinnerInfo(data.winner);
      setTimerActive(false);
      setIsForfeit(!!data.forfeit);
      const isMe = data.winner?.id === user.id;
      onRecordMatch(data.winner?.timeSeconds || timeElapsed, isMe);
    };

    socket.on('table:game_over', handleGameOver);

    return () => {
      socket.off('table:game_over', handleGameOver);
    };
  }, [table, socket, user.id, timeElapsed, onRecordMatch]);

  // Rotation & Flip helpers
  const handleRotate = useCallback(() => {
    if (!selectedOrientation) return;
    const allOris = getUniqueOrientations(selectedOrientation.pieceId);
    const nextIdx = (selectedOrientation.orientationIndex + 1) % allOris.length;
    setSelectedOrientation(allOris[nextIdx]);
  }, [selectedOrientation]);

  const handleFlip = useCallback(() => {
    if (!selectedOrientation) return;
    const allOris = getUniqueOrientations(selectedOrientation.pieceId);
    // If piece has 8 orientations, flip jumps by 4; otherwise jumps to next distinct
    const nextIdx = (selectedOrientation.orientationIndex + 2) % allOris.length;
    setSelectedOrientation(allOris[nextIdx]);
  }, [selectedOrientation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        sounds.playRotate();
        handleRotate();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        sounds.playRotate();
        handleFlip();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedOrientation(null);
      } else if (e.key >= '1' && e.key <= '9') {
        const pieceIdx = parseInt(e.key, 10) - 1;
        const pieceId = ALL_PIECE_IDS[pieceIdx];
        if (pieceId && !placedPieces.some((p) => p.pieceId === pieceId)) {
          sounds.playPop();
          const oris = getUniqueOrientations(pieceId);
          setSelectedOrientation(oris[0]);
        }
      }
    };

    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, [handleRotate, handleFlip, placedPieces]);

  // Place a piece onto board
  const handlePiecePlaced = (piece: PlacedPiece) => {
    const updated = [...placedPieces.filter((p) => p.pieceId !== piece.pieceId), piece];
    setPlacedPieces(updated);
    setSelectedOrientation(null);

    const filledCells = updated.reduce((sum, p) => sum + p.coords.length, 0);
    const isComplete = updated.length === 9 && filledCells === 29;

    // Send move to server if in multiplayer table
    if (table) {
      socket.emit('game:move', {
        tableId: table.id,
        placedPieces: updated,
        filledCells,
        isComplete,
        timeElapsed,
      });
    }

    // If solo practice completion
    if (isSoloPractice && isComplete) {
      setTimerActive(false);
      setIsGameOver(true);
      setWinnerInfo({
        id: user.id,
        name: user.username,
        avatar: user.avatar,
        timeSeconds: timeElapsed,
      });
      onRecordMatch(timeElapsed, true);
    }
  };

  // Remove a piece from board
  const handlePieceRemoved = (pieceId: PieceId) => {
    const updated = placedPieces.filter((p) => p.pieceId !== pieceId);
    setPlacedPieces(updated);

    const filledCells = updated.reduce((sum, p) => sum + p.coords.length, 0);
    if (table) {
      socket.emit('game:move', {
        tableId: table.id,
        placedPieces: updated,
        filledCells,
        isComplete: false,
        timeElapsed,
      });
    }
  };

  // Recall all pieces
  const handleRecallAll = () => {
    setPlacedPieces([]);
    setSelectedOrientation(null);
    if (table) {
      socket.emit('game:move', {
        tableId: table.id,
        placedPieces: [],
        filledCells: 0,
        isComplete: false,
        timeElapsed,
      });
    }
  };

  // Hint solver
  const handleHint = () => {
    const hintPiece = getHint(blockers, placedPieces);
    if (hintPiece) {
      // Place the hint piece!
      handlePiecePlaced(hintPiece);
      sounds.playSnap();
    } else {
      sounds.playBuzz();
    }
  };

  // Show computer solution
  const handleShowFullSolution = () => {
    const res = solveGeniusSquare(blockers);
    if (res.solved && res.solution) {
      setPlacedPieces(res.solution);
      setSelectedOrientation(null);
    }
  };

  // Rematch
  const handleRematch = () => {
    if (table) {
      socket.emit('table:rematch', { tableId: table.id });
    } else {
      resetRound(rollGeniusSquareDice());
      setTimerActive(true);
    }
  };

  // Start match (Host triggers)
  const handleHostStart = () => {
    if (table) {
      sounds.playDiceRoll();
      socket.emit('table:start', { tableId: table.id });
    }
  };

  // Send in-game chat
  const handleSendMessage = (text: string) => {
    if (table) {
      socket.emit('table:chat', { tableId: table.id, text });
    }
  };

  // If table is waiting for players (Lobby view)
  if (table && table.status === 'waiting') {
    const canStart = table.players.length === 2 && isHost;
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Dices className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black font-['Fredoka'] text-slate-100">
                  {table.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lobby
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Time control: <strong className="text-amber-400">{table.timeControl}</strong> • Flagship Genius Square Match
              </p>
            </div>

            {table.roomCode && (
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-left pl-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Invite Code
                  </div>
                  <div className="font-mono font-black text-amber-400 text-sm tracking-wider">
                    {table.roomCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(table.roomCode || '');
                    setCopiedCode(true);
                    sounds.playPop();
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Copy room code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Players Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Player 1 (Host) */}
            <div className="bg-slate-950/80 border border-amber-500/40 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                  {table.players[0]?.avatar}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                    <span>{table.players[0]?.username}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                      HOST
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 font-semibold">
                    {table.players[0]?.rating} ELO
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Ready
              </span>
            </div>

            {/* Player 2 */}
            {table.players[1] ? (
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {table.players[1].avatar}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{table.players[1].username}</span>
                      {table.players[1].isBot && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-400 font-semibold">
                      {table.players[1].rating} ELO
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Ready
                </span>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-dashed border-slate-800 p-5 rounded-2xl flex items-center justify-center text-center">
                <div>
                  <div className="text-slate-500 text-sm font-semibold mb-1">
                    Waiting for Opponent...
                  </div>
                  <div className="text-xs text-slate-400">
                    Share the room code or invite a friend!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table Chat in Lobby */}
          <div className="mb-6">
            <InGameChat
              messages={table.messages}
              currentUserId={user.id}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              ← Leave Table
            </button>

            {isHost ? (
              <button
                disabled={!canStart}
                onClick={handleHostStart}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 transition cursor-pointer flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                {canStart ? 'Roll Dice & Start Match!' : 'Waiting for Player 2...'}
              </button>
            ) : (
              <div className="text-xs font-bold text-amber-400 animate-pulse">
                Waiting for host to start the round...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active in-game arena view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4 text-slate-100">
      {/* Header with timer, 7 blockers, hint, rules, clear, resign */}
      <GameHeader
        blockers={blockers}
        timeElapsed={timeElapsed}
        onHint={handleHint}
        onClearBoard={handleRecallAll}
        onOpenRules={onOpenRules}
        onResign={onExit}
        isSoloPractice={isSoloPractice}
      />

      {/* Main Dual Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: YOUR INTERACTIVE BOARD & PIECE TRAY */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
            {/* Header label */}
            <div className="w-full flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{user.avatar}</span>
                <span className="font-extrabold text-sm text-slate-200 font-['Fredoka']">
                  Your Board
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {placedPieces.length}/9 Shapes ({placedPieces.reduce((s, p) => s + p.coords.length, 0)}/29 Cells)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono font-bold">R</kbd> to Rotate • <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono font-bold">F</kbd> to Flip
              </div>
            </div>

            {/* Interactive 6x6 Board */}
            <GameBoard
              blockers={blockers}
              placedPieces={placedPieces}
              selectedOrientation={selectedOrientation}
              onPiecePlaced={handlePiecePlaced}
              onPieceRemoved={handlePieceRemoved}
            />
          </div>

          {/* Piece Inventory Dock */}
          <PieceTray
            placedPieces={placedPieces}
            selectedOrientation={selectedOrientation}
            onSelectOrientation={setSelectedOrientation}
            onRotate={handleRotate}
            onFlip={handleFlip}
            onRecallAll={handleRecallAll}
          />
        </div>

        {/* Right Column: OPPONENT'S LIVE BOARD & TABLE CHAT */}
        <div className="lg:col-span-4 space-y-4">
          {!isSoloPractice && (
            <OpponentBoard opponent={opponent} blockers={blockers} />
          )}

          {isSoloPractice ? (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 font-['Fredoka']">
                <Sparkles className="w-4 h-4" /> Solo Practice Sandbox
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice speed solving without pressure! Test spatial rotations, explore different corner strategies, and challenge your personal best time.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    sounds.playDiceRoll();
                    resetRound(rollGeniusSquareDice());
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Roll New 7 Dice
                </button>
                <button
                  onClick={handleShowFullSolution}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Auto-Solve with AI Engine
                </button>
              </div>
            </div>
          ) : (
            <InGameChat
              messages={table?.messages || []}
              currentUserId={user.id}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      <VictoryModal
        isOpen={isGameOver}
        isWinner={winnerInfo?.id === user.id}
        winnerName={winnerInfo?.name || 'Player'}
        winnerAvatar={winnerInfo?.avatar || 'trophy'}
        timeSeconds={winnerInfo?.timeSeconds || timeElapsed}
        forfeit={isForfeit}
        onRematch={handleRematch}
        onReturnLobby={onExit}
        onShowSolution={handleShowFullSolution}
      />
    </div>
  );
};
