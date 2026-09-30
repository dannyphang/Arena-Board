export type ResourceType = 'wood' | 'clay' | 'stone' | 'glass' | 'papyrus';

export type BuildingColor = 'brown' | 'grey' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

export interface SWDBuilding {
  id: number;
  age: number; // 1, 2, 3 (or 4 for guilds)
  name: string;
  type: BuildingColor;
  cost: Partial<Record<ResourceType | 'coins', number>>;
  resources: Partial<Record<ResourceType, number>>;
  resourceChoice: ResourceType[];
  military: number;
  victoryPoints: number;
  coins: number;
  scientificSymbol: number | null; // 1 to 7
  fixedPriceResources: ResourceType[];
  coinsPerBuildingOfType?: { type: BuildingColor; coins: number } | null;
  coinsPerWonder?: number;
  guildRewardWonders?: boolean;
  guildRewardCoinTriplets?: boolean;
  guildRewardBuildingTypes?: BuildingColor[] | null;
  providesFreeFor?: number[];
  freeIfHas?: number;
}

export interface SWDWonder {
  id: number;
  name: string;
  cost: Partial<Record<ResourceType, number>>;
  victoryPoints: number;
  coins?: number;
  military?: number;
  extraTurn?: boolean;
  resourceChoice?: ResourceType[];
  discardBuildingTake?: boolean; // Mausoleum: take from discard pile
  progressTokenFromBox?: boolean; // Great Library: pick 1 of 3 tokens from box
  destroyOpponentBrown?: boolean; // Statue of Zeus: discard 1 brown card from opponent
  destroyOpponentGrey?: boolean; // Circus Maximus: discard 1 grey card from opponent
  opponentCoinLoss?: number; // Appian Way: opponent loses 3 coins
}

export interface SWDProgressToken {
  id: number;
  name: string;
  scientificSymbol?: number; // Law = 2
  victoryPoints?: number;
  coins?: number;
  description: string;
}

export interface DraftCard {
  id: number;
  row: number;
  col: number;
  faceUp: boolean;
  isTaken: boolean;
}

export interface PlayerWonder {
  id: number;
  isConstructed: boolean;
  tuckedCardId?: number;
}

export interface SWDPlayerState {
  userId: string;
  name: string;
  avatar: string;
  isBot?: boolean;
  coins: number;
  wonders: PlayerWonder[];
  buildings: number[]; // Card IDs
  progressTokens: number[]; // Token IDs
  scienceSymbols: number[]; // Array of symbol IDs (1..7)
}

export interface CostBreakdown {
  canAfford: boolean;
  isFreeThroughLink: boolean;
  requiredCoins: number;
  producedResources: Partial<Record<ResourceType, number>>;
  missingResources: Partial<Record<ResourceType, number>>;
  tradeCostPerResource: Partial<Record<ResourceType, number>>;
  totalTradeCost: number;
}

export interface SWDLastAction {
  type: 'draft_wonder' | 'construct_building' | 'discard_card' | 'construct_wonder' | 'pick_token' | 'destroy_card' | 'pick_discarded';
  playerId: string;
  playerName: string;
  cardId?: number;
  wonderId?: number;
  tokenId?: number;
  costPaid?: number;
  coinsGained?: number;
  description: string;
}

export type SWDPhase =
  | 'wonder_draft'
  | 'main_game'
  | 'choose_start_player'
  | 'choose_progress_token'
  | 'choose_discarded_card'
  | 'destroy_opponent_card'
  | 'game_over';

export interface SWDScoreDetails {
  civilian: number;
  science: number;
  military: number;
  wonders: number;
  tokens: number;
  guilds: number;
  treasury: number;
  total: number;
}

export interface SWDGameState {
  id: string;
  currentPhase: SWDPhase;
  currentAge: number; // 1, 2, 3
  activePlayerId: string;
  playerOrder: [string, string];
  players: Record<string, SWDPlayerState>;
  
  // Wonder Draft State
  wonderDraftRound: 1 | 2;
  wonderDraftPool: number[]; // 4 wonder IDs
  wonderDraftStep: number; // 0, 1, 2, 3 (steps in 1-2-1 draft)

  // Draftpool Structure for current Age
  draftPool: DraftCard[];

  // Military Track
  conflictPawnPosition: number; // -9 to +9. Positive = favors playerOrder[0], Negative = favors playerOrder[1]
  militaryTokens: { position: number; value: 2 | 5; isTaken: boolean }[];

  // Progress Tokens
  boardProgressTokens: number[]; // 5 on the board
  boxProgressTokens: number[]; // 5 left in the box
  availableSelectionTokens?: number[]; // tokens offered when a pair is made or Great Library built

  // Discard Pile
  discardPile: number[];

  // Special Pending Actions
  pendingActionPlayerId?: string;
  pendingWonderId?: number;
  destroyCardColor?: 'brown' | 'grey';

  // Turn Flow
  extraTurn: boolean;
  lastAction?: SWDLastAction;
  actionLog: string[];

  // Game End
  winner?: {
    userId: string;
    reason: 'military' | 'science' | 'civilian';
    scores?: {
      [userId: string]: SWDScoreDetails;
    };
  } | null;
}

export type SWDAction =
  | { type: 'draft_wonder'; wonderId: number }
  | { type: 'construct_building'; cardId: number }
  | { type: 'discard_card'; cardId: number }
  | { type: 'construct_wonder'; cardId: number; wonderId: number }
  | { type: 'choose_progress_token'; tokenId: number }
  | { type: 'choose_start_player'; nextPlayerId: string }
  | { type: 'choose_discarded_card'; cardId: number }
  | { type: 'destroy_opponent_card'; cardId: number };
