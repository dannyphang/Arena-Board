export type GameType = 'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride' | 'seven-wonders-duel' | 'genius-star' | 'quoridor' | 'pentago';

export type TimeControl = 'casual' | 'blitz-1m' | 'rapid-3m' | 'standard-5m';

export type TableStatus = 'waiting' | 'in-game' | 'finished';

import { CoordString, PlacedPiece } from '../games/genius-square/types';
import { MrJackGameState, Role } from '../games/mr-jack/types';
import { CatanGameState } from '../games/catan/types';
import { TTRGameState } from '../games/ticket-to-ride/types';
import { SWDGameState } from '../games/seven-wonders-duel/types';

export interface PlayerSlot {
  userId: string;
  socketId: string;
  username: string;
  avatar: string;
  rating: number;
  isReady: boolean;
  isHost: boolean;
  isBot?: boolean;
  role?: Role; // for Mr. Jack: 'detective' or 'jack'
  boardProgress?: {
    filledCells: number; // 0..29
    totalPieces: number; // 0..9
    isComplete: boolean;
    timeElapsed: number;
    placedPieces: PlacedPiece[];
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface TableRoom {
  id: string;
  name: string;
  gameId: GameType;
  hostId: string;
  hostName: string;
  status: TableStatus;
  isPrivate: boolean;
  roomCode?: string;
  timeControl: TimeControl;
  botDifficulty?: 'beginner' | 'intermediate' | 'expert' | 'genius';
  players: PlayerSlot[];
  maxPlayers?: number;
  spectators: { id: string; username: string }[];
  blockers: CoordString[]; // for Genius Square
  targetVictoryPoints?: number; // for Catan
  mrJackState?: MrJackGameState; // for Mr. Jack
  catanState?: CatanGameState; // for Catan
  ttrState?: TTRGameState; // for Ticket to Ride
  sevenWondersState?: SWDGameState; // for 7 Wonders Duel
  gameStartTime?: number;
  winner?: {
    id: string;
    name: string;
    avatar: string;
    timeSeconds: number;
    role?: string;
  } | null;
  messages: ChatMessage[];
  createdAt: number;
}
