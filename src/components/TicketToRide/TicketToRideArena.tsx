import React, { useEffect, useRef } from 'react';
import { UserProfile } from '../../types/user';
import { TableRoom } from '../../types/lobby';
import { TTRAction } from '../../games/ticket-to-ride/types';
import { LogOut } from 'lucide-react';
import { getSocket } from '../../services/socket';

import { TTRMap } from './TTRMap';
import { TrainColor } from '../../games/ticket-to-ride/types';
import { computeTTRBotAction } from '../../games/ticket-to-ride/bot';

interface TicketToRideArenaProps {
  user: UserProfile;
  table: TableRoom | null;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch: (timeSec: number, won: boolean) => void;
}

export const TicketToRideArena: React.FC<TicketToRideArenaProps> = ({
  user,
  table,
  onExit,
}) => {
  const gameState = table?.ttrState;
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!gameState || !table || table.hostId !== user.id) return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      if (gameState.turnState.state === 'initial_draft') {
        // During initial draft: submit on behalf of each bot that hasn't confirmed yet
        const botsNeedingDraft = table.players.filter(p =>
          p.isBot &&
          !gameState.setupFinishedBy.includes(p.userId) &&
          gameState.players[p.userId]?.pendingDestinations
        );
        botsNeedingDraft.forEach(botSlot => {
          const botPlayer = gameState.players[botSlot.userId];
          if (!botPlayer?.pendingDestinations) return;
          const keptIds = botPlayer.pendingDestinations.slice(0, 2).map(t => t.id);
          getSocket().emit('ticket-to-ride:action', {
            tableId: table.id,
            action: { type: 'KEEP_DESTINATIONS', keptIds },
            forUserId: botSlot.userId,
          });
        });
      } else {
        // Normal turn: act for the current player if it's a bot
        const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
        const currentPlayerSlot = table.players.find(p => p.userId === currentPlayerId);
        if (!currentPlayerSlot?.isBot) return;
        const action = computeTTRBotAction(gameState);
        if (action) {
          getSocket().emit('ticket-to-ride:action', { 
            tableId: table.id, 
            action,
            forUserId: currentPlayerId
          });
        }
      }
    }, 1000);

    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, [gameState, table, user.id]);

  if (!gameState) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Loading Ticket to Ride...
      </div>
    );
  }

  const currentPlayer = gameState.players[user.id];
  const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === user.id;
  const isDrafting = gameState.turnState.state === 'initial_draft' || 
                     (gameState.turnState.state === 'choosing_destinations' && !!currentPlayer?.pendingDestinations);

  const [selectedTickets, setSelectedTickets] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [hoveredCities, setHoveredCities] = React.useState<[string, string] | null>(null);

  // Reset on new pending destinations
  useEffect(() => {
    if (currentPlayer?.pendingDestinations) {
      setSelectedTickets(currentPlayer.pendingDestinations.map(t => t.id));
      setSubmitting(false);
    }
  }, [currentPlayer?.pendingDestinations]);

  // Keyboard shortcut: Esc -> deselect tickets in draft panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTickets([]);
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, []);

  const handleKeepTickets = () => {
    if (!table?.id || submitting) return;
    setSubmitting(true);
    getSocket().emit('ticket-to-ride:action', {
      tableId: table.id,
      action: { type: 'KEEP_DESTINATIONS', keptIds: selectedTickets },
    });
  };

  const handleAction = (action: TTRAction) => {
    if (!table?.id) return;
    if (!isMyTurn) {
      console.warn('[TTR] Not your turn. State:', gameState.turnState.state, 'currentPlayer:', gameState.playerOrder[gameState.currentPlayerIndex], 'me:', user.id);
      return;
    }
    console.log('[TTR] Emitting action:', action.type, 'state:', gameState.turnState.state);
    getSocket().emit('ticket-to-ride:action', { tableId: table.id, action });
  };

  const handleClaimRoute = (routeId: string) => {
    if (!isMyTurn) return;
    const route = gameState.routes[routeId];
    if (!route || route.claimedBy) return;

    // Auto-select cards (greedy: specific color first, then locomotives)
    let cardsNeeded = route.length;
    const cardsUsed: TrainColor[] = [];
    const hand = [...currentPlayer.trainCards];
    
    let targetColor = route.color;
    if (targetColor === 'any') {
      // Find the color we have the most of (excluding locomotives for a moment)
      const counts: Record<string, number> = {};
      hand.forEach(c => { if (c !== 'locomotive') counts[c] = (counts[c] || 0) + 1; });
      let maxColor = 'red';
      let maxCount = -1;
      Object.entries(counts).forEach(([c, count]) => {
        if (count > maxCount) { maxCount = count; maxColor = c; }
      });
      targetColor = (maxCount > 0) ? maxColor as TrainColor : 'locomotive';
    }

    // Spend target color
    for (let i = hand.length - 1; i >= 0 && cardsNeeded > 0; i--) {
      if (hand[i] === targetColor) {
        cardsUsed.push(hand[i]);
        hand.splice(i, 1);
        cardsNeeded--;
      }
    }
    // Spend locomotives if needed
    for (let i = hand.length - 1; i >= 0 && cardsNeeded > 0; i--) {
      if (hand[i] === 'locomotive') {
        cardsUsed.push(hand[i]);
        hand.splice(i, 1);
        cardsNeeded--;
      }
    }

    if (cardsNeeded === 0) {
      handleAction({ type: 'CLAIM_ROUTE', routeId, cardsUsed });
    } else {
      alert(`Not enough cards to claim this route! (Needs ${route.length} ${route.color === 'any' ? 'matching cards' : route.color})`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-200 relative overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="font-bold text-lg text-amber-500">
            Ticket to Ride: Europe
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold">
            {isMyTurn ? (
              <span className="text-emerald-400 animate-pulse">Your Turn!</span>
            ) : (
              <span className="text-slate-400">
                Waiting for {gameState.players[gameState.playerOrder[gameState.currentPlayerIndex]]?.color}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Game Board SVG */}
        <div className="flex-[3] relative bg-slate-900 border-r border-slate-800 p-2 overflow-auto">
          <TTRMap gameState={gameState} onClaimRoute={handleClaimRoute} hoveredCities={hoveredCities} />
        </div>

        {/* Right Side: Player Hand & Decks */}
        <div className="flex-[1] flex flex-col bg-slate-950 overflow-y-auto w-80">
          
          {/* Opponent Status Summary */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wider">Players</h3>
            <div className="space-y-2">
              {gameState.playerOrder.map((pid, idx) => {
                const pSlot = table?.players.find(p => p.userId === pid);
                const pState = gameState.players[pid];
                const isActive = gameState.currentPlayerIndex === idx;
                if (!pSlot || !pState) return null;

                return (
                  <div key={pid} className={`p-2 rounded-lg border flex items-center justify-between ${isActive ? 'bg-slate-800 border-amber-500' : 'bg-slate-900 border-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pState.color }} />
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold truncate max-w-[100px] ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
                          {pSlot.username}
                        </span>
                        <span className="text-xs text-amber-400">{pState.score} pts</span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-slate-400 text-center">
                      <div title="Train Cars" className="flex flex-col items-center">
                        <span className="text-[10px]">🚂</span>
                        <strong className="text-slate-200">{pState.trainCarsRemaining}</strong>
                      </div>
                      <div title="Train Cards" className="flex flex-col items-center">
                        <span className="text-[10px]">🃏</span>
                        <strong className="text-slate-200">{pState.trainCards.length}</strong>
                      </div>
                      <div title="Destination Tickets" className="flex flex-col items-center">
                        <span className="text-[10px]">🎫</span>
                        <strong className="text-slate-200">{pState.destinationTickets.length}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Face Up Train Cards */}
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wider">Face-Up Cards</h3>
            <div className="flex gap-2 flex-wrap">
              {gameState.faceUpTrainCards.map((color, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleAction({ type: 'DRAW_FACE_UP_TRAIN', cardIndex: idx })}
                  className="w-12 h-16 rounded shadow-sm border border-slate-700 flex items-center justify-center cursor-pointer hover:-translate-y-1 transition"
                  style={{ backgroundColor: color === 'locomotive' ? '#ddd' : color }}
                  title={color}
                >
                  {color === 'locomotive' ? '🚂' : ''}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4">
              <button 
                onClick={() => handleAction({ type: 'DRAW_DECK_TRAIN' })}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold border border-slate-700"
              >
                Draw Train ({gameState.trainDeck.length})
              </button>
              <button 
                onClick={() => handleAction({ type: 'DRAW_DESTINATIONS' })}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold border border-slate-700"
              >
                Draw Tickets ({gameState.destinationDeck.length})
              </button>
            </div>
          </div>

          {/* Player State & Hand */}
          {currentPlayer && (
            <div className="p-4 flex-1">
              <h3 className="font-bold text-slate-300 mb-2 text-sm uppercase tracking-wider">Your Hand</h3>
              <div className="flex gap-4 mb-4 text-xs text-slate-400">
                <div>🚂 Cars: <strong className="text-slate-200">{currentPlayer.trainCarsRemaining}</strong></div>
                <div>🚉 Stations: <strong className="text-slate-200">{currentPlayer.stationsRemaining}</strong></div>
                <div>⭐ Score: <strong className="text-amber-400">{currentPlayer.score}</strong></div>
              </div>

              {/* Train Cards grouped by color */}
              <div className="space-y-1 mb-6">
                {Array.from(new Set(currentPlayer.trainCards)).map(color => {
                  const count = currentPlayer.trainCards.filter(c => c === color).length;
                  return (
                    <div key={color} className="flex justify-between items-center bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color === 'locomotive' ? '#ddd' : color }} />
                        <span className="capitalize text-sm">{color}</span>
                      </div>
                      <span className="font-bold">x{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Destination Tickets */}
              <h3 className="font-bold text-slate-300 mb-2 text-sm uppercase tracking-wider">Destination Tickets</h3>
              <div className="space-y-2">
                {currentPlayer.destinationTickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex justify-between text-sm cursor-help hover:bg-slate-700 hover:border-slate-500 transition-colors"
                    onMouseEnter={() => setHoveredCities([ticket.city1, ticket.city2])}
                    onMouseLeave={() => setHoveredCities(null)}
                  >
                    <span>{ticket.city1} - {ticket.city2}</span>
                    <span className="text-amber-400 font-bold">{ticket.points}</span>
                  </div>
                ))}
                {currentPlayer.destinationTickets.length === 0 && (
                  <div className="text-slate-500 text-sm italic">No tickets yet.</div>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Ticket Draft Panel - slides in from right, map stays visible */}
      {currentPlayer?.pendingDestinations && (
        <div className="absolute inset-0 z-50 flex">
          {/* Dim left side (map) but keep visible */}
          <div className="flex-1 bg-black/30" />

          {/* Right panel - full height, scrollable */}
          <div className="w-96 bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto">
            {/* Sticky header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 z-10">
              <h2 className="text-lg font-bold text-amber-400 mb-1">
                {gameState.turnState.state === 'initial_draft' ? '🎫 Choose Starting Tickets' : '🎫 Draw Destination Tickets'}
              </h2>
              <p className="text-slate-400 text-xs">
                {gameState.turnState.state === 'initial_draft'
                  ? 'Keep at least 2. Check the map to plan your routes!'
                  : 'Keep at least 1 ticket from the draw.'}
              </p>
            </div>

            {/* Ticket cards */}
            <div className="p-4 space-y-3">
              {currentPlayer.pendingDestinations.map(ticket => {
                const isSelected = selectedTickets.includes(ticket.id);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTickets(prev => prev.filter(id => id !== ticket.id));
                      } else {
                        setSelectedTickets(prev => [...prev, ticket.id]);
                      }
                    }}
                    onMouseEnter={() => setHoveredCities([ticket.city1, ticket.city2])}
                    onMouseLeave={() => setHoveredCities(null)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-emerald-900/50 border-emerald-500 shadow-lg'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">{ticket.city1}</div>
                        <div className="text-slate-500 text-xs">↓ to</div>
                        <div className="font-bold">{ticket.city2}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-400">{ticket.points}</div>
                        <div className="text-xs text-slate-500">pts</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {isSelected ? '✅ Keeping' : '❌ Discarding (returns to deck)'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4">
              <div className="text-xs text-slate-500 mb-3 text-center">
                {selectedTickets.length} selected
                {gameState.turnState.state === 'initial_draft' && selectedTickets.length < 2 && (
                  <span className="text-red-400"> — must keep at least 2</span>
                )}
              </div>
              <button
                onClick={handleKeepTickets}
                disabled={
                  submitting ||
                  (gameState.turnState.state === 'initial_draft' && selectedTickets.length < 2) ||
                  (gameState.turnState.state !== 'initial_draft' && selectedTickets.length < 1)
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition"
              >
                {submitting ? 'Confirming...' : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
