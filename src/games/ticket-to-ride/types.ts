export type TrainColor = 
  | 'purple'
  | 'blue'
  | 'orange'
  | 'white'
  | 'green'
  | 'yellow'
  | 'black'
  | 'red'
  | 'locomotive';

export interface Route {
  id: string;
  city1: string;
  city2: string;
  length: number;
  color: TrainColor | 'any';
  locomotivesRequired?: number; // for ferries
  isTunnel?: boolean; // for tunnels in Europe
  claimedBy?: string; // userId of the player who claimed it
}

export interface DestinationTicket {
  id: string;
  city1: string;
  city2: string;
  points: number;
}

export interface PlayerState {
  userId: string;
  color: string;
  trainCarsRemaining: number;
  trainCards: TrainColor[];
  destinationTickets: DestinationTicket[];
  pendingDestinations?: DestinationTicket[]; // Tickets being evaluated during a draft
  stationsRemaining: number;
  score: number;
  longestRouteLength: number;
}

export interface TTRGameState {
  players: Record<string, PlayerState>;
  playerOrder: string[];
  currentPlayerIndex: number;
  
  routes: Record<string, Route>;
  
  trainDeck: TrainColor[];
  trainDiscard: TrainColor[];
  faceUpTrainCards: TrainColor[];
  
  destinationDeck: DestinationTicket[];
  
  turnState: {
    state: 'initial_draft' | 'start_turn' | 'drew_one_train' | 'choosing_destinations' | 'building_tunnel';
    pendingTunnelCards?: { color: TrainColor, count: number };
  };
  
  setupFinishedBy: string[];
  
  history: string[];
  winner?: string;
}

export type TTRAction = 
  | { type: 'DRAW_FACE_UP_TRAIN'; cardIndex: number }
  | { type: 'DRAW_DECK_TRAIN' }
  | { type: 'CLAIM_ROUTE'; routeId: string; cardsUsed: TrainColor[] }
  | { type: 'DRAW_DESTINATIONS' }
  | { type: 'KEEP_DESTINATIONS'; keptIds: string[] }
  | { type: 'BUILD_STATION'; city: string; cardsUsed: TrainColor[] };
