import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../../types/user';
import { TableRoom } from '../../types/lobby';
import { TTRAction, TrainColor } from '../../games/ticket-to-ride/types';
import { LogOut, BookOpen, Sparkles, AlertCircle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { getSocket } from '../../services/socket';

import { TTRMap } from './TTRMap';
import { computeTTRBotAction } from '../../games/ticket-to-ride/bot';

interface TicketToRideArenaProps {
  user: UserProfile;
  table: TableRoom | null;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch: (timeSec: number, won: boolean) => void;
}

const TRAIN_CARD_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  purple: { bg: '#9333ea', border: '#7e22ce', text: '#fff', label: 'Purple' },
  blue: { bg: '#2563eb', border: '#1d4ed8', text: '#fff', label: 'Blue' },
  orange: { bg: '#ea580c', border: '#c2410c', text: '#fff', label: 'Orange' },
  white: { bg: '#ffffff', border: '#1e293b', text: '#0f172a', label: 'White' },
  green: { bg: '#16a34a', border: '#15803d', text: '#fff', label: 'Green' },
  yellow: { bg: '#eab308', border: '#ca8a04', text: '#0f172a', label: 'Yellow' },
  black: { bg: '#18181b', border: '#cbd5e1', text: '#fff', label: 'Black' },
  red: { bg: '#dc2626', border: '#b91c1c', text: '#fff', label: 'Red' },
  locomotive: { bg: 'linear-gradient(135deg, #475569 0%, #94a3b8 50%, #475569 100%)', border: '#cbd5e1', text: '#fff', label: 'Loco' },
};

export const TicketToRideArena: React.FC<TicketToRideArenaProps> = ({
  user,
  table,
  onExit,
  onOpenRules,
}) => {
  const gameState = table?.ttrState;
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredCities, setHoveredCities] = useState<[string, string] | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [showTicketsDrawer, setShowTicketsDrawer] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Bot Turn Automation
  useEffect(() => {
    if (!gameState || !table || table.hostId !== user.id) return;
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      if (gameState.turnState.state === 'initial_draft') {
        const botsNeedingDraft = table.players.filter(
          p =>
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
        const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
        const currentPlayerSlot = table.players.find(p => p.userId === currentPlayerId);
        if (!currentPlayerSlot?.isBot) return;
        const action = computeTTRBotAction(gameState);
        if (action) {
          getSocket().emit('ticket-to-ride:action', {
            tableId: table.id,
            action,
            forUserId: currentPlayerId,
          });
        }
      }
    }, 1000);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState, table, user.id]);

  if (!gameState) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium tracking-wide">Loading Ticket to Ride...</span>
        </div>
      </div>
    );
  }

  // Safety: purge any obsolete smyrna-erzurum route from active game state
  if (gameState.routes && (gameState.routes as any)['smyrna-erzurum']) {
    delete (gameState.routes as any)['smyrna-erzurum'];
  }

  const currentPlayer = gameState.players[user.id];
  const isMyTurn = gameState.playerOrder[gameState.currentPlayerIndex] === user.id;

  // Reset ticket draft selection on new pending tickets
  useEffect(() => {
    if (currentPlayer?.pendingDestinations) {
      setSelectedTickets(currentPlayer.pendingDestinations.map(t => t.id));
      setSubmitting(false);
    }
  }, [currentPlayer?.pendingDestinations]);

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
      setToastMessage({ text: "It's not your turn right now!", type: 'error' });
      return;
    }
    getSocket().emit('ticket-to-ride:action', { tableId: table.id, action });
  };

  const handleClaimRoute = (routeId: string) => {
    if (!isMyTurn) {
      setToastMessage({ text: "Wait for your turn to claim a route!", type: 'error' });
      return;
    }
    const route = gameState.routes[routeId];
    if (!route || route.claimedBy) return;

    if (!currentPlayer || currentPlayer.trainCarsRemaining < route.length) {
      setToastMessage({
        text: `You need ${route.length} train cars, but only have ${currentPlayer?.trainCarsRemaining || 0}!`,
        type: 'error',
      });
      return;
    }

    let cardsNeeded = route.length;
    const cardsUsed: TrainColor[] = [];
    const hand = [...currentPlayer.trainCards];

    let targetColor = route.color;
    if (targetColor === 'any') {
      const counts: Record<string, number> = {};
      hand.forEach(c => {
        if (c !== 'locomotive') counts[c] = (counts[c] || 0) + 1;
      });
      let maxColor = 'red';
      let maxCount = -1;
      Object.entries(counts).forEach(([c, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxColor = c;
        }
      });
      targetColor = maxCount > 0 ? (maxColor as TrainColor) : 'locomotive';
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
      setToastMessage({ text: `Claimed route ${route.city1} ➔ ${route.city2}!`, type: 'success' });
    } else {
      setToastMessage({
        text: `Not enough cards! Needs ${route.length} ${
          route.color === 'any' ? 'matching cards' : route.color
        }.`,
        type: 'error',
      });
    }
  };

  const handCardsGrouped = currentPlayer
    ? [
        'purple',
        'blue',
        'orange',
        'white',
        'green',
        'yellow',
        'black',
        'red',
        'locomotive',
      ].map(color => ({
        color: color as TrainColor,
        count: currentPlayer.trainCards.filter(c => c === color).length,
      }))
    : [];

  return (
    <div className="h-full max-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 border text-xs font-semibold transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/95 text-rose-200 border-rose-500/50 shadow-rose-950/50'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50'
              : 'bg-slate-900/95 text-amber-300 border-amber-500/50 shadow-black'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar (Redesigned without duplicated Exit & Rules buttons) */}
      <header className="h-11 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md flex items-center justify-between px-3 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xs text-xs">
            🚂
          </div>
          <div className="font-extrabold text-sm text-amber-400 tracking-tight flex items-center gap-1.5 font-serif">
            <span>Ticket to Ride: Europe</span>
          </div>
        </div>

        {/* Turn Status Alert Banner */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-xs animate-pulse">
              <Sparkles size={13} />
              <span>Your Turn — Claim Route, Draw Train Cards, or Draw Tickets</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>
                Current Turn:{' '}
                <strong className="text-amber-400 font-bold">
                  {table?.players.find(p => p.userId === gameState.playerOrder[gameState.currentPlayerIndex])?.username || 'Opponent'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Board Deck Status Indicators */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800/80 font-mono text-[11px]">
            <span title="Destination Deck Remaining">🎫</span>
            <span className="text-slate-200 font-bold">{gameState.destinationDeck.length}</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Tickets</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800/80 font-mono text-[11px]">
            <span title="Train Deck Remaining">🚂</span>
            <span className="text-slate-200 font-bold">{gameState.trainDeck.length}</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Cards</span>
          </div>
        </div>
      </header>

      {/* Horizontal Players Ribbon (Compact 38px) */}
      <div className="h-9 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm px-3 flex items-center justify-between gap-2 overflow-x-auto z-10 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Players
          </span>

          {gameState.playerOrder.map((pid, idx) => {
            const pSlot = table?.players.find(p => p.userId === pid);
            const pState = gameState.players[pid];
            const isActive = gameState.currentPlayerIndex === idx;
            if (!pSlot || !pState) return null;

            return (
              <div
                key={pid}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all shrink-0 ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/70 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full ring-2 ring-slate-950 shrink-0"
                  style={{ backgroundColor: pState.color }}
                />
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold truncate max-w-[100px] ${
                      isActive ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                    }`}
                  >
                    {pSlot.username} {pSlot.isBot && '(Bot)'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/40 px-1 rounded">
                    {pState.score} pts
                  </span>
                </div>

                <div className="w-[1px] h-3 bg-slate-800 mx-0.5" />

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span title="Train Cars Left" className="flex items-center gap-0.5 font-mono">
                    <span>🚂</span>
                    <strong className="text-slate-200">{pState.trainCarsRemaining}</strong>
                  </span>
                  <span title="Cards in Hand" className="flex items-center gap-0.5 font-mono">
                    <span>🃏</span>
                    <strong className="text-slate-200">{pState.trainCards.length}</strong>
                  </span>
                  <span title="Tickets" className="flex items-center gap-0.5 font-mono">
                    <span>🎫</span>
                    <strong className="text-slate-200">{pState.destinationTickets.length}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Expansive Centerpiece Map (Fills 100% of remaining screen height) */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        <TTRMap
          gameState={gameState}
          onClaimRoute={handleClaimRoute}
          hoveredCities={hoveredCities}
          currentUserId={user.id}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Bottom Tabletop Console / Controls Dock (Compact ~84px, Always Visible Without Scrolling) */}
      <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 py-1.5 z-20 shrink-0 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          
          {/* Section 1: Face-Up Train Cards Tray & Draw Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Face-Up Train Cards
              </span>
              <div className="flex items-center gap-1.5">
                {gameState.faceUpTrainCards.map((color, idx) => {
                  const style = TRAIN_CARD_STYLES[color] || TRAIN_CARD_STYLES.black;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleAction({ type: 'DRAW_FACE_UP_TRAIN', cardIndex: idx })}
                      className="w-9 h-12 rounded-md border shadow-md flex flex-col items-center justify-center cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-transform relative select-none"
                      style={{
                        background: style.bg,
                        borderColor: style.border,
                        color: style.text,
                      }}
                      title={`Draw ${style.label} card`}
                    >
                      {color === 'locomotive' ? (
                        <span className="text-sm">🚂</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase">{color.slice(0, 3)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deck Action Buttons */}
            <div className="flex flex-col gap-1 ml-1">
              <button
                onClick={() => handleAction({ type: 'DRAW_DECK_TRAIN' })}
                disabled={!isMyTurn || gameState.trainDeck.length === 0}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/80 rounded-md text-[11px] font-semibold text-slate-200 hover:text-white transition flex items-center justify-between gap-2 shadow-sm"
              >
                <span>Draw Mystery Train</span>
                <span className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-amber-400 font-bold">
                  {gameState.trainDeck.length}
                </span>
              </button>
              <button
                onClick={() => handleAction({ type: 'DRAW_DESTINATIONS' })}
                disabled={!isMyTurn || gameState.destinationDeck.length === 0}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/80 rounded-md text-[11px] font-semibold text-slate-200 hover:text-white transition flex items-center justify-between gap-2 shadow-sm"
              >
                <span>Draw Tickets</span>
                <span className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-amber-400 font-bold">
                  {gameState.destinationDeck.length}
                </span>
              </button>
            </div>
          </div>

          <div className="hidden lg:block w-[1px] h-10 bg-slate-800/80" />

          {/* Section 2: Player's Train Cards Hand */}
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Your Hand</span>
                {currentPlayer && (
                  <span className="text-slate-400 font-normal">
                    (🚂 {currentPlayer.trainCarsRemaining} Cars · 🚉 {currentPlayer.stationsRemaining} Stations · ⭐ {currentPlayer.score} pts)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {handCardsGrouped.map(({ color, count }) => {
                const style = TRAIN_CARD_STYLES[color] || TRAIN_CARD_STYLES.black;
                return (
                  <div
                    key={color}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${
                      count > 0
                        ? 'bg-slate-900/90 border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-sm shrink-0 border border-black/30"
                      style={{ background: style.bg }}
                    />
                    <span className="text-[11px] font-medium capitalize text-slate-300">
                      {color === 'locomotive' ? 'Loco' : color}
                    </span>
                    <span
                      className={`text-[11px] font-bold font-mono px-0.5 rounded ${
                        count > 0 ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block w-[1px] h-10 bg-slate-800/80" />

          {/* Section 3: Destination Tickets Quick Drawer */}
          <div className="shrink-0 relative">
            <button
              onClick={() => setShowTicketsDrawer(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
            >
              <span>🎫 Tickets</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                {currentPlayer?.destinationTickets.length || 0}
              </span>
              {showTicketsDrawer ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {/* Destination Tickets Popover Drawer */}
            {showTicketsDrawer && (
              <div className="absolute bottom-full right-0 mb-2 w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-3 text-xs z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <h4 className="font-bold text-amber-400 text-xs">
                    Your Destination Tickets ({currentPlayer?.destinationTickets.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400">Hover to trace</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {currentPlayer?.destinationTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 flex items-center justify-between transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredCities([ticket.city1, ticket.city2])}
                      onMouseLeave={() => setHoveredCities(null)}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-[11px]">
                          {ticket.city1} ➔ {ticket.city2}
                        </span>
                        <span className="text-[9.5px] text-slate-400">Hover to highlight</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/20">
                        +{ticket.points}
                      </span>
                    </div>
                  ))}

                  {(!currentPlayer || currentPlayer.destinationTickets.length === 0) && (
                    <div className="text-slate-500 text-center py-3 italic text-xs">
                      No destination tickets yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Draft Selection Panel (No map blur - map stays 100% sharp and visible) */}
      {currentPlayer?.pendingDestinations && (
        <div className="absolute inset-0 z-50 flex items-center justify-end pointer-events-none animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full bg-slate-900/95 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
                <span>🎫</span>
                <span>
                  {gameState.turnState.state === 'initial_draft'
                    ? 'Select Starting Destination Tickets'
                    : 'Draw Destination Tickets'}
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                {gameState.turnState.state === 'initial_draft'
                  ? 'Keep at least 2 tickets. Hover each ticket to highlight the route path on the Europe board!'
                  : 'Keep at least 1 ticket from the drawn selection.'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
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
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500/80 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm text-slate-100">{ticket.city1}</div>
                        <div className="text-slate-400 text-[10px] my-0.5">➔ to destination</div>
                        <div className="font-bold text-sm text-slate-100">{ticket.city2}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-400 font-mono">
                          +{ticket.points}
                        </div>
                        <div className="text-[10px] text-slate-400">points</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {isSelected ? '✓ Keeping this ticket' : '✕ Discarding'}
                      </span>
                      <span className="text-[10px] text-slate-400">Hover to trace</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
              <div className="text-xs text-slate-400 mb-2 text-center">
                <strong>{selectedTickets.length}</strong> selected
                {gameState.turnState.state === 'initial_draft' && selectedTickets.length < 2 && (
                  <span className="text-rose-400 ml-1 font-semibold">
                    (must keep at least 2)
                  </span>
                )}
              </div>
              <button
                onClick={handleKeepTickets}
                disabled={
                  submitting ||
                  (gameState.turnState.state === 'initial_draft' && selectedTickets.length < 2) ||
                  (gameState.turnState.state !== 'initial_draft' && selectedTickets.length < 1)
                }
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-md transition-colors text-sm"
              >
                {submitting ? 'Confirming...' : 'Confirm Ticket Selection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
