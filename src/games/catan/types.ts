export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';

export type HexTerrain = ResourceType | 'desert';

export type PortType = ResourceType | 'threeToOne';

export type DevCardType =
  | 'knight'
  | 'roadBuilding'
  | 'yearOfPlenty'
  | 'monopoly'
  | 'victoryPoint';

export type PlayerColor = 'red' | 'blue' | 'orange' | 'white';

export interface ResourceCount {
  wood: number;
  brick: number;
  sheep: number;
  wheat: number;
  ore: number;
}

export interface CatanHex {
  id: number;
  terrain: HexTerrain;
  number: number | null; // 2..12, null for desert
  x: number; // visual center x
  y: number; // visual center y
  hasRobber: boolean;
}

export interface CatanPort {
  id: number;
  type: PortType;
  v1: number;
  v2: number;
  x: number; // visual center of port icon in water
  y: number;
}

export interface CatanVertex {
  id: number;
  x: number; // visual pos
  y: number;
  hexIds: number[]; // adjacent hexes
  edgeIds: number[]; // connected edges
  adjacentVertexIds: number[];
  port?: PortType;
  owner?: string; // player id
  type?: 'settlement' | 'city';
}

export interface CatanEdge {
  id: number;
  v1: number;
  v2: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  owner?: string; // player id
}

export interface CatanPlayer {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isBot: boolean;
  resources: ResourceCount;
  devCards: DevCardType[];
  playedKnights: number;
  victoryPoints: number;
  roadsLeft: number; // max 15
  settlementsLeft: number; // max 5
  citiesLeft: number; // max 4
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
}

export type CatanTurnPhase =
  | 'setup-settlement-1'
  | 'setup-road-1'
  | 'setup-settlement-2'
  | 'setup-road-2'
  | 'roll'
  | 'robber-discard'
  | 'robber-move'
  | 'robber-steal'
  | 'main'
  | 'game-over';

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId?: string; // undefined or 'all' for open offer, or target playerId
  give: Partial<ResourceCount>;
  want: Partial<ResourceCount>;
  createdAt: number;
}

export interface CatanLogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'roll' | 'build' | 'trade' | 'robber' | 'devCard' | 'victory' | 'info';
}

export interface CatanGameState {
  hexes: CatanHex[];
  vertices: CatanVertex[];
  edges: CatanEdge[];
  ports?: CatanPort[];
  players: CatanPlayer[];
  currentTurnIndex: number;
  turnPhase: CatanTurnPhase;
  diceRoll: [number, number] | null;
  robberHexId: number;
  devCardDeck: DevCardType[];
  longestRoadPlayerId: string | null;
  longestRoadLength: number;
  largestArmyPlayerId: string | null;
  largestArmyCount: number;
  targetVictoryPoints?: number; // Configurable: defaults to 10
  tradeOffer: TradeOffer | null;
  logs: CatanLogEntry[];
  winnerId: string | null;
  lastBuiltVertexId?: number; // for setup phase road connection
  pendingDiscards?: { playerId: string; count: number }[];
  lastStartingHarvest?: {
    playerId: string;
    hexIds: number[];
    resources: ResourceType[];
    timestamp: number;
  };
  freeRoadsRemaining?: number;
}
