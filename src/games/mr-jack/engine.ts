import {
  CharacterId,
  HexCoord,
  MrJackGameState,
  Role,
  AlibiCard,
  Manhole,
  Gaslight,
} from './types';
import {
  ALL_CHARACTERS,
  CHARACTERS,
  EXITS,
  INITIAL_ALIBI_DECK,
  INITIAL_CHARACTER_POSITIONS,
  INITIAL_GASLIGHTS,
  INITIAL_MANHOLES,
  ROUND_DRAFT_ORDERS,
} from './constants';
import {
  WHITECHAPEL_HEXES,
  BUILDING_HEXES,
  INITIAL_CHARACTER_HEXES,
  EXITS_CONFIG,
  HexNode,
} from './topology';

export function getHexNode(hexId: number): HexNode | undefined {
  return WHITECHAPEL_HEXES[hexId];
}

export function isBuilding(hexId: number): boolean {
  return BUILDING_HEXES.has(hexId);
}

export function isLitGaslight(hexId: number, gaslights: Gaslight[]): boolean {
  return gaslights.some((g) => g.hex === hexId && g.isLit);
}

// Check adjacent hexes (using the authentic 6-directional hexagonal topology: UP, DOWN, LU, LD, RU, RD)
export function getNeighbors(
  hexId: number,
  canCrossObstacles = false,
  gaslights: Gaslight[] = []
): number[] {
  const node = WHITECHAPEL_HEXES[hexId];
  if (!node) return [];

  const results: number[] = [];
  for (const nextId of node.connectedTo) {
    if (nextId === -1) continue;
    if (canCrossObstacles) {
      results.push(nextId);
    } else {
      if (!isBuilding(nextId) && !isLitGaslight(nextId, gaslights)) {
        results.push(nextId);
      }
    }
  }
  return results;
}

// Compute reachable hexes for a character with given max moves on the authentic 86-hex board
export function getReachableHexes(
  startHex: number,
  maxDist: number,
  canCrossObstacles: boolean,
  manholes: Manhole[] = [],
  occupiedHexes: number[] = [],
  gaslights: Gaslight[] = []
): number[] {
  const visited = new Map<number, number>();
  const queue: [number, number][] = [[startHex, 0]];
  visited.set(startHex, 0);

  const openManholeHexes = new Set(manholes.filter((m) => m.isOpen).map((m) => m.hex));
  const occupiedSet = new Set(occupiedHexes);

  while (queue.length > 0) {
    const [current, dist] = queue.shift()!;
    if (dist >= maxDist) continue;

    // Normal hex neighbours
    const neighbors = getNeighbors(current, canCrossObstacles, gaslights);
    for (const next of neighbors) {
      const nextDist = dist + 1;
      if (!visited.has(next) || visited.get(next)! > nextDist) {
        visited.set(next, nextDist);
        queue.push([next, nextDist]);
      }
    }

    // Sewer transit: if standing on an open manhole, can travel directly to any other open manhole for 1 movement point!
    if (openManholeHexes.has(current)) {
      for (const mHex of openManholeHexes) {
        if (mHex !== current) {
          const nextDist = dist + 1;
          if (!visited.has(mHex) || visited.get(mHex)! > nextDist) {
            visited.set(mHex, nextDist);
            queue.push([mHex, nextDist]);
          }
        }
      }
    }
  }

  // Filter out starting position, buildings, and occupied hexes (must end turn on a valid street hex)
  const reachable: number[] = [];
  for (const [hexId, dist] of visited.entries()) {
    if (dist > 0 && dist <= maxDist && hexId !== startHex) {
      if (!isBuilding(hexId) && !isLitGaslight(hexId, gaslights) && !occupiedSet.has(hexId)) {
        reachable.push(hexId);
      }
    }
  }

  return reachable;
}

// Watson's lantern beam calculation (straight line through connected hexes in direction 'facing')
// 0 = UP, 1 = DOWN, 2 = LU, 3 = LD, 4 = RU, 5 = RD
export function getWatsonBeam(watsonHex: number, facing: number, gaslights: Gaslight[] = []): number[] {
  const beamHexes: number[] = [];
  let curr = watsonHex;

  while (true) {
    const node = WHITECHAPEL_HEXES[curr];
    if (!node) break;
    const next = node.connectedTo[facing % 6];
    if (next === -1) break;
    if (isBuilding(next) || isLitGaslight(next, gaslights)) break; // building or lamp blocks beam
    beamHexes.push(next);
    curr = next;
  }

  return beamHexes;
}

// Determine if a character is visible:
// 1. Adjacent to another character
// 2. Adjacent to a lit gaslight
// 3. Lit by Watson's lantern beam
export function isCharacterVisible(
  charId: CharacterId,
  gameState: MrJackGameState
): boolean {
  const targetChar = gameState.characters[charId];
  if (!targetChar) return false;
  const targetHex = targetChar.hex;
  const targetNode = WHITECHAPEL_HEXES[targetHex];
  if (!targetNode) return false;

  // 1. Check adjacency to another character
  const connectedHexes = targetNode.connectedTo.filter((h) => h !== -1);
  for (const otherId of ALL_CHARACTERS) {
    if (otherId === charId) continue;
    const otherHex = gameState.characters[otherId]?.hex;
    if (connectedHexes.includes(otherHex)) {
      return true;
    }
  }

  // 2. Check adjacency to a lit gaslight
  for (const gas of gameState.gaslights) {
    if (gas.isLit && connectedHexes.includes(gas.hex)) {
      return true;
    }
  }

  // 3. Check Watson's lantern beam
  const watson = gameState.characters['watson'];
  if (watson && charId !== 'watson') {
    const facing = watson.watsonFacing ?? 4; // default North-East / RU
    const beam = getWatsonBeam(watson.hex, facing, gameState.gaslights);
    if (beam.includes(targetHex)) {
      return true;
    }
  }

  return false;
}

// Shuffle helper
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Initialize a brand new Mr. Jack match
export function createInitialMrJackGame(): MrJackGameState {
  const characters: Record<CharacterId, any> = {} as any;
  for (const id of ALL_CHARACTERS) {
    const initHex = INITIAL_CHARACTER_HEXES[id];
    characters[id] = {
      id,
      hex: initHex,
      coord: [WHITECHAPEL_HEXES[initHex].col, WHITECHAPEL_HEXES[initHex].row],
      isSuspect: true,
      isExonerated: false,
      watsonFacing: id === 'watson' ? 4 : undefined,
    };
  }

  // Secretly pick Jack identity from the 8 characters
  const secretJack = ALL_CHARACTERS[Math.floor(Math.random() * ALL_CHARACTERS.length)];

  // Shuffle 8 character cards for the draft pool
  const shuffledCards = shuffle([...ALL_CHARACTERS]);
  const round1Cards = shuffledCards.slice(0, 4);
  const remainingCards = shuffledCards.slice(4);

  // Alibi Deck: exclude Jack's card from the draw pile so Jack's alibi is never drawn by detective!
  const alibiDeckShuffled = shuffle(INITIAL_ALIBI_DECK.filter((c) => c.characterId !== secretJack));
  const jackCard = INITIAL_ALIBI_DECK.find((c) => c.characterId === secretJack) || {
    characterId: secretJack,
    hourglasses: 1,
  };

  return {
    round: 1,
    turnIndex: 0,
    activeRole: 'detective', // Round 1 starts with Detective
    jackIdentity: secretJack,
    jackHourglasses: jackCard.hourglasses,

    availableCardPile: remainingCards,
    roundCards: round1Cards.map((cid) => ({
      characterId: cid,
      isPlayed: false,
    })),
    activeCharacterId: null,
    hasMovedActiveCharacter: false,
    hasUsedActiveAbility: false,
    abilityState: { type: 'none', step: 'pending' },

    alibiDeck: alibiDeckShuffled,
    detectiveAlibis: [],
    jackAlibis: [jackCard],

    characters,
    gaslights: INITIAL_GASLIGHTS.map((g) => ({ ...g })),
    manholes: INITIAL_MANHOLES.map((m) => ({ ...m })),
    cordons: [
      { id: 1, exitIndex: 1 }, // blocks Northeast (hex 74)
      { id: 2, exitIndex: 2 }, // blocks Southwest (hex 11)
    ],

    witnessCallMade: false,
    isJackVisibleInWitnessCall: null,
    clearedInRound: [],

    isGameOver: false,
    winner: null,
    winReason: null,

    turnSubStep: 'select_character',
  };
}

// Perform the End-of-Round Witness Call
export function evaluateWitnessCall(gameState: MrJackGameState): MrJackGameState {
  const next = { ...gameState };
  const jackVisible = isCharacterVisible(next.jackIdentity, next);
  next.isJackVisibleInWitnessCall = jackVisible;
  next.witnessCallMade = true;

  const clearedThisRound: CharacterId[] = [];

  // Exonerate suspects:
  // If Jack is visible, all INVISIBLE characters are cleared!
  // If Jack is invisible, all VISIBLE characters are cleared! Also Jack gains 1 hourglass!
  for (const id of ALL_CHARACTERS) {
    const char = next.characters[id];
    if (char && char.isSuspect) {
      const visible = isCharacterVisible(id, next);
      if (jackVisible && !visible) {
        char.isSuspect = false;
        char.isExonerated = true;
        clearedThisRound.push(id);
      } else if (!jackVisible && visible) {
        char.isSuspect = false;
        char.isExonerated = true;
        clearedThisRound.push(id);
      }
    }
  }

  // If Jack was invisible during the witness call, Jack gains 1 Hourglass!
  if (!jackVisible) {
    next.jackHourglasses += 1;
  }

  next.clearedInRound = clearedThisRound;

  // Extinguish Gaslight according to round number (rounds 1 to 4)
  if (next.round >= 1 && next.round <= 4) {
    const targetGaslight = next.gaslights.find((g) => g.turnsOffRound === next.round);
    if (targetGaslight) {
      targetGaslight.isLit = false;
    }
  }

  // Win condition 1: Jack collected 6 hourglasses
  if (next.jackHourglasses >= 6) {
    next.isGameOver = true;
    next.winner = 'jack';
    next.winReason = `Mr. Jack accumulated ${next.jackHourglasses} Hourglasses and slipped away unnoticed into London's underground!`;
    return next;
  }

  // Win condition 2: Detective eliminated all innocent suspects (only Jack remains)
  const remainingSuspects = ALL_CHARACTERS.filter((id) => next.characters[id].isSuspect);
  if (remainingSuspects.length === 1 && remainingSuspects[0] === next.jackIdentity) {
    next.isGameOver = true;
    next.winner = 'detective';
    next.winReason = `The Detective deduced with absolute certainty that Mr. Jack is ${CHARACTERS[next.jackIdentity].name}!`;
    return next;
  }

  // Win condition 3: Round 8 completed without Jack getting caught
  if (next.round >= 8 && !next.isGameOver) {
    next.isGameOver = true;
    next.winner = 'jack';
    next.winReason = `Mr. Jack survived all 8 rounds in the dense London smog and vanished into history!`;
    return next;
  }

  return next;
}

// Check Jack escape through an open city exit
export function checkJackEscape(
  charId: CharacterId,
  targetHex: number,
  gameState: MrJackGameState
): boolean {
  if (charId !== gameState.jackIdentity) return false;

  // Check if targetHex is one of the 4 exits
  const exitConfig = EXITS_CONFIG.find((e) => e.hex === targetHex);
  if (!exitConfig) return false;

  // Check if exit is cordoned
  const isCordoned = gameState.cordons.some((c) => c.exitIndex === exitConfig.id);
  if (isCordoned) return false;

  // Jack can ONLY escape if Jack was NOT visible at the start of the round / currently invisible
  const visible = isCharacterVisible(charId, gameState);
  return !visible;
}

// Sherlock Holmes ability: draw top card of alibi deck
export function useSherlockHolmesAbility(gameState: MrJackGameState, role: Role): MrJackGameState {
  const next = { ...gameState };
  if (next.alibiDeck.length === 0) return next;

  const card = next.alibiDeck[0];
  next.alibiDeck = next.alibiDeck.slice(1);

  if (role === 'detective') {
    next.detectiveAlibis = [...next.detectiveAlibis, card];
    // Exonerate suspect for detective
    if (next.characters[card.characterId]) {
      next.characters[card.characterId].isSuspect = false;
      next.characters[card.characterId].isExonerated = true;
    }
  } else {
    next.jackAlibis = [...next.jackAlibis, card];
    next.jackHourglasses += card.hourglasses;
  }

  next.hasUsedActiveAbility = true;
  return next;
}

// Inspecteur Lestrade ability: move cordon from oldExitIndex to newExitIndex
export function useLestradeAbility(
  gameState: MrJackGameState,
  oldExitIndex: number,
  newExitIndex: number
): MrJackGameState {
  const next = { ...gameState };
  next.cordons = next.cordons.map((c) =>
    c.exitIndex === oldExitIndex ? { ...c, exitIndex: newExitIndex } : c
  );
  next.hasUsedActiveAbility = true;
  return next;
}

// Jeremy Bert ability: move manhole cover from oldHex to newHex
export function useBertAbility(
  gameState: MrJackGameState,
  oldHex: number,
  newHex: number
): MrJackGameState {
  const next = { ...gameState };
  next.manholes = next.manholes.map((m) => {
    if (m.hex === oldHex) return { ...m, isOpen: true }; // open previously covered
    if (m.hex === newHex) return { ...m, isOpen: false }; // cover target
    return m;
  });
  next.hasUsedActiveAbility = true;
  return next;
}

// John Smith ability: move lit gaslight from oldHex to newHex (unlit lamp post)
export function useSmithAbility(
  gameState: MrJackGameState,
  oldHex: number,
  newHex: number
): MrJackGameState {
  const next = { ...gameState };
  const sourceLamp = next.gaslights.find((g) => g.hex === oldHex && g.isLit);
  const targetLamp = next.gaslights.find((g) => g.hex === newHex);

  if (sourceLamp && targetLamp) {
    next.gaslights = next.gaslights.map((g) => {
      if (g.id === sourceLamp.id) {
        return {
          ...g,
          hex: newHex,
          coord: [WHITECHAPEL_HEXES[newHex].col, WHITECHAPEL_HEXES[newHex].row],
          isLit: true,
        };
      }
      if (g.id === targetLamp.id) {
        return {
          ...g,
          hex: oldHex,
          coord: [WHITECHAPEL_HEXES[oldHex].col, WHITECHAPEL_HEXES[oldHex].row],
          isLit: false,
        };
      }
      return g;
    });
  } else if (sourceLamp) {
    const nextGaslights = next.gaslights.map((g) => {
      if (g.id === sourceLamp.id) {
        return {
          ...g,
          hex: newHex,
          coord: [WHITECHAPEL_HEXES[newHex].col, WHITECHAPEL_HEXES[newHex].row] as HexCoord,
          isLit: true,
        };
      }
      return g;
    });
    nextGaslights.push({
      id: Math.max(...next.gaslights.map((g) => g.id), 6) + 1,
      hex: oldHex,
      coord: [WHITECHAPEL_HEXES[oldHex].col, WHITECHAPEL_HEXES[oldHex].row] as HexCoord,
      isLit: false,
      turnsOffRound: null,
    });
    next.gaslights = nextGaslights;
  }
  next.hasUsedActiveAbility = true;
  return next;
}

// Sir William Gull ability: swap position with another character
export function useGullAbility(
  gameState: MrJackGameState,
  otherCharId: CharacterId
): MrJackGameState {
  const next = { ...gameState };
  const gull = next.characters['gull'];
  const other = next.characters[otherCharId];
  if (!gull || !other) return next;

  const gullHex = gull.hex;
  const otherHex = other.hex;

  gull.hex = otherHex;
  gull.coord = [WHITECHAPEL_HEXES[otherHex].col, WHITECHAPEL_HEXES[otherHex].row];

  other.hex = gullHex;
  other.coord = [WHITECHAPEL_HEXES[gullHex].col, WHITECHAPEL_HEXES[gullHex].row];

  next.hasMovedActiveCharacter = true;
  next.hasUsedActiveAbility = true;
  return next;
}

// Helper to find the next hex that brings a character 1 step closer to targetHex
export function getStepCloserTo(
  startHex: number,
  targetHex: number,
  gaslights: Gaslight[],
  occupiedHexes: number[]
): number | null {
  if (startHex === targetHex) return null;
  const occupiedSet = new Set(occupiedHexes);

  // BFS backwards from targetHex to find distances to all reachable street hexes
  const queue: number[] = [targetHex];
  const dist = new Map<number, number>();
  dist.set(targetHex, 0);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currDist = dist.get(curr)!;
    const neighbors = getNeighbors(curr, false, gaslights);
    for (const nb of neighbors) {
      if (!dist.has(nb)) {
        dist.set(nb, currDist + 1);
        queue.push(nb);
      }
    }
  }

  // From startHex, inspect neighbors that are closer to targetHex
  const startNeighbors = getNeighbors(startHex, false, gaslights);
  let bestNeighbor: number | null = null;
  let bestDist = dist.get(startHex) ?? Infinity;

  for (const nb of startNeighbors) {
    if (occupiedSet.has(nb)) continue;
    const d = dist.get(nb);
    if (d !== undefined && d < bestDist) {
      bestDist = d;
      bestNeighbor = nb;
    }
  }

  return bestNeighbor;
}

// Sergeant Goodley ability: pull character closer to Goodley
export function useGoodleyAbility(
  gameState: MrJackGameState,
  targetCharId: CharacterId,
  destHex: number
): MrJackGameState {
  const next = { ...gameState };
  const target = next.characters[targetCharId];
  if (!target) return next;

  target.hex = destHex;
  target.coord = [WHITECHAPEL_HEXES[destHex].col, WHITECHAPEL_HEXES[destHex].row];
  return next;
}
