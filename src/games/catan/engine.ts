import {
  BUILDING_COSTS,
  INITIAL_DEV_CARD_DECK,
} from './constants';
import {
  CatanEdge,
  CatanGameState,
  CatanHex,
  CatanPlayer,
  CatanPort,
  CatanVertex,
  DevCardType,
  HexTerrain,
  PlayerColor,
  PortType,
  ResourceCount,
  ResourceType,
  TradeOffer,
} from './types';

// Standard 19 terrains
const STANDARD_TERRAINS: HexTerrain[] = [
  'wood', 'wood', 'wood', 'wood',
  'brick', 'brick', 'brick',
  'sheep', 'sheep', 'sheep', 'sheep',
  'wheat', 'wheat', 'wheat', 'wheat',
  'ore', 'ore', 'ore',
  'desert',
];

// Standard 18 number tokens
const STANDARD_NUMBERS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

// Fixed 9 ports configuration for standard board evenly spaced around perimeter edges
export const STANDARD_PORTS: CatanPort[] = [
  { id: 0, type: 'threeToOne', v1: 0, v2: 1, x: 265, y: 45 },
  { id: 1, type: 'wheat', v1: 10, v2: 11, x: 465, y: 45 },
  { id: 2, type: 'ore', v1: 12, v2: 22, x: 535, y: 135 },
  { id: 3, type: 'threeToOne', v1: 36, v2: 37, x: 580, y: 345 },
  { id: 4, type: 'sheep', v1: 45, v2: 46, x: 535, y: 430 },
  { id: 5, type: 'threeToOne', v1: 50, v2: 53, x: 415, y: 520 },
  { id: 6, type: 'brick', v1: 48, v2: 49, x: 215, y: 520 },
  { id: 7, type: 'wood', v1: 26, v2: 40, x: 115, y: 360 },
  { id: 8, type: 'threeToOne', v1: 4, v2: 17, x: 145, y: 135 },
];

/**
 * Generates the standard Catan board with 19 hexes, 54 vertices, and 72 edges.
 */
export function generateCatanBoard(): {
  hexes: CatanHex[];
  vertices: CatanVertex[];
  edges: CatanEdge[];
  ports: CatanPort[];
  robberHexId: number;
} {
  const R = 54; // Hex outer radius
  const W = Math.sqrt(3) * R; // ~93.53
  const centerX = 340;
  const centerY = 280;

  // Row definitions for 19 hexes (3, 4, 5, 4, 3)
  const rows = [
    { count: 3, y: centerY - 1.5 * R * 2, startX: centerX - W },
    { count: 4, y: centerY - 1.5 * R, startX: centerX - 1.5 * W },
    { count: 5, y: centerY, startX: centerX - 2 * W },
    { count: 4, y: centerY + 1.5 * R, startX: centerX - 1.5 * W },
    { count: 3, y: centerY + 1.5 * R * 2, startX: centerX - W },
  ];

  // Shuffle terrains and numbers for replayability
  const shuffledTerrains = [...STANDARD_TERRAINS].sort(() => Math.random() - 0.5);
  const shuffledNumbers = [...STANDARD_NUMBERS].sort(() => Math.random() - 0.5);

  let numIdx = 0;
  let hexId = 0;
  let robberHexId = 0;
  const hexes: CatanHex[] = [];

  rows.forEach((row) => {
    for (let c = 0; c < row.count; c++) {
      const terrain = shuffledTerrains[hexId];
      const isDesert = terrain === 'desert';
      if (isDesert) {
        robberHexId = hexId;
      }
      const num = isDesert ? null : shuffledNumbers[numIdx++];

      hexes.push({
        id: hexId,
        terrain,
        number: num,
        x: row.startX + c * W,
        y: row.y,
        hasRobber: isDesert,
      });
      hexId++;
    }
  });

  // Calculate 6 corners for each hex
  // Corner angles for pointy-topped hex: -90, -30, 30, 90, 150, 210 deg
  const cornersDeg = [-90, -30, 30, 90, 150, 210];
  const rawVertices: { x: number; y: number; hexId: number }[] = [];

  hexes.forEach((hex) => {
    cornersDeg.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const vx = Math.round(hex.x + R * Math.cos(rad));
      const vy = Math.round(hex.y + R * Math.sin(rad));
      rawVertices.push({ x: vx, y: vy, hexId: hex.id });
    });
  });

  // Deduplicate vertices within 12px
  const vertices: CatanVertex[] = [];
  rawVertices.forEach((rv) => {
    const existing = vertices.find(
      (v) => Math.hypot(v.x - rv.x, v.y - rv.y) < 12
    );
    if (existing) {
      if (!existing.hexIds.includes(rv.hexId)) {
        existing.hexIds.push(rv.hexId);
      }
    } else {
      vertices.push({
        id: vertices.length,
        x: rv.x,
        y: rv.y,
        hexIds: [rv.hexId],
        edgeIds: [],
        adjacentVertexIds: [],
      });
    }
  });

  // Generate edges between pairs of vertices connected along hex borders (dist ~= R, +/- 8px)
  const edges: CatanEdge[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dist = Math.hypot(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y);
      if (Math.abs(dist - R) < 8) {
        // Also ensure they share at least one hex
        const sharesHex = vertices[i].hexIds.some((h) => vertices[j].hexIds.includes(h));
        if (sharesHex) {
          const edgeId = edges.length;
          edges.push({
            id: edgeId,
            v1: i,
            v2: j,
            x1: vertices[i].x,
            y1: vertices[i].y,
            x2: vertices[j].x,
            y2: vertices[j].y,
          });
          vertices[i].edgeIds.push(edgeId);
          vertices[j].edgeIds.push(edgeId);
          vertices[i].adjacentVertexIds.push(j);
          vertices[j].adjacentVertexIds.push(i);
        }
      }
    }
  }

  // Assign ports to outer edge vertices
  STANDARD_PORTS.forEach((p) => {
    if (vertices[p.v1]) vertices[p.v1].port = p.type;
    if (vertices[p.v2]) vertices[p.v2].port = p.type;
  });

  return { hexes, vertices, edges, ports: STANDARD_PORTS, robberHexId };
}

/**
 * Creates initial Catan game state for given players
 */
export function createInitialCatanGame(
  playerConfigs: { id: string; name: string; avatar: string; isBot: boolean }[],
  targetVictoryPoints: number = 10
): CatanGameState {
  const { hexes, vertices, edges, ports, robberHexId } = generateCatanBoard();
  const colors: PlayerColor[] = ['red', 'blue', 'orange', 'white'];

  const players: CatanPlayer[] = playerConfigs.map((cfg, idx) => ({
    id: cfg.id,
    name: cfg.name,
    avatar: cfg.avatar,
    color: colors[idx % colors.length],
    isBot: cfg.isBot,
    resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    devCards: [],
    playedKnights: 0,
    victoryPoints: 0,
    roadsLeft: 15,
    settlementsLeft: 5,
    citiesLeft: 4,
    hasLongestRoad: false,
    hasLargestArmy: false,
  }));

  const deck = [...INITIAL_DEV_CARD_DECK].sort(() => Math.random() - 0.5);
  const targetVP = targetVictoryPoints || 10;

  return {
    hexes,
    vertices,
    edges,
    ports,
    players,
    currentTurnIndex: 0,
    turnPhase: 'setup-settlement-1',
    diceRoll: null,
    robberHexId,
    devCardDeck: deck,
    longestRoadPlayerId: null,
    longestRoadLength: 0,
    largestArmyPlayerId: null,
    largestArmyCount: 0,
    targetVictoryPoints: targetVP,
    tradeOffer: null,
    logs: [
      {
        id: 'log_start',
        text: `The island of Catan has been discovered! Race to ${targetVP} Victory Points.`,
        timestamp: Date.now(),
        type: 'info',
      },
    ],
    winnerId: null,
  };
}

/**
 * Check if a settlement can be legally placed on a vertex:
 * 1. Distance rule: no adjacent vertex can contain any building.
 * 2. In normal play: must be connected to player's road.
 */
export function canPlaceSettlement(
  state: CatanGameState,
  vertexId: number,
  playerId: string
): boolean {
  const vertex = state.vertices[vertexId];
  if (!vertex || vertex.owner) return false;

  // Distance rule
  for (const adjId of vertex.adjacentVertexIds) {
    if (state.vertices[adjId]?.owner) {
      return false;
    }
  }

  // During setup phases, road connection is not required
  if (
    state.turnPhase === 'setup-settlement-1' ||
    state.turnPhase === 'setup-settlement-2'
  ) {
    return true;
  }

  // During main phase, must connect to at least one owned road
  const hasConnectedRoad = vertex.edgeIds.some(
    (eId) => state.edges[eId]?.owner === playerId
  );
  if (!hasConnectedRoad) return false;

  // Must have resources and settlements left
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.settlementsLeft <= 0) return false;

  const cost = BUILDING_COSTS.settlement;
  return (
    player.resources.wood >= cost.wood &&
    player.resources.brick >= cost.brick &&
    player.resources.sheep >= cost.sheep &&
    player.resources.wheat >= cost.wheat
  );
}

/**
 * Check if a city can be upgraded on a vertex (replaces own settlement).
 */
export function canPlaceCity(
  state: CatanGameState,
  vertexId: number,
  playerId: string
): boolean {
  const vertex = state.vertices[vertexId];
  if (!vertex || vertex.owner !== playerId || vertex.type !== 'settlement') return false;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.citiesLeft <= 0) return false;

  const cost = BUILDING_COSTS.city;
  return player.resources.wheat >= cost.wheat && player.resources.ore >= cost.ore;
}

/**
 * Check if a road can be placed on an edge:
 * 1. Edge must be vacant.
 * 2. Setup 1 & 2: must connect to the settlement just placed!
 * 3. Normal play: must connect to an owned road or settlement/city.
 */
export function canPlaceRoad(
  state: CatanGameState,
  edgeId: number,
  playerId: string
): boolean {
  const edge = state.edges[edgeId];
  if (!edge || edge.owner) return false;

  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.roadsLeft <= 0) return false;

  // During setup phases:
  if (
    state.turnPhase === 'setup-road-1' ||
    state.turnPhase === 'setup-road-2'
  ) {
    if (state.lastBuiltVertexId !== undefined) {
      return edge.v1 === state.lastBuiltVertexId || edge.v2 === state.lastBuiltVertexId;
    }
  }

  // During main game, check resource cost
  if (state.turnPhase === 'main') {
    if (!state.freeRoadsRemaining || state.freeRoadsRemaining <= 0) {
      const cost = BUILDING_COSTS.road;
      if (player.resources.wood < cost.wood || player.resources.brick < cost.brick) {
        return false;
      }
    }
  }

  // Must connect to an existing road or owned settlement/city
  const v1 = state.vertices[edge.v1];
  const v2 = state.vertices[edge.v2];

  const connectedAtV1 =
    v1.owner === playerId ||
    v1.edgeIds.some((e) => e !== edgeId && state.edges[e]?.owner === playerId);

  const connectedAtV2 =
    v2.owner === playerId ||
    v2.edgeIds.some((e) => e !== edgeId && state.edges[e]?.owner === playerId);

  return connectedAtV1 || connectedAtV2;
}

/**
 * Calculates the length of the longest continuous road for a player.
 * Rules of Catan:
 * - Simple path of owned edges (no edge can be traversed twice).
 * - Opponent settlements/cities on vertices break the connection through that vertex.
 * - Minimum 5 road segments required to hold the Longest Road card.
 */
export function calculatePlayerLongestRoad(state: CatanGameState, playerId: string): number {
  const playerEdges = state.edges.filter((e) => e.owner === playerId);
  if (playerEdges.length === 0) return 0;

  // Build adjacency list of player's edges: vertexId -> list of { edgeId, otherVertex }
  const adj = new Map<number, { edgeId: number; otherVertex: number }[]>();

  playerEdges.forEach((edge) => {
    if (!adj.has(edge.v1)) adj.set(edge.v1, []);
    if (!adj.has(edge.v2)) adj.set(edge.v2, []);

    adj.get(edge.v1)!.push({ edgeId: edge.id, otherVertex: edge.v2 });
    adj.get(edge.v2)!.push({ edgeId: edge.id, otherVertex: edge.v1 });
  });

  // DFS from vertex with a set of used edge IDs
  const dfs = (currentVertex: number, usedEdges: Set<number>): number => {
    // If an opponent owns this vertex, the road cannot continue through it
    const vertexOwner = state.vertices[currentVertex]?.owner;
    if (vertexOwner && vertexOwner !== playerId) {
      return 0;
    }

    let localMax = 0;
    const neighbors = adj.get(currentVertex) || [];

    for (const { edgeId, otherVertex } of neighbors) {
      if (!usedEdges.has(edgeId)) {
        usedEdges.add(edgeId);
        const subLen = 1 + dfs(otherVertex, usedEdges);
        if (subLen > localMax) localMax = subLen;
        usedEdges.delete(edgeId); // Backtrack
      }
    }

    return localMax;
  };

  let maxLen = 0;
  for (const startVertex of adj.keys()) {
    const len = dfs(startVertex, new Set<number>());
    if (len > maxLen) maxLen = len;
  }

  return maxLen;
}

/**
 * Updates Longest Road, Largest Army, and player Victory Points
 */
export function updateSpecialAwards(state: CatanGameState): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p) => ({
    ...p,
    resources: { ...p.resources },
    devCards: [...p.devCards],
  }));

  // 1. Evaluate Longest Road for each player
  let maxRoadLen = 0;
  let bestRoadPlayerId: string | null = null;

  next.players.forEach((p) => {
    const len = calculatePlayerLongestRoad(next, p.id);
    if (len > maxRoadLen) {
      maxRoadLen = len;
      bestRoadPlayerId = p.id;
    }
  });

  const currentRoadHolderId = next.longestRoadPlayerId;
  const currentRoadHolderLen = currentRoadHolderId
    ? calculatePlayerLongestRoad(next, currentRoadHolderId)
    : 0;

  if (currentRoadHolderId) {
    if (currentRoadHolderLen < 5) {
      // Current holder's road fell below 5
      if (maxRoadLen >= 5 && bestRoadPlayerId) {
        next.longestRoadPlayerId = bestRoadPlayerId;
        next.longestRoadLength = maxRoadLen;
        const newHolder = next.players.find((p) => p.id === bestRoadPlayerId);
        next.logs.unshift({
          id: 'log_lr_' + Date.now(),
          text: `️ ${newHolder?.name} claimed Longest Road (${maxRoadLen} roads) for +2 Victory Points!`,
          timestamp: Date.now(),
          type: 'info',
        });
      } else {
        next.longestRoadPlayerId = null;
        next.longestRoadLength = 0;
      }
    } else {
      // Must be strictly greater than current holder to take it away
      if (maxRoadLen > currentRoadHolderLen && bestRoadPlayerId && bestRoadPlayerId !== currentRoadHolderId) {
        next.longestRoadPlayerId = bestRoadPlayerId;
        next.longestRoadLength = maxRoadLen;
        const newHolder = next.players.find((p) => p.id === bestRoadPlayerId);
        const prevHolder = next.players.find((p) => p.id === currentRoadHolderId);
        next.logs.unshift({
          id: 'log_lr_' + Date.now(),
          text: `️ ${newHolder?.name} took Longest Road (${maxRoadLen} roads) from ${prevHolder?.name} for +2 Victory Points!`,
          timestamp: Date.now(),
          type: 'info',
        });
      } else {
        next.longestRoadLength = currentRoadHolderLen;
      }
    }
  } else {
    // No one holds it yet: first to reach >= 5 takes it
    if (maxRoadLen >= 5 && bestRoadPlayerId) {
      next.longestRoadPlayerId = bestRoadPlayerId;
      next.longestRoadLength = maxRoadLen;
      const newHolder = next.players.find((p) => p.id === bestRoadPlayerId);
      next.logs.unshift({
        id: 'log_lr_' + Date.now(),
        text: `️ ${newHolder?.name} claimed the Longest Road (${maxRoadLen} roads) for +2 Victory Points!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
  }

  // 2. Evaluate Largest Army
  let maxKnights = 0;
  let bestArmyPlayerId: string | null = null;
  next.players.forEach((p) => {
    if (p.playedKnights > maxKnights) {
      maxKnights = p.playedKnights;
      bestArmyPlayerId = p.id;
    }
  });

  const currentArmyHolderId = next.largestArmyPlayerId;
  const currentArmyHolderCount = currentArmyHolderId
    ? next.players.find((p) => p.id === currentArmyHolderId)?.playedKnights || 0
    : 0;

  if (currentArmyHolderId) {
    if (maxKnights > currentArmyHolderCount && bestArmyPlayerId && bestArmyPlayerId !== currentArmyHolderId) {
      next.largestArmyPlayerId = bestArmyPlayerId;
      next.largestArmyCount = maxKnights;
      const newHolder = next.players.find((p) => p.id === bestArmyPlayerId);
      const prevHolder = next.players.find((p) => p.id === currentArmyHolderId);
      next.logs.unshift({
        id: 'log_la_' + Date.now(),
        text: `️ ${newHolder?.name} took Largest Army (${maxKnights} Knights) from ${prevHolder?.name} for +2 Victory Points!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
  } else {
    if (maxKnights >= 3 && bestArmyPlayerId) {
      next.largestArmyPlayerId = bestArmyPlayerId;
      next.largestArmyCount = maxKnights;
      const newHolder = next.players.find((p) => p.id === bestArmyPlayerId);
      next.logs.unshift({
        id: 'log_la_' + Date.now(),
        text: `️ ${newHolder?.name} claimed the Largest Army (${maxKnights} Knights) for +2 Victory Points!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
  }

  // Update hasLongestRoad, hasLargestArmy, and recalculate victoryPoints
  const targetVP = next.targetVictoryPoints || 10;
  next.players.forEach((p) => {
    p.hasLongestRoad = p.id === next.longestRoadPlayerId;
    p.hasLargestArmy = p.id === next.largestArmyPlayerId;
    p.victoryPoints = calculateVictoryPoints(next, p.id);
    if (p.victoryPoints >= targetVP && !next.winnerId) {
      next.winnerId = p.id;
      next.turnPhase = 'game-over';
    }
  });

  return next;
}

/**
 * Calculates Victory Points for a player
 */
export function calculateVictoryPoints(state: CatanGameState, playerId: string): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  let vp = 0;

  // Settlements = 1, Cities = 2
  state.vertices.forEach((v) => {
    if (v.owner === playerId) {
      vp += v.type === 'city' ? 2 : 1;
    }
  });

  // Longest Road = 2
  if (state.longestRoadPlayerId === playerId) {
    vp += 2;
  }

  // Largest Army = 2
  if (state.largestArmyPlayerId === playerId) {
    vp += 2;
  }

  // Victory point dev cards
  const vpCards = player.devCards.filter((c) => c === 'victoryPoint').length;
  vp += vpCards;

  return vp;
}

/**
 * Distribute resources when dice are rolled (non-7)
 */
export function distributeResources(state: CatanGameState, roll: number): CatanGameState {
  const next = { ...state };
  const hexesProducing = next.hexes.filter(
    (h) => h.number === roll && !h.hasRobber && h.terrain !== 'desert'
  );

  hexesProducing.forEach((hex) => {
    const resource = hex.terrain as ResourceType;
    next.vertices.forEach((v) => {
      if (v.owner && v.hexIds.includes(hex.id)) {
        const player = next.players.find((p) => p.id === v.owner);
        if (player) {
          const amount = v.type === 'city' ? 2 : 1;
          player.resources[resource] += amount;
          next.logs.unshift({
            id: 'log_' + Date.now() + Math.random(),
            text: `${player.name} received ${amount} ${resource} from tile #${hex.number}.`,
            timestamp: Date.now(),
            type: 'roll',
          });
        }
      }
    });
  });

  return next;
}

/**
 * Handle dice roll (2d6)
 */
export function rollDice(state: CatanGameState): CatanGameState {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2;
  const activePlayer = state.players[state.currentTurnIndex];

  let next: CatanGameState = {
    ...state,
    diceRoll: [d1, d2],
  };

  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `${activePlayer.name} rolled ${total} (${d1} + ${d2}).`,
    timestamp: Date.now(),
    type: 'roll',
  });

  if (total === 7) {
    // Standard Catan Rule: All players holding more than 7 cards must discard half (rounded down)
    const discardsRequired: { playerId: string; count: number }[] = [];
    next.players = next.players.map((p) => {
      const totalCards = (Object.values(p.resources) as number[]).reduce((sum, c) => sum + c, 0);
      if (totalCards > 7) {
        const mustDiscard = Math.floor(totalCards / 2);
        if (p.isBot) {
          // Bot auto-discards mustDiscard cards (starting with their highest resource counts)
          const updatedResources = { ...p.resources };
          let remainingToDiscard = mustDiscard;
          while (remainingToDiscard > 0) {
            const sortedKeys = (Object.keys(updatedResources) as ResourceType[])
              .filter((k) => updatedResources[k] > 0)
              .sort((a, b) => updatedResources[b] - updatedResources[a]);
            if (sortedKeys.length === 0) break;
            const topKey = sortedKeys[0];
            const take = Math.min(remainingToDiscard, updatedResources[topKey]);
            updatedResources[topKey] -= take;
            remainingToDiscard -= take;
          }
          next.logs.unshift({
            id: 'log_bot_discard_' + Date.now() + Math.random(),
            text: `️ Rolled 7! ${p.name} had ${totalCards} cards (> 7) and discarded ${mustDiscard} cards.`,
            timestamp: Date.now(),
            type: 'robber',
          });
          return { ...p, resources: updatedResources };
        } else {
          discardsRequired.push({ playerId: p.id, count: mustDiscard });
          return p;
        }
      }
      return p;
    });

    if (discardsRequired.length > 0) {
      next.pendingDiscards = discardsRequired;
      next.turnPhase = 'robber-discard';
      next.logs.unshift({
        id: 'log_7_discard_' + Date.now(),
        text: `️ Rolled a 7! Hand limit exceeded. Players with more than 7 cards must discard half.`,
        timestamp: Date.now(),
        type: 'robber',
      });
    } else {
      next.turnPhase = 'robber-move';
      next.logs.unshift({
        id: 'log_7_robber_' + Date.now(),
        text: `️ Rolled a 7! The Robber is activated. ${activePlayer.name} must move the robber.`,
        timestamp: Date.now(),
        type: 'robber',
      });
    }
  } else {
    next = distributeResources(next, total);
    next.turnPhase = 'main';
  }

  return next;
}

/**
 * Player discards required resources after rolling 7
 */
export function discardResources(
  state: CatanGameState,
  playerId: string,
  discarded: Partial<ResourceCount>
): CatanGameState {
  const next = { ...state };
  const player = next.players.find((p) => p.id === playerId);
  if (!player) return next;

  let totalDiscarded = 0;
  (Object.keys(discarded) as ResourceType[]).forEach((res) => {
    const amount = discarded[res] || 0;
    if (amount > 0 && player.resources[res] >= amount) {
      player.resources[res] -= amount;
      totalDiscarded += amount;
    }
  });

  next.logs.unshift({
    id: 'log_discard_done_' + Date.now(),
    text: `️ ${player.name} discarded ${totalDiscarded} cards due to 7 roll.`,
    timestamp: Date.now(),
    type: 'robber',
  });

  // Remove player from pendingDiscards
  if (next.pendingDiscards) {
    next.pendingDiscards = next.pendingDiscards.filter((d) => d.playerId !== playerId);
    if (next.pendingDiscards.length === 0) {
      next.turnPhase = 'robber-move';
      const activePlayer = next.players[next.currentTurnIndex];
      next.logs.unshift({
        id: 'log_robber_ready_' + Date.now(),
        text: `All discards resolved. ${activePlayer.name} must now move the robber.`,
        timestamp: Date.now(),
        type: 'robber',
      });
    }
  } else {
    next.turnPhase = 'robber-move';
  }

  return next;
}

/**
 * Moves robber to a new hex
 */
export function moveRobber(state: CatanGameState, targetHexId: number): CatanGameState {
  const next = { ...state };
  next.hexes = next.hexes.map((h) => ({
    ...h,
    hasRobber: h.id === targetHexId,
  }));
  next.robberHexId = targetHexId;

  // Deep clone players so resource transfers don't mutate state in place
  next.players = state.players.map((p) => ({
    ...p,
    resources: { ...p.resources },
    devCards: [...p.devCards],
  }));

  const activePlayer = next.players[next.currentTurnIndex];
  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `${activePlayer.name} placed the robber on hex #${targetHexId + 1}.`,
    timestamp: Date.now(),
    type: 'robber',
  });

  // Find players on this hex to steal from
  const adjacentOwners = Array.from(
    new Set(
      next.vertices
        .filter((v) => v.hexIds.includes(targetHexId) && v.owner && v.owner !== activePlayer.id)
        .map((v) => v.owner as string)
    )
  );

  if (adjacentOwners.length > 0) {
    // Pick first opponent or steal directly
    const targetPlayer = next.players.find((p) => p.id === adjacentOwners[0]);
    if (targetPlayer) {
      // Find cards they have
      const availableResources = (Object.keys(targetPlayer.resources) as ResourceType[]).filter(
        (r) => targetPlayer.resources[r] > 0
      );
      if (availableResources.length > 0) {
        const stolen = availableResources[Math.floor(Math.random() * availableResources.length)];
        targetPlayer.resources[stolen]--;
        activePlayer.resources[stolen]++;
        next.logs.unshift({
          id: 'log_' + Date.now() + '_stolen',
          text: `${activePlayer.name} stole 1 card from ${targetPlayer.name}.`,
          timestamp: Date.now(),
          type: 'robber',
        });
      }
    }
  }

  // If robber was moved via Knight card before rolling dice, resume roll phase; else main
  next.turnPhase = next.diceRoll ? 'main' : 'roll';
  return next;
}

/**
 * Evaluates a vertex's strategic value for initial setup placements
 */
export function scoreVertexForSetup(state: CatanGameState, vertex: CatanVertex): number {
  if (!vertex) return 0;
  let score = 0;
  const PIP_MAP: Record<number, number> = {
    2: 1, 12: 1,
    3: 2, 11: 2,
    4: 3, 10: 3,
    5: 4, 9: 4,
    6: 5, 8: 5,
  };

  const resourceTypes = new Set<ResourceType>();
  vertex.hexIds.forEach((hId) => {
    const hex = state.hexes[hId];
    if (hex && hex.terrain !== 'desert' && hex.number) {
      score += (PIP_MAP[hex.number] || 1) * 3;
      resourceTypes.add(hex.terrain as ResourceType);
    }
  });

  // Diversity bonus: Having multiple distinct resource types is key for early game flexibility
  score += resourceTypes.size * 3;

  // Port vertex presence
  if (vertex.port) {
    score += vertex.port === 'threeToOne' ? 2 : 3;
  }

  return score;
}

/**
 * Builds settlement on vertex
 */
export function buildSettlement(state: CatanGameState, vertexId: number): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p, idx) => {
    if (idx !== state.currentTurnIndex) return p;
    return {
      ...p,
      resources: { ...p.resources },
      devCards: [...p.devCards],
    };
  });
  const activePlayer = next.players[next.currentTurnIndex];

  next.vertices = next.vertices.map((v) =>
    v.id === vertexId ? { ...v, owner: activePlayer.id, type: 'settlement' } : v
  );
  activePlayer.settlementsLeft--;

  // Deduct resources if main phase
  if (next.turnPhase === 'main') {
    const cost = BUILDING_COSTS.settlement;
    activePlayer.resources.wood -= cost.wood;
    activePlayer.resources.brick -= cost.brick;
    activePlayer.resources.sheep -= cost.sheep;
    activePlayer.resources.wheat -= cost.wheat;
  }

  // Check setup phases transition
  if (next.turnPhase === 'setup-settlement-1') {
    next.lastBuiltVertexId = vertexId;
    next.turnPhase = 'setup-road-1';

    next.logs.unshift({
      id: 'log_' + Date.now(),
      text: `${activePlayer.name} placed their 1st Settlement. Now connect a road.`,
      timestamp: Date.now(),
      type: 'build',
    });
  } else if (next.turnPhase === 'setup-settlement-2') {
    next.lastBuiltVertexId = vertexId;
    next.turnPhase = 'setup-road-2';

    // Second settlement grants immediate starting resources from adjacent hexes touching it!
    const vertex = next.vertices[vertexId];
    const gainedList: ResourceType[] = [];
    const touchingHexIds: number[] = [];

    vertex.hexIds.forEach((hId) => {
      const hex = next.hexes[hId];
      if (hex && hex.terrain !== 'desert') {
        const res = hex.terrain as ResourceType;
        activePlayer.resources[res]++;
        gainedList.push(res);
        touchingHexIds.push(hex.id);
      }
    });

    next.lastStartingHarvest = {
      playerId: activePlayer.id,
      hexIds: touchingHexIds,
      resources: gainedList,
      timestamp: Date.now(),
    };

    if (gainedList.length > 0) {
      const counts: Record<string, number> = {};
      gainedList.forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      });
      const summary = Object.entries(counts)
        .map(([res, c]) => `${c} ${res}`)
        .join(', ');

      next.logs.unshift({
        id: 'log_starting_res_' + Date.now() + Math.random(),
        text: `Starting Resources: ${activePlayer.name} founded their 2nd Settlement and took ${summary} from touching hexes!`,
        timestamp: Date.now(),
        type: 'build',
      });
    } else {
      next.logs.unshift({
        id: 'log_' + Date.now(),
        text: `${activePlayer.name} placed their 2nd Settlement.`,
        timestamp: Date.now(),
        type: 'build',
      });
    }
  } else {
    next.logs.unshift({
      id: 'log_' + Date.now(),
      text: `${activePlayer.name} founded a Settlement!`,
      timestamp: Date.now(),
      type: 'build',
    });
  }

  return updateSpecialAwards(next);
}

/**
 * Builds city on vertex (upgrading settlement)
 */
export function buildCity(state: CatanGameState, vertexId: number): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p, idx) => {
    if (idx !== state.currentTurnIndex) return p;
    return {
      ...p,
      resources: { ...p.resources },
      devCards: [...p.devCards],
    };
  });
  const activePlayer = next.players[next.currentTurnIndex];

  next.vertices = next.vertices.map((v) =>
    v.id === vertexId ? { ...v, type: 'city' } : v
  );
  activePlayer.settlementsLeft++;
  activePlayer.citiesLeft--;

  const cost = BUILDING_COSTS.city;
  activePlayer.resources.wheat -= cost.wheat;
  activePlayer.resources.ore -= cost.ore;

  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `️ ${activePlayer.name} upgraded a Settlement into a City! (+2 VP)`,
    timestamp: Date.now(),
    type: 'build',
  });

  return updateSpecialAwards(next);
}

/**
 * Builds road on edge
 */
export function buildRoad(state: CatanGameState, edgeId: number): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p, idx) => {
    if (idx !== state.currentTurnIndex) return p;
    return {
      ...p,
      resources: { ...p.resources },
    };
  });
  const activePlayer = next.players[next.currentTurnIndex];

  next.edges = next.edges.map((e) =>
    e.id === edgeId ? { ...e, owner: activePlayer.id } : e
  );
  activePlayer.roadsLeft--;

  const hadFreeRoad = Boolean(state.freeRoadsRemaining && state.freeRoadsRemaining > 0);
  if (next.turnPhase === 'main') {
    if (hadFreeRoad) {
      next.freeRoadsRemaining = (next.freeRoadsRemaining || 0) - 1;
      if (next.freeRoadsRemaining <= 0 || activePlayer.roadsLeft <= 0) {
        next.freeRoadsRemaining = undefined;
      }
    } else {
      const cost = BUILDING_COSTS.road;
      activePlayer.resources.wood -= cost.wood;
      activePlayer.resources.brick -= cost.brick;
    }
  }

  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: hadFreeRoad
      ? `️ ${activePlayer.name} placed a free Road via Road Building!${
          next.freeRoadsRemaining ? ` (${next.freeRoadsRemaining} free road remaining)` : ' (Road Building finished)'
        }`
      : `️ ${activePlayer.name} paved a Road.`,
    timestamp: Date.now(),
    type: 'build',
  });

  // Setup snake draft progression
  if (next.turnPhase === 'setup-road-1') {
    next.lastBuiltVertexId = undefined;
    if (next.currentTurnIndex < next.players.length - 1) {
      next.currentTurnIndex++;
      next.turnPhase = 'setup-settlement-1';
      next.logs.unshift({
        id: 'log_snake_fwd_' + Date.now(),
        text: `Snake Draft: ${next.players[next.currentTurnIndex].name}'s turn to place 1st Settlement & Road.`,
        timestamp: Date.now(),
        type: 'info',
      });
    } else {
      // Last player in snake draft places 2nd settlement immediately!
      next.turnPhase = 'setup-settlement-2';
      next.logs.unshift({
        id: 'log_snake_turn_' + Date.now(),
        text: `Snake Draft Turnaround: ${activePlayer.name} now places their 2nd Settlement (and takes starting resources)!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
  } else if (next.turnPhase === 'setup-road-2') {
    next.lastBuiltVertexId = undefined;
    if (next.currentTurnIndex > 0) {
      next.currentTurnIndex--;
      next.turnPhase = 'setup-settlement-2';
      next.logs.unshift({
        id: 'log_snake_rev_' + Date.now(),
        text: `Snake Draft (Reverse): ${next.players[next.currentTurnIndex].name}'s turn to place 2nd Settlement & collect starting resources!`,
        timestamp: Date.now(),
        type: 'info',
      });
    } else {
      // All setup rounds finished! Normal game begins with Player 0
      next.currentTurnIndex = 0;
      next.turnPhase = 'roll';
      next.logs.unshift({
        id: 'log_game_start_' + Date.now(),
        text: `Snake Draft Complete! All players placed 2 settlements and 2 roads. Match begins — ${next.players[0].name} rolls the dice!`,
        timestamp: Date.now(),
        type: 'info',
      });
    }
  }

  return updateSpecialAwards(next);
}

/**
 * Buy a Development Card
 */
export function buyDevCard(state: CatanGameState): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p, idx) => {
    if (idx !== state.currentTurnIndex) return p;
    return {
      ...p,
      resources: { ...p.resources },
      devCards: [...p.devCards],
    };
  });
  const activePlayer = next.players[next.currentTurnIndex];

  if (next.devCardDeck.length === 0) return next;

  const card = next.devCardDeck.pop()!;
  activePlayer.devCards.push(card);

  const cost = BUILDING_COSTS.devCard;
  activePlayer.resources.sheep -= cost.sheep;
  activePlayer.resources.wheat -= cost.wheat;
  activePlayer.resources.ore -= cost.ore;

  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `🃏 ${activePlayer.name} bought a Development Card!`,
    timestamp: Date.now(),
    type: 'devCard',
  });

  return updateSpecialAwards(next);
}

/**
 * Plays a Development Card (Knight, Road Building, Year of Plenty, Monopoly)
 */
export function playDevCard(
  state: CatanGameState,
  cardType: DevCardType,
  options?: {
    monopolyResource?: ResourceType;
    yearOfPlentyResources?: [ResourceType, ResourceType];
  },
  playerId?: string
): CatanGameState {
  let next = { ...state };
  next.players = state.players.map((p) => ({
    ...p,
    resources: { ...p.resources },
    devCards: [...p.devCards],
  }));

  const pid = playerId || next.players[next.currentTurnIndex].id;
  const player = next.players.find((p) => p.id === pid);
  if (!player) return next;

  // Find index of card in player's devCards
  const cardIndex = player.devCards.indexOf(cardType);
  if (cardIndex === -1 && cardType !== 'victoryPoint') return next;

  if (cardType === 'knight') {
    player.devCards.splice(cardIndex, 1);
    player.playedKnights++;
    next.turnPhase = 'robber-move';
    next.logs.unshift({
      id: 'log_knight_' + Date.now(),
      text: `️ ${player.name} played a Knight card! They may relocate the Robber. (Total Knights: ${player.playedKnights})`,
      timestamp: Date.now(),
      type: 'devCard',
    });
  } else if (cardType === 'roadBuilding') {
    player.devCards.splice(cardIndex, 1);
    next.freeRoadsRemaining = 2;
    next.logs.unshift({
      id: 'log_rb_' + Date.now(),
      text: `${player.name} played Road Building! They can place 2 free roads immediately.`,
      timestamp: Date.now(),
      type: 'devCard',
    });
  } else if (cardType === 'yearOfPlenty') {
    player.devCards.splice(cardIndex, 1);
    const r1 = options?.yearOfPlentyResources?.[0] || 'wood';
    const r2 = options?.yearOfPlentyResources?.[1] || 'brick';
    player.resources[r1]++;
    player.resources[r2]++;
    next.logs.unshift({
      id: 'log_yop_' + Date.now(),
      text: `${player.name} played Year of Plenty and took 1 ${r1} and 1 ${r2} from the Bank!`,
      timestamp: Date.now(),
      type: 'devCard',
    });
  } else if (cardType === 'monopoly') {
    player.devCards.splice(cardIndex, 1);
    const chosen = options?.monopolyResource || 'ore';
    let totalStolen = 0;
    next.players.forEach((other) => {
      if (other.id !== player.id && other.resources[chosen] > 0) {
        totalStolen += other.resources[chosen];
        other.resources[chosen] = 0;
      }
    });
    player.resources[chosen] += totalStolen;
    next.logs.unshift({
      id: 'log_mono_' + Date.now(),
      text: `${player.name} declared a Monopoly on ${chosen.toUpperCase()}! Stole ${totalStolen} ${chosen} card(s) from opponents.`,
      timestamp: Date.now(),
      type: 'devCard',
    });
  }

  return updateSpecialAwards(next);
}

/**
 * Calculates current trade ratio for all resources based on owned ports:
 * - 2:1 for specialized port (if player has building on port vertex)
 * - 3:1 for general port (if player has building on 3:1 port vertex)
 * - 4:1 standard bank trade (if no port)
 */
export function getPlayerPortRatios(
  state: CatanGameState,
  playerId: string
): Record<ResourceType, number> {
  const ratios: Record<ResourceType, number> = {
    wood: 4,
    brick: 4,
    sheep: 4,
    wheat: 4,
    ore: 4,
  };

  // Find all vertices where playerId has a settlement or city
  const ownedVertices = state.vertices.filter((v) => v.owner === playerId);
  let hasThreeToOne = false;

  ownedVertices.forEach((v) => {
    if (v.port === 'threeToOne') {
      hasThreeToOne = true;
    } else if (v.port && v.port in ratios) {
      ratios[v.port as ResourceType] = 2;
    }
  });

  if (hasThreeToOne) {
    (Object.keys(ratios) as ResourceType[]).forEach((res) => {
      if (ratios[res] > 3) {
        ratios[res] = 3;
      }
    });
  }

  return ratios;
}

/**
 * Bank / Port Trade: give 4 (or 3 or 2) of one resource for 1 of another
 */
export function tradeWithBank(
  state: CatanGameState,
  give: ResourceType,
  receive: ResourceType,
  ratio?: number,
  playerId?: string
): CatanGameState {
  const next = { ...state };
  const pid = playerId || next.players[next.currentTurnIndex].id;
  const player = next.players.find((p) => p.id === pid) || next.players[next.currentTurnIndex];
  const ratios = getPlayerPortRatios(next, player.id);
  const actualRatio = ratio || ratios[give] || 4;

  if (player.resources[give] < actualRatio) return next;

  player.resources[give] -= actualRatio;
  player.resources[receive] += 1;

  const portTypeLabel =
    actualRatio === 2 ? '2:1 Specialized Port' : actualRatio === 3 ? '3:1 General Harbor' : '4:1 Bank Trade';

  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `️ ${player.name} traded ${actualRatio} ${give} for 1 ${receive} via ${portTypeLabel}.`,
    timestamp: Date.now(),
    type: 'trade',
  });

  return next;
}

/**
 * Proposes a trade with other players or bots
 */
export function proposeTradeOffer(
  state: CatanGameState,
  offer: {
    fromPlayerId: string;
    fromPlayerName: string;
    toPlayerId?: string;
    give: Partial<ResourceCount>;
    want: Partial<ResourceCount>;
  }
): CatanGameState {
  const next = { ...state };
  next.players = state.players.map((p) => ({
    ...p,
    resources: { ...p.resources },
    devCards: [...p.devCards],
  }));

  const proposer = next.players.find((p) => p.id === offer.fromPlayerId);
  if (!proposer) return next;

  // Validate that proposer actually has the offered cards
  for (const [res, count] of Object.entries(offer.give)) {
    const r = res as ResourceType;
    if ((count || 0) > 0 && proposer.resources[r] < (count || 0)) {
      return next;
    }
  }

  const giveParts = Object.entries(offer.give)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([res, count]) => `${count} ${res}`);
  const wantParts = Object.entries(offer.want)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([res, count]) => `${count} ${res}`);

  const tradeOffer: TradeOffer = {
    id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    fromPlayerId: offer.fromPlayerId,
    fromPlayerName: offer.fromPlayerName,
    toPlayerId: offer.toPlayerId,
    give: { ...offer.give },
    want: { ...offer.want },
    createdAt: Date.now(),
  };

  next.tradeOffer = tradeOffer;
  next.logs.unshift({
    id: 'log_offer_' + Date.now(),
    text: `${proposer.name} offered to trade: [${giveParts.join(', ')}] in exchange for [${wantParts.join(', ')}].`,
    timestamp: Date.now(),
    type: 'trade',
  });

  return next;
}

/**
 * Cancels active trade offer
 */
export function cancelTradeOffer(state: CatanGameState, playerId: string): CatanGameState {
  if (!state.tradeOffer) return state;
  const next = { ...state };
  const proposer = next.players.find((p) => p.id === state.tradeOffer?.fromPlayerId);
  next.tradeOffer = null;
  next.logs.unshift({
    id: 'log_trade_cancel_' + Date.now(),
    text: `Trade offer was cancelled${proposer ? ` by ${proposer.name}` : ''}.`,
    timestamp: Date.now(),
    type: 'trade',
  });
  return next;
}

/**
 * Accepts an active trade offer between proposer and accepting player
 */
export function acceptTradeOffer(
  state: CatanGameState,
  acceptingPlayerId: string
): CatanGameState {
  if (!state.tradeOffer) return state;
  const next = { ...state };
  next.players = state.players.map((p) => ({
    ...p,
    resources: { ...p.resources },
    devCards: [...p.devCards],
  }));

  const offer = next.tradeOffer;
  if (!offer) return next;
  if (acceptingPlayerId === offer.fromPlayerId) return next;
  if (offer.toPlayerId && offer.toPlayerId !== 'all' && offer.toPlayerId !== acceptingPlayerId) {
    return next;
  }

  const proposer = next.players.find((p) => p.id === offer.fromPlayerId);
  const acceptor = next.players.find((p) => p.id === acceptingPlayerId);
  if (!proposer || !acceptor) return next;

  // Validate proposer still has what they offered
  for (const [res, count] of Object.entries(offer.give)) {
    const r = res as ResourceType;
    if ((count || 0) > 0 && proposer.resources[r] < (count || 0)) {
      next.logs.unshift({
        id: 'log_trade_fail_' + Date.now(),
        text: `️ Trade failed: ${proposer.name} no longer has sufficient resources.`,
        timestamp: Date.now(),
        type: 'trade',
      });
      next.tradeOffer = null;
      return next;
    }
  }

  // Validate acceptor has what was requested
  for (const [res, count] of Object.entries(offer.want)) {
    const r = res as ResourceType;
    if ((count || 0) > 0 && acceptor.resources[r] < (count || 0)) {
      return next;
    }
  }

  // Transfer resources
  for (const [res, count] of Object.entries(offer.give)) {
    const r = res as ResourceType;
    const amt = count || 0;
    if (amt > 0) {
      proposer.resources[r] -= amt;
      acceptor.resources[r] += amt;
    }
  }

  for (const [res, count] of Object.entries(offer.want)) {
    const r = res as ResourceType;
    const amt = count || 0;
    if (amt > 0) {
      acceptor.resources[r] -= amt;
      proposer.resources[r] += amt;
    }
  }

  const giveParts = Object.entries(offer.give)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([res, count]) => `${count} ${res}`);
  const wantParts = Object.entries(offer.want)
    .filter(([_, count]) => (count || 0) > 0)
    .map(([res, count]) => `${count} ${res}`);

  next.logs.unshift({
    id: 'log_trade_deal_' + Date.now(),
    text: `Deal closed! ${acceptor.name} accepted ${proposer.name}'s trade: gave [${wantParts.join(', ')}] for [${giveParts.join(', ')}].`,
    timestamp: Date.now(),
    type: 'trade',
  });

  next.tradeOffer = null;
  return updateSpecialAwards(next);
}

/**
 * Intelligent Bot Trade evaluation
 */
export function botEvaluateTradeOffer(state: CatanGameState, botId: string): boolean {
  if (!state.tradeOffer) return false;
  const offer = state.tradeOffer;
  if (offer.fromPlayerId === botId) return false;
  if (offer.toPlayerId && offer.toPlayerId !== 'all' && offer.toPlayerId !== botId) {
    return false;
  }

  const bot = state.players.find((p) => p.id === botId);
  if (!bot || !bot.isBot) return false;

  // 1. Can bot afford what is requested?
  let totalWanted = 0;
  for (const [res, count] of Object.entries(offer.want)) {
    const r = res as ResourceType;
    const needed = count || 0;
    if (needed > 0) {
      totalWanted += needed;
      if (bot.resources[r] < needed) return false;
    }
  }

  if (totalWanted === 0) return false;

  // 2. How much does bot value what is offered?
  let totalOffered = 0;
  let botValuesOffered = 0;
  for (const [res, count] of Object.entries(offer.give)) {
    const r = res as ResourceType;
    const given = count || 0;
    if (given > 0) {
      totalOffered += given;
      // If bot has 0 of what is offered, it's very appealing
      if (bot.resources[r] === 0) botValuesOffered += given * 1.5;
      else if (bot.resources[r] <= 1) botValuesOffered += given * 1.2;
      else botValuesOffered += given;
    }
  }

  if (totalOffered === 0) return false;

  // Bot accepts if offer is clearly favorable or fair:
  if (totalOffered > totalWanted) return true;
  if (totalOffered === totalWanted && botValuesOffered >= totalWanted * 1.1) return true;

  // If 1-for-1 trade: accept if bot has surplus (>= 2) of the wanted card
  if (totalOffered === 1 && totalWanted === 1) {
    const wantedRes = Object.keys(offer.want).find(
      (k) => (offer.want[k as ResourceType] || 0) > 0
    ) as ResourceType;
    if (wantedRes && bot.resources[wantedRes] >= 2) {
      return true;
    }
  }

  return false;
}

/**
 * End current turn and pass to next player
 */
export function endTurn(state: CatanGameState): CatanGameState {
  const next = { ...state };
  next.freeRoadsRemaining = undefined;
  next.currentTurnIndex = (next.currentTurnIndex + 1) % next.players.length;
  next.turnPhase = 'roll';
  next.diceRoll = null;

  const newPlayer = next.players[next.currentTurnIndex];
  next.logs.unshift({
    id: 'log_' + Date.now(),
    text: `It is now ${newPlayer.name}'s turn.`,
    timestamp: Date.now(),
    type: 'info',
  });

  return next;
}

/**
 * Automated Bot Turn: makes decisions if current player is a bot
 */
export function executeBotTurn(state: CatanGameState): CatanGameState {
  try {
    let cur = { ...state };
    const bot = cur.players[cur.currentTurnIndex];
    if (!bot || !bot.isBot) return cur;

    // Check if there is an active trade offer the bot should respond to
    if (cur.tradeOffer && cur.tradeOffer.fromPlayerId !== bot.id) {
      if (botEvaluateTradeOffer(cur, bot.id)) {
        cur = acceptTradeOffer(cur, bot.id);
        return cur;
      }
    }

    // Setup phase 1 or 2: place settlement and road
    if (cur.turnPhase === 'setup-settlement-1' || cur.turnPhase === 'setup-settlement-2') {
      const validVertices = cur.vertices.filter((v) => canPlaceSettlement(cur, v.id, bot.id));
      if (validVertices.length > 0) {
        // Pick vertex with highest strategic score (dice probability pips & resource variety)
        validVertices.sort((a, b) => scoreVertexForSetup(cur, b) - scoreVertexForSetup(cur, a));
        cur = buildSettlement(cur, validVertices[0].id);
      } else {
        // Fallback: If no vertex is valid, advance to road phase so bot doesn't get stuck
        cur.turnPhase = cur.turnPhase === 'setup-settlement-1' ? 'setup-road-1' : 'setup-road-2';
      }
      return cur;
    }

    // If players are currently resolving discards from a 7 roll, wait for them
    if (cur.turnPhase === 'robber-discard') {
      return cur;
    }

    if (cur.turnPhase === 'setup-road-1' || cur.turnPhase === 'setup-road-2') {
      const validEdges = cur.edges.filter((e) => canPlaceRoad(cur, e.id, bot.id));
      if (validEdges.length > 0) {
        // Direct the road toward the vertex with higher score
        validEdges.sort((a, b) => {
          const otherVa = a.v1 === cur.lastBuiltVertexId ? a.v2 : a.v1;
          const otherVb = b.v1 === cur.lastBuiltVertexId ? b.v2 : b.v1;
          return scoreVertexForSetup(cur, cur.vertices[otherVb]) - scoreVertexForSetup(cur, cur.vertices[otherVa]);
        });
        cur = buildRoad(cur, validEdges[0].id);
      } else {
        // Fallback: advance snake draft if no valid edge could be found
        if (cur.turnPhase === 'setup-road-1') {
          if (cur.currentTurnIndex < cur.players.length - 1) {
            cur.currentTurnIndex++;
            cur.turnPhase = 'setup-settlement-1';
          } else {
            cur.turnPhase = 'setup-settlement-2';
          }
        } else {
          if (cur.currentTurnIndex > 0) {
            cur.currentTurnIndex--;
            cur.turnPhase = 'setup-settlement-2';
          } else {
            cur.currentTurnIndex = 0;
            cur.turnPhase = 'roll';
          }
        }
      }
      return cur;
    }

    // Roll phase: roll dice
    if (cur.turnPhase === 'roll') {
      cur = rollDice(cur);
      return cur;
    }

    // Robber move
    if (cur.turnPhase === 'robber-move') {
      const candidateHexes = cur.hexes.filter((h) => h.id !== cur.robberHexId && h.terrain !== 'desert');
      const pick =
        candidateHexes.length > 0
          ? candidateHexes[Math.floor(Math.random() * candidateHexes.length)]
          : cur.hexes.find((h) => h.id !== cur.robberHexId) || cur.hexes[0];
      cur = moveRobber(cur, pick.id);
      return cur;
    }

    // Main phase: try actions
    if (cur.turnPhase === 'main') {
      // 0. Handle free roads from Road Building
      if (cur.freeRoadsRemaining && cur.freeRoadsRemaining > 0) {
        const roadCandidates = cur.edges.filter((e) => canPlaceRoad(cur, e.id, bot.id));
        if (roadCandidates.length > 0 && bot.roadsLeft > 0) {
          cur = buildRoad(cur, roadCandidates[0].id);
          return cur;
        } else {
          cur.freeRoadsRemaining = undefined;
        }
      }

      // 0.5. Try play Dev Cards
      if (bot.devCards.includes('knight')) {
        const hasRobberOnMyHex = cur.vertices.some(
          (v) => v.owner === bot.id && v.hexIds.includes(cur.robberHexId)
        );
        if (hasRobberOnMyHex) {
          cur = playDevCard(cur, 'knight', undefined, bot.id);
          return cur;
        }
      }

      if (bot.devCards.includes('yearOfPlenty')) {
        cur = playDevCard(cur, 'yearOfPlenty', { yearOfPlentyResources: ['wheat', 'ore'] }, bot.id);
        return cur;
      }

      if (bot.devCards.includes('monopoly')) {
        cur = playDevCard(cur, 'monopoly', { monopolyResource: 'ore' }, bot.id);
        return cur;
      }

      if (bot.devCards.includes('roadBuilding') && bot.roadsLeft >= 2) {
        cur = playDevCard(cur, 'roadBuilding', undefined, bot.id);
        return cur;
      }

      // 1. Try build city
      const cityCandidates = cur.vertices.filter((v) => canPlaceCity(cur, v.id, bot.id));
      if (cityCandidates.length > 0) {
        cur = buildCity(cur, cityCandidates[0].id);
        return cur;
      }

      // 2. Try build settlement
      const settlementCandidates = cur.vertices.filter((v) => canPlaceSettlement(cur, v.id, bot.id));
      if (settlementCandidates.length > 0) {
        cur = buildSettlement(cur, settlementCandidates[0].id);
        return cur;
      }

      // 3. Try build road
      const roadCandidates = cur.edges.filter((e) => canPlaceRoad(cur, e.id, bot.id));
      if (roadCandidates.length > 0 && bot.roadsLeft > 0) {
        cur = buildRoad(cur, roadCandidates[0].id);
        return cur;
      }

      // 4. Try buy dev card
      const devCost = BUILDING_COSTS.devCard;
      if (
        bot.resources.sheep >= devCost.sheep &&
        bot.resources.wheat >= devCost.wheat &&
        bot.resources.ore >= devCost.ore &&
        cur.devCardDeck.length > 0
      ) {
        cur = buyDevCard(cur);
        return cur;
      }

      // 5. Smart Maritime/Bank Trade: If bot has 4+ of a surplus resource and is missing 1 resource for a city or settlement
      const ratios = getPlayerPortRatios(cur, bot.id);
      const resTypes: ResourceType[] = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
      const surplus = resTypes.find((r) => bot.resources[r] >= (ratios[r] || 4) + 1);
      if (surplus) {
        const ratio = ratios[surplus] || 4;
        // Check what bot needs
        let needed: ResourceType | null = null;
        if (bot.resources.wheat < 2 && bot.resources.ore >= 2) needed = 'wheat';
        else if (bot.resources.ore < 3 && bot.resources.wheat >= 2) needed = 'ore';
        else if (bot.resources.brick < 1 && bot.resources.wood >= 1) needed = 'brick';
        else if (bot.resources.wood < 1 && bot.resources.brick >= 1) needed = 'wood';

        if (needed && needed !== surplus && bot.resources[surplus] >= ratio) {
          cur = tradeWithBank(cur, surplus, needed, ratio, bot.id);
          return cur;
        }
      }

      // End turn
      cur = endTurn(cur);
    }

    return cur;
  } catch (err) {
    console.error('Error during executeBotTurn:', err);
    return endTurn(state);
  }
}

/**
 * Shuffles the board terrains and number tokens, repositioning the robber onto the new desert hex.
 */
export function shuffleCatanBoard(state: CatanGameState): CatanGameState {
  const next = { ...state };
  const shuffledTerrains = [...STANDARD_TERRAINS].sort(() => Math.random() - 0.5);
  const shuffledNumbers = [...STANDARD_NUMBERS].sort(() => Math.random() - 0.5);

  let numIdx = 0;
  let newRobberHexId = 0;

  next.hexes = next.hexes.map((hex, i) => {
    const terrain = shuffledTerrains[i] || hex.terrain;
    const isDesert = terrain === 'desert';
    if (isDesert) {
      newRobberHexId = hex.id;
    }
    const num = isDesert ? null : (shuffledNumbers[numIdx++] ?? 6);
    return {
      ...hex,
      terrain,
      number: num,
      hasRobber: isDesert,
    };
  });

  next.robberHexId = newRobberHexId;
  return next;
}
