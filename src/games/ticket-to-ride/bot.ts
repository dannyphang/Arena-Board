import {
  TTRGameState,
  TTRAction,
  TrainColor,
  PlayerState,
} from './types';
import { INITIAL_ROUTES, INITIAL_DESTINATIONS } from './constants';

// ... (existing code)

export function computeTTRBotAction(state: TTRGameState): TTRAction | null {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  const player = state.players[currentPlayerId];
  if (!player) return null;

  // Simplest AI: Try to claim a random unclaimed route that we can afford.
  // If we can't afford any, draw from deck.
  const unclaimedRoutes = Object.values(state.routes).filter(r => !r.claimedBy);

  // If we need to select tickets, select the easiest ones or just a minimum amount
  if (state.turnState.state === 'initial_draft' && !state.setupFinishedBy.includes(currentPlayerId)) {
    if (player.pendingDestinations) {
      // Just keep the first 2
      const keptIds = player.pendingDestinations.slice(0, 2).map(t => t.id);
      return { type: 'KEEP_DESTINATIONS', keptIds };
    }
  }

  if (state.turnState.state === 'choosing_destinations') {
    if (player.pendingDestinations) {
      // Just keep 1
      const keptIds = [player.pendingDestinations[0].id];
      return { type: 'KEEP_DESTINATIONS', keptIds };
    }
  }

  // If we just drew a card, we must draw another card
  if (state.turnState.state === 'drew_one_train') {
    return { type: 'DRAW_DECK_TRAIN' };
  }

  for (const route of unclaimedRoutes) {
    if (player.trainCarsRemaining < route.length) continue;

    // Check if we can afford this route
    const hand = [...player.trainCards];
    let cardsNeeded = route.length;
    const cardsUsed: TrainColor[] = [];
    
    let targetColor = route.color;
    if (targetColor === 'any') {
      const counts: Record<string, number> = {};
      hand.forEach(c => { if (c !== 'locomotive') counts[c] = (counts[c] || 0) + 1; });
      let maxColor = 'red';
      let maxCount = -1;
      Object.entries(counts).forEach(([c, count]) => {
        if (count > maxCount) { maxCount = count; maxColor = c; }
      });
      targetColor = (maxCount >= cardsNeeded) ? maxColor as TrainColor : 'locomotive';
    }

    // Try spending target color
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
      return { type: 'CLAIM_ROUTE', routeId: route.id, cardsUsed };
    }
  }

  // If no routes can be claimed, draw from deck
  return { type: 'DRAW_DECK_TRAIN' };
}
