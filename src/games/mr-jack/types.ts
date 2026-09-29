export type Role = 'detective' | 'jack';

export type CharacterId =
  | 'sherlock'
  | 'watson'
  | 'smith'
  | 'lestrade'
  | 'bert'
  | 'goodley'
  | 'stealthy'
  | 'gull';

export interface CharacterDef {
  id: CharacterId;
  numericId: number; // 1 to 8 (matching Aghajari repo)
  name: string;
  avatar: string;
  color: string;
  accentColor: string;
  maxMovement: number;
  abilityDescription: string;
  cardImage: string;
  cardSelectedImage: string;
  cardUsedImage: string;
  suspectTokenImage: string;
  innocentTokenImage: string;
  alibiImage: string;
}

export type HexCoord = [number, number]; // [col, row]

export interface CharacterState {
  id: CharacterId;
  hex: number; // 0 to 85 matching WHITECHAPEL_HEXES
  coord: HexCoord;
  isSuspect: boolean; // un-cleared
  isExonerated: boolean; // cleared by detective
  watsonFacing?: 0 | 1 | 2 | 3 | 4 | 5; // 0 = UP, 1 = DOWN, 2 = LU, 3 = LD, 4 = RU, 5 = RD
}

export interface Gaslight {
  id: number;
  hex: number; // 0 to 85
  coord: HexCoord;
  isLit: boolean;
  turnsOffRound?: number | null; // 1, 2, 3, 4, or null
}

export interface Manhole {
  id: number;
  hex: number; // 0 to 85
  coord: HexCoord;
  isOpen: boolean; // true = open sewer, false = covered by manhole tile
}

export interface PoliceCordon {
  id: number;
  exitIndex: number; // 0 (NW hex 5), 1 (NE hex 74), 2 (SW hex 11), 3 (SE hex 80)
}

export interface AlibiCard {
  characterId: CharacterId;
  hourglasses: number; // 0, 1, or 2
}

export interface AbilityState {
  type: 'none' | 'lestrade_cordon' | 'smith_gaslight' | 'bert_manhole' | 'goodley_whistle' | 'gull_swap' | 'watson_direction';
  step: 'pending' | 'selecting_target' | 'completed';
  selectedSource?: number;
  pointsRemaining?: number; // for Goodley
}

export interface MrJackGameState {
  round: number; // 1 to 8
  turnIndex: number; // 0 to 3 within the 4 chosen cards
  activeRole: Role; // whose turn it is to pick/play
  jackIdentity: CharacterId;
  jackHourglasses: number;
  
  // Card draft state
  availableCardPile: CharacterId[]; // 8 cards total shuffled in 2 pools of 4
  roundCards: {
    characterId: CharacterId;
    isPlayed: boolean;
    playedBy?: Role;
  }[];
  activeCharacterId: CharacterId | null; // character currently being moved/activated
  hasMovedActiveCharacter: boolean;
  hasUsedActiveAbility: boolean;
  abilityState: AbilityState;
  
  // Alibi card deck
  alibiDeck: AlibiCard[];
  detectiveAlibis: AlibiCard[];
  jackAlibis: AlibiCard[];

  // Board state
  characters: Record<CharacterId, CharacterState>;
  gaslights: Gaslight[];
  manholes: Manhole[];
  cordons: PoliceCordon[]; // 2 blocked exits
  
  // Visibility & Witness status
  witnessCallMade: boolean;
  isJackVisibleInWitnessCall: boolean | null;
  clearedInRound: CharacterId[];

  // Game End
  isGameOver: boolean;
  winner: Role | null;
  winReason: string | null;

  // Action step within turn
  turnSubStep: 'select_character' | 'move_character' | 'use_ability' | 'watson_direction' | 'done';
}
