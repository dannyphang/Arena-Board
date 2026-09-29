import {
  TTRGameState,
  TTRAction,
  TrainColor,
  PlayerState,
} from './types';
import { INITIAL_ROUTES, INITIAL_DESTINATIONS } from './constants';

const ALL_COLORS: TrainColor[] = [
  'purple', 'blue', 'orange', 'white', 'green', 'yellow', 'black', 'red'
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateTrainDeck(): TrainColor[] {
  const deck: TrainColor[] = [];
  // 12 of each standard color
  ALL_COLORS.forEach(color => {
    for (let i = 0; i < 12; i++) deck.push(color);
  });
  // 14 locomotives
  for (let i = 0; i < 14; i++) deck.push('locomotive');
  return shuffle(deck);
}

export function createInitialTTRGame(playerIds: string[]): TTRGameState {
  const trainDeck = generateTrainDeck();
  const faceUpTrainCards = trainDeck.splice(0, 5);
  
  // Separate Long and Regular routes
  const longRoutes = shuffle(INITIAL_DESTINATIONS.slice(0, 6));
  const regularRoutes = shuffle(INITIAL_DESTINATIONS.slice(6));
  
  const players: Record<string, PlayerState> = {};
  const colors = ['#e11d48', '#2563eb', '#16a34a', '#eab308', '#000000']; // Red, Blue, Green, Yellow, Black
  
  playerIds.forEach((userId, index) => {
    const hand = trainDeck.splice(0, 4);
    
    // Deal 1 long route and 3 regular routes for the initial draft
    const dealtTickets = [
      longRoutes.pop()!,
      regularRoutes.pop()!,
      regularRoutes.pop()!,
      regularRoutes.pop()!
    ];

    players[userId] = {
      userId,
      color: colors[index % colors.length],
      trainCarsRemaining: 45,
      stationsRemaining: 3,
      trainCards: hand,
      destinationTickets: [],
      pendingDestinations: dealtTickets,
      score: 0,
      longestRouteLength: 0,
    };
  });

  // Combine remaining tickets to form the destination deck
  const destinationDeck = shuffle([...longRoutes, ...regularRoutes]);

  return {
    players,
    playerOrder: playerIds,
    currentPlayerIndex: 0,
    routes: JSON.parse(JSON.stringify(INITIAL_ROUTES)), // deep copy
    trainDeck,
    trainDiscard: [],
    faceUpTrainCards,
    destinationDeck,
    turnState: {
      state: 'initial_draft'
    },
    setupFinishedBy: [],
    history: ['Game started. Please select your initial destination tickets.'],
  };
}

function nextTurn(state: TTRGameState) {
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
  state.turnState = { state: 'start_turn' };
}

function refillFaceUpCards(state: TTRGameState) {
  while (state.faceUpTrainCards.length < 5 && state.trainDeck.length > 0) {
    state.faceUpTrainCards.push(state.trainDeck.pop()!);
  }
  
  // Rule: If 3 locomotives are face up, discard all 5 and draw 5 new ones
  const locomotives = state.faceUpTrainCards.filter(c => c === 'locomotive').length;
  if (locomotives >= 3) {
    state.trainDiscard.push(...state.faceUpTrainCards);
    state.faceUpTrainCards = [];
    while (state.faceUpTrainCards.length < 5 && state.trainDeck.length > 0) {
      state.faceUpTrainCards.push(state.trainDeck.pop()!);
    }
  }
}

export function processTTRAction(state: TTRGameState, userId: string, action: TTRAction): TTRGameState {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];

  // During initial draft, any player can submit their ticket selection simultaneously
  const isDraftAction = state.turnState.state === 'initial_draft' && action.type === 'KEEP_DESTINATIONS';
  if (!isDraftAction && userId !== currentPlayerId) {
    throw new Error('Not your turn');
  }

  if (!state.players[userId]) {
    throw new Error('Player not in this game');
  }

  const newState = JSON.parse(JSON.stringify(state)) as TTRGameState;
  const player = newState.players[userId];

  switch (action.type) {
    case 'DRAW_FACE_UP_TRAIN': {
      if (newState.turnState.state !== 'start_turn' && newState.turnState.state !== 'drew_one_train') {
        throw new Error('Cannot draw train card now');
      }
      const card = newState.faceUpTrainCards[action.cardIndex];
      if (!card) throw new Error('Invalid card index');
      
      // Drawing a face-up locomotive takes your whole turn
      if (card === 'locomotive' && newState.turnState.state === 'drew_one_train') {
        throw new Error('Cannot draw a face-up locomotive as your second card');
      }

      newState.faceUpTrainCards.splice(action.cardIndex, 1);
      player.trainCards.push(card);
      newState.history.push(`${userId} drew a ${card} card.`);
      
      refillFaceUpCards(newState);

      if (card === 'locomotive' || newState.turnState.state === 'drew_one_train') {
        nextTurn(newState);
      } else {
        newState.turnState.state = 'drew_one_train';
      }
      break;
    }

    case 'DRAW_DECK_TRAIN': {
      if (newState.turnState.state !== 'start_turn' && newState.turnState.state !== 'drew_one_train') {
        throw new Error('Cannot draw train card now');
      }
      
      // Reshuffle discard if deck is empty
      if (newState.trainDeck.length === 0) {
        newState.trainDeck = shuffle(newState.trainDiscard);
        newState.trainDiscard = [];
      }
      
      const card = newState.trainDeck.pop();
      if (!card) throw new Error('No cards left to draw');
      
      player.trainCards.push(card);
      newState.history.push(`${userId} drew a card from the deck.`);
      
      if (newState.turnState.state === 'drew_one_train') {
        nextTurn(newState);
      } else {
        newState.turnState.state = 'drew_one_train';
      }
      break;
    }

    case 'CLAIM_ROUTE': {
      if (newState.turnState.state !== 'start_turn') {
        throw new Error('Can only claim route at the start of your turn');
      }
      
      const route = newState.routes[action.routeId];
      if (!route) throw new Error('Invalid route');
      if (route.claimedBy) throw new Error('Route already claimed');
      if (player.trainCarsRemaining < route.length) throw new Error('Not enough train cars');
      
      // Validation for colors and counts
      if (action.cardsUsed.length !== route.length) {
        throw new Error('Incorrect number of cards supplied for route');
      }
      
      // (Simplified validation: In a full engine, we verify they actually have these cards and they match the route color)
      action.cardsUsed.forEach(c => {
        const idx = player.trainCards.indexOf(c);
        if (idx === -1) throw new Error('You do not have the required cards');
        player.trainCards.splice(idx, 1);
        newState.trainDiscard.push(c);
      });
      
      route.claimedBy = userId;
      player.trainCarsRemaining -= route.length;
      
      // Route Points scoring
      const routePoints: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 6: 15, 8: 21 };
      player.score += routePoints[route.length] || 0;
      
      newState.history.push(`${userId} claimed the route from ${route.city1} to ${route.city2}.`);
      nextTurn(newState);
      break;
    }

    case 'DRAW_DESTINATIONS': {
      if (newState.turnState.state !== 'start_turn') {
        throw new Error('Can only draw tickets at the start of your turn');
      }
      
      if (newState.destinationDeck.length === 0) {
        throw new Error('No destination tickets left');
      }

      // Draw 3 tickets to choose from
      const drawCount = Math.min(3, newState.destinationDeck.length);
      const drawnTickets = newState.destinationDeck.splice(0, drawCount);
      player.pendingDestinations = drawnTickets;

      newState.history.push(`${userId} drew ${drawCount} destination tickets to choose from.`);
      newState.turnState.state = 'choosing_destinations';
      break;
    }

    case 'KEEP_DESTINATIONS': {
      if (!player.pendingDestinations) {
        throw new Error('You have no pending destination tickets');
      }
      
      const isInitialDraft = newState.turnState.state === 'initial_draft';
      const isChoosing = newState.turnState.state === 'choosing_destinations';
      
      if (!isInitialDraft && !isChoosing) {
        throw new Error('Not currently choosing destinations');
      }
      
      // In initial draft, min 2. During game, min 1.
      const minKept = isInitialDraft ? 2 : 1;
      
      if (action.keptIds.length < minKept) {
        throw new Error(`Must keep at least ${minKept} ticket(s)`);
      }
      
      const kept = player.pendingDestinations.filter(t => action.keptIds.includes(t.id));
      const discarded = player.pendingDestinations.filter(t => !action.keptIds.includes(t.id));
      
      if (kept.length !== action.keptIds.length) {
        throw new Error('Invalid ticket IDs provided');
      }
      
      player.destinationTickets.push(...kept);
      // Discarded tickets go to bottom of deck (simulate by pushing)
      newState.destinationDeck.push(...discarded);
      
      player.pendingDestinations = undefined;
      
      if (isInitialDraft) {
        newState.setupFinishedBy.push(userId);
        newState.history.push(`${userId} kept ${kept.length} initial tickets.`);
        
        // If all players finished setup, move to start_turn for player 1
        if (newState.setupFinishedBy.length === newState.playerOrder.length) {
          newState.turnState.state = 'start_turn';
          newState.history.push('All players finished draft. Game begins!');
        }
      } else {
        newState.history.push(`${userId} kept ${kept.length} tickets.`);
        nextTurn(newState);
      }
      
      break;
    }

    default:
      throw new Error(`Unknown action type: ${(action as any).type}`);
  }

  return newState;
}
