import {
  SWDGameState,
  SWDPlayerState,
  SWDAction,
  DraftCard,
  CostBreakdown,
  ResourceType,
  BuildingColor,
  SWDScoreDetails,
  SWDBuilding,
  SWDWonder,
} from './types';
import {
  BUILDINGS,
  WONDERS,
  PROGRESS_TOKENS,
  AGE_LAYOUTS,
} from './constants';

export function createInitialSWDGame(
  player1: { id: string; name: string; avatar: string; isBot?: boolean },
  player2: { id: string; name: string; avatar: string; isBot?: boolean }
): SWDGameState {
  // Shuffle 12 wonders
  const allWonders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].sort(() => Math.random() - 0.5);
  const round1Wonders = allWonders.slice(0, 4);

  // Shuffle 10 progress tokens
  const allTokens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5);
  const boardTokens = allTokens.slice(0, 5);
  const boxTokens = allTokens.slice(5, 10);

  const players: Record<string, SWDPlayerState> = {
    [player1.id]: {
      userId: player1.id,
      name: player1.name,
      avatar: player1.avatar,
      isBot: player1.isBot,
      coins: 7,
      wonders: [],
      buildings: [],
      progressTokens: [],
      scienceSymbols: [],
    },
    [player2.id]: {
      userId: player2.id,
      name: player2.name,
      avatar: player2.avatar,
      isBot: player2.isBot,
      coins: 7,
      wonders: [],
      buildings: [],
      progressTokens: [],
      scienceSymbols: [],
    },
  };

  return {
    id: 'swd_' + Date.now(),
    currentPhase: 'wonder_draft',
    currentAge: 1,
    activePlayerId: player1.id,
    playerOrder: [player1.id, player2.id],
    players,
    wonderDraftRound: 1,
    wonderDraftPool: round1Wonders,
    wonderDraftStep: 0,
    draftPool: [],
    conflictPawnPosition: 0,
    militaryTokens: [
      { position: -6, value: 5, isTaken: false },
      { position: -3, value: 2, isTaken: false },
      { position: 3, value: 2, isTaken: false },
      { position: 6, value: 5, isTaken: false },
    ],
    boardProgressTokens: boardTokens,
    boxProgressTokens: boxTokens,
    discardPile: [],
    extraTurn: false,
    actionLog: [
      `Game started! ${player1.name} and ${player2.name} are drafting Wonders.`,
    ],
  };
}

export function generateAgeDraftPool(age: number): DraftCard[] {
  let cardIds: number[] = [];
  if (age === 1) {
    // 23 Age 1 cards, discard 3 randomly
    const age1Cards = Object.values(BUILDINGS)
      .filter((b) => b.age === 1)
      .map((b) => b.id)
      .sort(() => Math.random() - 0.5);
    cardIds = age1Cards.slice(0, 20);
  } else if (age === 2) {
    // 23 Age 2 cards, discard 3 randomly
    const age2Cards = Object.values(BUILDINGS)
      .filter((b) => b.age === 2)
      .map((b) => b.id)
      .sort(() => Math.random() - 0.5);
    cardIds = age2Cards.slice(0, 20);
  } else {
    // Age 3: 20 Age 3 cards (take 17) + 7 Guilds (take 3) = 20 cards
    const age3Cards = Object.values(BUILDINGS)
      .filter((b) => b.age === 3)
      .map((b) => b.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 17);
    const guildCards = Object.values(BUILDINGS)
      .filter((b) => b.type === 'purple')
      .map((b) => b.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    cardIds = [...age3Cards, ...guildCards].sort(() => Math.random() - 0.5);
  }

  const layout = AGE_LAYOUTS[age as 1 | 2 | 3];
  const draftPool: DraftCard[] = [];
  let cardIdx = 0;

  layout.forEach((rowConfig, rowIndex) => {
    rowConfig.cols.forEach((col) => {
      draftPool.push({
        id: cardIds[cardIdx++],
        row: rowIndex,
        col,
        faceUp: rowConfig.faceUp,
        isTaken: false,
      });
    });
  });

  return draftPool;
}

export function isCardAvailable(card: DraftCard, draftPool: DraftCard[]): boolean {
  if (card.isTaken) return false;

  // A card is covered if there are remaining (not taken) cards directly in the row below it
  // at column - 1 or column + 1.
  const rowBelow = card.row + 1;
  const coveringCards = draftPool.filter(
    (c) =>
      !c.isTaken &&
      c.row === rowBelow &&
      (c.col === card.col - 1 || c.col === card.col + 1)
  );

  return coveringCards.length === 0;
}

export function updateDraftPoolAvailability(draftPool: DraftCard[]): DraftCard[] {
  return draftPool.map((c) => {
    if (c.isTaken) return c;
    const available = isCardAvailable(c, draftPool);
    // If card is newly available and was face-down, flip it face-up!
    if (available && !c.faceUp) {
      return { ...c, faceUp: true };
    }
    return c;
  });
}

// Compute player resource production
export function getPlayerProduction(player: SWDPlayerState): {
  basic: Record<ResourceType, number>;
  flexible: ResourceType[][];
  fixedPrice: Set<ResourceType>;
} {
  const basic: Record<ResourceType, number> = {
    wood: 0,
    clay: 0,
    stone: 0,
    glass: 0,
    papyrus: 0,
  };
  const flexible: ResourceType[][] = [];
  const fixedPrice = new Set<ResourceType>();

  // Buildings
  player.buildings.forEach((cardId) => {
    const b = BUILDINGS[cardId];
    if (!b) return;

    // Direct resources (Brown & Grey)
    if (b.resources) {
      (Object.keys(b.resources) as ResourceType[]).forEach((res) => {
        basic[res] += b.resources[res] || 0;
      });
    }

    // Flexible choice (Yellow cards: Forum, Caravansery)
    if (b.resourceChoice && b.resourceChoice.length > 0) {
      flexible.push(b.resourceChoice);
    }

    // Fixed price yellow trading cards
    if (b.fixedPriceResources) {
      b.fixedPriceResources.forEach((res) => fixedPrice.add(res));
    }
  });

  // Wonders constructed
  player.wonders
    .filter((w) => w.isConstructed)
    .forEach((pw) => {
      const wonder = WONDERS[pw.id];
      if (wonder && wonder.resourceChoice && wonder.resourceChoice.length > 0) {
        flexible.push(wonder.resourceChoice);
      }
    });

  return { basic, flexible, fixedPrice };
}

// Calculate the cost to construct a building or wonder
export function calculateCost(
  state: SWDGameState,
  playerId: string,
  target: { type: 'building'; building: SWDBuilding } | { type: 'wonder'; wonder: SWDWonder }
): CostBreakdown {
  const player = state.players[playerId];
  const opponentId = state.playerOrder[0] === playerId ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];

  // 1. Check free through link
  if (target.type === 'building' && target.building.freeIfHas) {
    if (player.buildings.includes(target.building.freeIfHas)) {
      return {
        canAfford: true,
        isFreeThroughLink: true,
        requiredCoins: 0,
        producedResources: {},
        missingResources: {},
        tradeCostPerResource: {},
        totalTradeCost: 0,
      };
    }
  }

  const { basic, flexible, fixedPrice } = getPlayerProduction(player);
  const opponentProduction = getPlayerProduction(opponent).basic;

  // Base raw cost
  const rawCost: Partial<Record<ResourceType | 'coins', number>> = {
    ...(target.type === 'building' ? target.building.cost : target.wonder.cost),
  };

  const coinCost = (rawCost.coins || 0) as number;
  delete rawCost.coins;

  // Token discounts:
  // Architecture: -2 resources for Wonders
  // Masonry: -2 resources for Blue cards
  let discountRemaining = 0;
  if (target.type === 'wonder' && player.progressTokens.includes(2)) {
    discountRemaining = 2;
  } else if (
    target.type === 'building' &&
    target.building.type === 'blue' &&
    player.progressTokens.includes(5)
  ) {
    discountRemaining = 2;
  }

  // Determine needed amounts
  const needed: Partial<Record<ResourceType, number>> = {};
  (Object.keys(rawCost) as ResourceType[]).forEach((res) => {
    const req = rawCost[res] || 0;
    if (req > 0) needed[res] = req;
  });

  // Apply basic production
  const produced: Partial<Record<ResourceType, number>> = {};
  (Object.keys(needed) as ResourceType[]).forEach((res) => {
    const req = needed[res] || 0;
    const prod = basic[res] || 0;
    const used = Math.min(req, prod);
    produced[res] = used;
    needed[res] = req - used;
    if (needed[res] === 0) delete needed[res];
  });

  // Helper: cost to buy 1 unit of a resource from bank
  const getResourceTradePrice = (res: ResourceType) => {
    if (fixedPrice.has(res)) return 1;
    return 2 + (opponentProduction[res] || 0);
  };

  // Best allocation of flexible resources (greedy/optimal)
  let bestTradeCost = Infinity;
  let bestMissing: Partial<Record<ResourceType, number>> = {};

  const evaluateAllocation = (
    remNeeded: Partial<Record<ResourceType, number>>,
    flexIdx: number,
    discounts: number
  ) => {
    if (flexIdx >= flexible.length) {
      // Apply remaining discounts to the most expensive missing resources
      const currentMissing = { ...remNeeded };
      let d = discounts;
      while (d > 0) {
        const missingKeys = Object.keys(currentMissing) as ResourceType[];
        if (missingKeys.length === 0) break;
        // Find most expensive missing
        missingKeys.sort((a, b) => getResourceTradePrice(b) - getResourceTradePrice(a));
        const topRes = missingKeys[0];
        currentMissing[topRes] = (currentMissing[topRes] || 1) - 1;
        if (currentMissing[topRes] === 0) delete currentMissing[topRes];
        d--;
      }

      // Calculate total trade cost
      let cost = 0;
      (Object.keys(currentMissing) as ResourceType[]).forEach((res) => {
        const count = currentMissing[res] || 0;
        cost += count * getResourceTradePrice(res);
      });

      if (cost < bestTradeCost) {
        bestTradeCost = cost;
        bestMissing = currentMissing;
      }
      return;
    }

    const choices = flexible[flexIdx];
    // Option 1: don't use this flexible for any remaining (or use for something not in remNeeded)
    evaluateAllocation(remNeeded, flexIdx + 1, discounts);

    // Option 2: use this flexible for one of the needed resources
    for (const ch of choices) {
      if ((remNeeded[ch] || 0) > 0) {
        const nextNeeded = { ...remNeeded };
        nextNeeded[ch] = (nextNeeded[ch] || 1) - 1;
        if (nextNeeded[ch] === 0) delete nextNeeded[ch];
        evaluateAllocation(nextNeeded, flexIdx + 1, discounts);
      }
    }
  };

  evaluateAllocation(needed, 0, discountRemaining);

  const tradeCostPerResource: Partial<Record<ResourceType, number>> = {};
  (Object.keys(bestMissing) as ResourceType[]).forEach((res) => {
    tradeCostPerResource[res] = getResourceTradePrice(res);
  });

  const totalCost = coinCost + (bestTradeCost === Infinity ? 0 : bestTradeCost);

  return {
    canAfford: player.coins >= totalCost,
    isFreeThroughLink: false,
    requiredCoins: coinCost,
    producedResources: produced,
    missingResources: bestMissing,
    tradeCostPerResource,
    totalTradeCost: bestTradeCost === Infinity ? 0 : bestTradeCost,
  };
}

// Calculate discard gain
export function calculateDiscardGain(player: SWDPlayerState): number {
  const yellowCount = player.buildings.filter(
    (id) => BUILDINGS[id]?.type === 'yellow'
  ).length;
  return 2 + yellowCount;
}

// Check supremacy victory
export function checkSupremacyVictory(state: SWDGameState): SWDGameState {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];

  // 1. Military Supremacy: pawn reaches +9 (p1) or -9 (p2)
  if (state.conflictPawnPosition >= 9) {
    return {
      ...state,
      currentPhase: 'game_over',
      winner: {
        userId: p1Id,
        reason: 'military',
      },
      actionLog: [
        ...state.actionLog,
        `⚔️ Military Supremacy! ${state.players[p1Id].name} has conquered the capital!`,
      ],
    };
  }
  if (state.conflictPawnPosition <= -9) {
    return {
      ...state,
      currentPhase: 'game_over',
      winner: {
        userId: p2Id,
        reason: 'military',
      },
      actionLog: [
        ...state.actionLog,
        `⚔️ Military Supremacy! ${state.players[p2Id].name} has conquered the capital!`,
      ],
    };
  }

  // 2. Scientific Supremacy: player collects 6 distinct scientific symbols
  for (const pid of [p1Id, p2Id]) {
    const player = state.players[pid];
    const uniqueSymbols = new Set(player.scienceSymbols);
    if (uniqueSymbols.size >= 6) {
      return {
        ...state,
        currentPhase: 'game_over',
        winner: {
          userId: pid,
          reason: 'science',
        },
        actionLog: [
          ...state.actionLog,
          `🏛️ Scientific Supremacy! ${player.name} has unlocked 6 scientific disciplines!`,
        ],
      };
    }
  }

  return state;
}

// Calculate military track victory points at game end
export function getMilitaryVictoryPoints(
  conflictPawnPosition: number,
  isPlayer1: boolean
): number {
  const netPos = isPlayer1 ? conflictPawnPosition : -conflictPawnPosition;
  if (netPos <= 0) return 0;
  if (netPos >= 6) return 10;
  if (netPos >= 3) return 5;
  if (netPos >= 1) return 2;
  return 0;
}

// Calculate final scores for Civilian Victory
export function calculateFinalScores(state: SWDGameState): {
  [userId: string]: SWDScoreDetails;
} {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];
  const p1 = state.players[p1Id];
  const p2 = state.players[p2Id];

  const calcPlayer = (player: SWDPlayerState, opponent: SWDPlayerState, isPlayer1: boolean): SWDScoreDetails => {
    let civilian = 0;
    let science = 0;
    let wondersVP = 0;
    let tokens = 0;
    let guilds = 0;

    // Buildings VP
    player.buildings.forEach((cid) => {
      const b = BUILDINGS[cid];
      if (!b) return;
      if (b.type === 'blue') civilian += b.victoryPoints;
      if (b.type === 'green') science += b.victoryPoints;
      if (b.type === 'yellow') civilian += b.victoryPoints;

      // Guild scoring
      if (b.type === 'purple') {
        if (b.guildRewardBuildingTypes) {
          const type = b.guildRewardBuildingTypes[0];
          const countP = player.buildings.filter((c) => BUILDINGS[c]?.type === type).length;
          const countO = opponent.buildings.filter((c) => BUILDINGS[c]?.type === type).length;
          guilds += Math.max(countP, countO);
        } else if (b.guildRewardWonders) {
          const wP = player.wonders.filter((w) => w.isConstructed).length;
          const wO = opponent.wonders.filter((w) => w.isConstructed).length;
          guilds += Math.max(wP, wO) * 2;
        } else if (b.guildRewardCoinTriplets) {
          const maxCoins = Math.max(player.coins, opponent.coins);
          guilds += Math.floor(maxCoins / 3);
        }
      }
    });

    // Wonders VP
    player.wonders
      .filter((w) => w.isConstructed)
      .forEach((pw) => {
        const w = WONDERS[pw.id];
        if (w) wondersVP += w.victoryPoints;
      });

    // Progress Tokens VP
    player.progressTokens.forEach((tid) => {
      const t = PROGRESS_TOKENS[tid];
      if (!t) return;
      if (t.victoryPoints) tokens += t.victoryPoints;
      // Mathematics: +3 VP per progress token
      if (tid === 6) {
        tokens += player.progressTokens.length * 3;
      }
    });

    // Military VP
    const military = getMilitaryVictoryPoints(state.conflictPawnPosition, isPlayer1);

    // Treasury VP (1 VP per 3 coins)
    const treasury = Math.floor(player.coins / 3);

    const total = civilian + science + military + wondersVP + tokens + guilds + treasury;

    return {
      civilian,
      science,
      military,
      wonders: wondersVP,
      tokens,
      guilds,
      treasury,
      total,
    };
  };

  return {
    [p1Id]: calcPlayer(p1, p2, true),
    [p2Id]: calcPlayer(p2, p1, false),
  };
}

// Process a game action
export function processSWDAction(state: SWDGameState, playerId: string, action: SWDAction): SWDGameState {
  if (state.currentPhase === 'game_over') return state;
  if (state.activePlayerId !== playerId && state.pendingActionPlayerId !== playerId) {
    throw new Error('Not your turn');
  }

  let nextState: SWDGameState = JSON.parse(JSON.stringify(state));
  const player = nextState.players[playerId];
  const opponentId = nextState.playerOrder[0] === playerId ? nextState.playerOrder[1] : nextState.playerOrder[0];
  const opponent = nextState.players[opponentId];

  // 1. WONDER DRAFT PHASE
  if (action.type === 'draft_wonder') {
    if (nextState.currentPhase !== 'wonder_draft') {
      throw new Error('Not in wonder draft phase');
    }
    if (!nextState.wonderDraftPool.includes(action.wonderId)) {
      throw new Error('Wonder not in draft pool');
    }

    // Add wonder to player
    player.wonders.push({ id: action.wonderId, isConstructed: false });
    nextState.wonderDraftPool = nextState.wonderDraftPool.filter((id) => id !== action.wonderId);

    const wonder = WONDERS[action.wonderId];
    nextState.actionLog.push(`${player.name} selected Wonder “${wonder.name}”.`);

    const p1Id = nextState.playerOrder[0];
    const p2Id = nextState.playerOrder[1];

    if (nextState.wonderDraftRound === 1) {
      // Round 1 pattern: P1 (step 0), P2 (step 1), P2 (step 2), P1 (step 3)
      if (nextState.wonderDraftStep === 0) {
        nextState.activePlayerId = p2Id;
        nextState.wonderDraftStep = 1;
      } else if (nextState.wonderDraftStep === 1) {
        nextState.activePlayerId = p2Id; // P2 picks 2nd wonder
        nextState.wonderDraftStep = 2;
      } else if (nextState.wonderDraftStep === 2) {
        // Last remaining wonder goes to P1
        const lastWonder = nextState.wonderDraftPool[0];
        nextState.players[p1Id].wonders.push({ id: lastWonder, isConstructed: false });
        nextState.actionLog.push(`${nextState.players[p1Id].name} received Wonder “${WONDERS[lastWonder].name}”.`);

        // Setup Round 2
        let allRemainingWonders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(
          (id) =>
            !nextState.players[p1Id].wonders.some((w) => w.id === id) &&
            !nextState.players[p2Id].wonders.some((w) => w.id === id)
        );
        allRemainingWonders = allRemainingWonders.sort(() => Math.random() - 0.5);
        nextState.wonderDraftRound = 2;
        nextState.wonderDraftPool = allRemainingWonders.slice(0, 4);
        nextState.wonderDraftStep = 0;
        nextState.activePlayerId = p2Id; // P2 starts round 2
      }
    } else {
      // Round 2 pattern: P2 (step 0), P1 (step 1), P1 (step 2), P2 (step 3)
      if (nextState.wonderDraftStep === 0) {
        nextState.activePlayerId = p1Id;
        nextState.wonderDraftStep = 1;
      } else if (nextState.wonderDraftStep === 1) {
        nextState.activePlayerId = p1Id; // P1 picks 2nd wonder
        nextState.wonderDraftStep = 2;
      } else if (nextState.wonderDraftStep === 2) {
        // Last remaining wonder goes to P2
        const lastWonder = nextState.wonderDraftPool[0];
        nextState.players[p2Id].wonders.push({ id: lastWonder, isConstructed: false });
        nextState.actionLog.push(`${nextState.players[p2Id].name} received Wonder “${WONDERS[lastWonder].name}”.`);

        // Transition to Age 1!
        nextState.currentPhase = 'main_game';
        nextState.currentAge = 1;
        nextState.draftPool = generateAgeDraftPool(1);
        nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
        nextState.activePlayerId = p1Id; // P1 starts Age 1
        nextState.actionLog.push(`🏛️ Age I begins! ${nextState.players[p1Id].name} plays first.`);
      }
    }

    return nextState;
  }

  // 2. CONSTRUCT BUILDING
  if (action.type === 'construct_building') {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error('Card is not available');
    }

    const building = BUILDINGS[action.cardId];
    if (!building) throw new Error('Building not found');

    const costBreakdown = calculateCost(nextState, playerId, {
      type: 'building',
      building,
    });

    if (!costBreakdown.canAfford) {
      throw new Error('Cannot afford building');
    }

    // Deduct coins
    const totalCoinsPaid = costBreakdown.requiredCoins + costBreakdown.totalTradeCost;
    player.coins -= totalCoinsPaid;

    // Progress Token Economy: if trading coins spent, opponent with Economy gets them!
    if (costBreakdown.totalTradeCost > 0 && opponent.progressTokens.includes(3)) {
      opponent.coins += costBreakdown.totalTradeCost;
      nextState.actionLog.push(
        `💰 Economy! ${opponent.name} gained ${costBreakdown.totalTradeCost} coins spent in trade.`
      );
    }

    // Mark card taken
    card.isTaken = true;
    player.buildings.push(building.id);

    // Apply immediate building effects
    // 1. Coins
    if (building.coins > 0) {
      player.coins += building.coins;
    }
    // 2. Commercial coins per building type (Yellow cards)
    if (building.coinsPerBuildingOfType) {
      const type = building.coinsPerBuildingOfType.type;
      const count = player.buildings.filter((id) => BUILDINGS[id]?.type === type).length;
      const gained = count * building.coinsPerBuildingOfType.coins;
      player.coins += gained;
    }
    // 3. Coins per wonder
    if (building.coinsPerWonder && building.coinsPerWonder > 0) {
      const wCount = player.wonders.filter((w) => w.isConstructed).length;
      player.coins += wCount * building.coinsPerWonder;
    }
    // 4. Urbanism Token: +4 coins if free through link
    if (costBreakdown.isFreeThroughLink && player.progressTokens.includes(10)) {
      player.coins += 4;
      nextState.actionLog.push(
        `🏛️ Urbanism! ${player.name} gained 4 coins for constructing for free via chain.`
      );
    }
    // 5. Military Shields
    if (building.military > 0) {
      let shields = building.military;
      // Strategy Token: +1 shield on red buildings
      if (player.progressTokens.includes(8)) {
        shields += 1;
      }
      applyMilitaryAdvance(nextState, playerId, shields);
    }
    // 6. Science Symbol
    let triggersProgressSelection = false;
    if (building.scientificSymbol) {
      player.scienceSymbols.push(building.scientificSymbol);
      // Check for pair of identical symbols
      const symbolCounts: Record<number, number> = {};
      player.scienceSymbols.forEach((s) => {
        symbolCounts[s] = (symbolCounts[s] || 0) + 1;
      });
      if (symbolCounts[building.scientificSymbol] === 2) {
        triggersProgressSelection = true;
      }
    }

    nextState.lastAction = {
      type: 'construct_building',
      playerId,
      playerName: player.name,
      cardId: building.id,
      costPaid: totalCoinsPaid,
      description: `${player.name} constructed “${building.name}” ${
        costBreakdown.isFreeThroughLink
          ? 'for free (via chain link)'
          : `for ${totalCoinsPaid} coin${totalCoinsPaid === 1 ? '' : 's'}`
      }.`,
    };
    nextState.actionLog.push(nextState.lastAction.description);

    // Update draftpool availability
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);

    // Check supremacy victory
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === 'game_over') return nextState;

    // Check progress token selection
    if (triggersProgressSelection && nextState.boardProgressTokens.length > 0) {
      nextState.currentPhase = 'choose_progress_token';
      nextState.pendingActionPlayerId = playerId;
      nextState.availableSelectionTokens = [...nextState.boardProgressTokens];
      return nextState;
    }

    // Check end of turn
    return advanceTurnOrAge(nextState);
  }

  // 3. DISCARD CARD FOR COINS
  if (action.type === 'discard_card') {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error('Card is not available');
    }

    const building = BUILDINGS[action.cardId];
    if (!building) throw new Error('Building not found');

    const coinsGained = calculateDiscardGain(player);
    player.coins += coinsGained;
    card.isTaken = true;
    nextState.discardPile.push(building.id);

    nextState.lastAction = {
      type: 'discard_card',
      playerId,
      playerName: player.name,
      cardId: building.id,
      coinsGained,
      description: `${player.name} discarded “${building.name}” and gained ${coinsGained} coins.`,
    };
    nextState.actionLog.push(nextState.lastAction.description);

    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);
    return advanceTurnOrAge(nextState);
  }

  // 4. CONSTRUCT WONDER
  if (action.type === 'construct_wonder') {
    const card = nextState.draftPool.find((c) => c.id === action.cardId);
    if (!card || card.isTaken || !isCardAvailable(card, nextState.draftPool)) {
      throw new Error('Card is not available');
    }

    const totalConstructed =
      nextState.players[nextState.playerOrder[0]].wonders.filter((w) => w.isConstructed).length +
      nextState.players[nextState.playerOrder[1]].wonders.filter((w) => w.isConstructed).length;

    if (totalConstructed >= 7) {
      throw new Error('Maximum of 7 wonders already constructed');
    }

    const playerWonder = player.wonders.find((w) => w.id === action.wonderId);
    if (!playerWonder || playerWonder.isConstructed) {
      throw new Error('Wonder already constructed or not owned');
    }

    const wonder = WONDERS[action.wonderId];
    const costBreakdown = calculateCost(nextState, playerId, {
      type: 'wonder',
      wonder,
    });

    if (!costBreakdown.canAfford) {
      throw new Error('Cannot afford wonder');
    }

    // Deduct coins
    const totalCoinsPaid = costBreakdown.requiredCoins + costBreakdown.totalTradeCost;
    player.coins -= totalCoinsPaid;

    if (costBreakdown.totalTradeCost > 0 && opponent.progressTokens.includes(3)) {
      opponent.coins += costBreakdown.totalTradeCost;
      nextState.actionLog.push(
        `💰 Economy! ${opponent.name} gained ${costBreakdown.totalTradeCost} coins spent in trade.`
      );
    }

    // Tuck card under wonder
    card.isTaken = true;
    playerWonder.isConstructed = true;
    playerWonder.tuckedCardId = card.id;

    // Apply wonder effects
    if (wonder.coins) player.coins += wonder.coins;
    if (wonder.military) {
      applyMilitaryAdvance(nextState, playerId, wonder.military);
    }
    if (wonder.opponentCoinLoss) {
      const lost = Math.min(opponent.coins, wonder.opponentCoinLoss);
      opponent.coins -= lost;
      nextState.actionLog.push(`💸 ${opponent.name} lost ${lost} coins from ${wonder.name}.`);
    }

    // Extra Turn: Wonder has extraTurn OR player has Theology token (progress token 9)
    let grantsExtraTurn = !!wonder.extraTurn || player.progressTokens.includes(9);

    nextState.lastAction = {
      type: 'construct_wonder',
      playerId,
      playerName: player.name,
      wonderId: wonder.id,
      cardId: card.id,
      costPaid: totalCoinsPaid,
      description: `${player.name} constructed Wonder “${wonder.name}” using ${BUILDINGS[card.id]?.name}!`,
    };
    nextState.actionLog.push(nextState.lastAction.description);

    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);

    // Check supremacy victory
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === 'game_over') return nextState;

    // Special Wonder actions:
    // Great Library (pick 1 of 3 progress tokens from box)
    if (wonder.progressTokenFromBox && nextState.boxProgressTokens.length > 0) {
      nextState.currentPhase = 'choose_progress_token';
      nextState.pendingActionPlayerId = playerId;
      nextState.availableSelectionTokens = nextState.boxProgressTokens.slice(0, 3);
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }

    // Mausoleum (pick 1 from discard pile)
    if (wonder.discardBuildingTake && nextState.discardPile.length > 0) {
      nextState.currentPhase = 'choose_discarded_card';
      nextState.pendingActionPlayerId = playerId;
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }

    // Statue of Zeus (destroy opponent brown card)
    if (wonder.destroyOpponentBrown && opponent.buildings.some((id) => BUILDINGS[id]?.type === 'brown')) {
      nextState.currentPhase = 'destroy_opponent_card';
      nextState.pendingActionPlayerId = playerId;
      nextState.destroyCardColor = 'brown';
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }

    // Circus Maximus (destroy opponent grey card)
    if (wonder.destroyOpponentGrey && opponent.buildings.some((id) => BUILDINGS[id]?.type === 'grey')) {
      nextState.currentPhase = 'destroy_opponent_card';
      nextState.pendingActionPlayerId = playerId;
      nextState.destroyCardColor = 'grey';
      nextState.extraTurn = grantsExtraTurn;
      return nextState;
    }

    if (grantsExtraTurn) {
      nextState.actionLog.push(`⚡ Play Again! ${player.name} takes an immediate extra turn.`);
      // Active player stays the same!
      return nextState;
    }

    return advanceTurnOrAge(nextState);
  }

  // 5. CHOOSE PROGRESS TOKEN
  if (action.type === 'choose_progress_token') {
    if (nextState.currentPhase !== 'choose_progress_token') {
      throw new Error('Not in progress token selection phase');
    }
    const token = PROGRESS_TOKENS[action.tokenId];
    if (!token) throw new Error('Token not found');

    player.progressTokens.push(token.id);

    // If Law token: add scientific symbol 2
    if (token.scientificSymbol) {
      player.scienceSymbols.push(token.scientificSymbol);
    }
    // If Agriculture or Urbanism: gain immediate coins
    if (token.coins) {
      player.coins += token.coins;
    }

    // Remove from board or box
    nextState.boardProgressTokens = nextState.boardProgressTokens.filter((id) => id !== token.id);
    nextState.boxProgressTokens = nextState.boxProgressTokens.filter((id) => id !== token.id);

    nextState.actionLog.push(`${player.name} obtained Progress Token “${token.name}”.`);
    nextState.currentPhase = 'main_game';
    nextState.pendingActionPlayerId = undefined;
    nextState.availableSelectionTokens = undefined;

    // Check supremacy victory
    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === 'game_over') return nextState;

    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }

    return advanceTurnOrAge(nextState);
  }

  // 6. CHOOSE DISCARDED CARD (Mausoleum wonder)
  if (action.type === 'choose_discarded_card') {
    if (nextState.currentPhase !== 'choose_discarded_card') {
      throw new Error('Not in choose discarded card phase');
    }
    if (!nextState.discardPile.includes(action.cardId)) {
      throw new Error('Card not in discard pile');
    }

    const building = BUILDINGS[action.cardId];
    nextState.discardPile = nextState.discardPile.filter((id) => id !== action.cardId);
    player.buildings.push(building.id);

    if (building.coins > 0) player.coins += building.coins;
    if (building.military > 0) {
      let shields = building.military;
      if (player.progressTokens.includes(8)) shields += 1;
      applyMilitaryAdvance(nextState, playerId, shields);
    }
    if (building.scientificSymbol) {
      player.scienceSymbols.push(building.scientificSymbol);
    }

    nextState.actionLog.push(
      `🏛️ Mausoleum! ${player.name} retrieved “${building.name}” from the discard pile for free!`
    );

    nextState.currentPhase = 'main_game';
    nextState.pendingActionPlayerId = undefined;

    nextState = checkSupremacyVictory(nextState);
    if (nextState.currentPhase === 'game_over') return nextState;

    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }

    return advanceTurnOrAge(nextState);
  }

  // 7. DESTROY OPPONENT CARD (Statue of Zeus / Circus Maximus)
  if (action.type === 'destroy_opponent_card') {
    if (nextState.currentPhase !== 'destroy_opponent_card') {
      throw new Error('Not in destroy opponent card phase');
    }
    if (!opponent.buildings.includes(action.cardId)) {
      throw new Error('Opponent does not have this building');
    }

    const b = BUILDINGS[action.cardId];
    opponent.buildings = opponent.buildings.filter((id) => id !== action.cardId);
    nextState.discardPile.push(action.cardId);

    nextState.actionLog.push(`⚡ ${player.name} destroyed opponent’s “${b?.name}”!`);

    nextState.currentPhase = 'main_game';
    nextState.pendingActionPlayerId = undefined;
    nextState.destroyCardColor = undefined;

    if (nextState.extraTurn) {
      nextState.extraTurn = false;
      return nextState;
    }

    return advanceTurnOrAge(nextState);
  }

  // 8. CHOOSE START PLAYER FOR NEXT AGE
  if (action.type === 'choose_start_player') {
    if (nextState.currentPhase !== 'choose_start_player') {
      throw new Error('Not in choose start player phase');
    }
    nextState.activePlayerId = action.nextPlayerId;
    nextState.currentPhase = 'main_game';
    nextState.draftPool = generateAgeDraftPool(nextState.currentAge);
    nextState.draftPool = updateDraftPoolAvailability(nextState.draftPool);

    nextState.actionLog.push(
      `🏛️ Age ${nextState.currentAge === 2 ? 'II' : 'III'} starts! ${
        nextState.players[action.nextPlayerId].name
      } plays first.`
    );
    return nextState;
  }

  return nextState;
}

// Advance military pawn and check token triggers
function applyMilitaryAdvance(state: SWDGameState, playerId: string, shields: number) {
  const isPlayer1 = state.playerOrder[0] === playerId;
  const oldPos = state.conflictPawnPosition;
  const direction = isPlayer1 ? 1 : -1;
  const newPos = Math.max(-9, Math.min(9, oldPos + shields * direction));
  state.conflictPawnPosition = newPos;

  // Check military loss tokens
  const opponentId = isPlayer1 ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];

  state.militaryTokens.forEach((tok) => {
    if (!tok.isTaken) {
      // If moving toward positive (player 1 advancing into player 2 territory)
      if (isPlayer1 && oldPos < tok.position && newPos >= tok.position && tok.position > 0) {
        tok.isTaken = true;
        const loss = Math.min(opponent.coins, tok.value);
        opponent.coins -= loss;
        state.actionLog.push(
          `⚔️ Military Breakthrough! ${opponent.name} lost ${loss} coins (plunder token).`
        );
      }
      // If moving toward negative (player 2 advancing into player 1 territory)
      else if (!isPlayer1 && oldPos > tok.position && newPos <= tok.position && tok.position < 0) {
        tok.isTaken = true;
        const loss = Math.min(opponent.coins, tok.value);
        opponent.coins -= loss;
        state.actionLog.push(
          `⚔️ Military Breakthrough! ${opponent.name} lost ${loss} coins (plunder token).`
        );
      }
    }
  });
}

// Advance turn or age
function advanceTurnOrAge(state: SWDGameState): SWDGameState {
  const p1Id = state.playerOrder[0];
  const p2Id = state.playerOrder[1];

  // Check if draftpool is empty
  const remaining = state.draftPool.filter((c) => !c.isTaken);
  if (remaining.length === 0) {
    // Current Age completed!
    if (state.currentAge < 3) {
      state.currentAge += 1;
      // Weaker military player chooses who starts next Age.
      // If pawn > 0: player 2 is weaker. If pawn < 0: player 1 is weaker. If 0: active player chooses.
      let chooserId = state.activePlayerId;
      if (state.conflictPawnPosition > 0) {
        chooserId = p2Id;
      } else if (state.conflictPawnPosition < 0) {
        chooserId = p1Id;
      }

      state.currentPhase = 'choose_start_player';
      state.activePlayerId = chooserId;
      state.actionLog.push(
        `📜 End of Age ${state.currentAge - 1}! ${state.players[chooserId].name} chooses who plays first in Age ${
          state.currentAge === 2 ? 'II' : 'III'
        }.`
      );
      return state;
    } else {
      // Age 3 completed -> Civilian Victory!
      const scores = calculateFinalScores(state);
      const p1Score = scores[p1Id].total;
      const p2Score = scores[p2Id].total;

      let winnerId = p1Score > p2Score ? p1Id : p2Id;
      if (p1Score === p2Score) {
        // Tie breaker: most victory points on civilian (blue) cards
        winnerId = scores[p1Id].civilian >= scores[p2Id].civilian ? p1Id : p2Id;
      }

      state.currentPhase = 'game_over';
      state.winner = {
        userId: winnerId,
        reason: 'civilian',
        scores,
      };

      state.actionLog.push(
        `🏆 Game Over (Civilian Victory)! ${state.players[winnerId].name} wins (${p1Score} vs ${p2Score} VP)!`
      );
      return state;
    }
  }

  // Switch active player
  state.activePlayerId = state.activePlayerId === p1Id ? p2Id : p1Id;
  return state;
}
