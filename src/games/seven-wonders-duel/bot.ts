import {
  SWDGameState,
  SWDAction,
  DraftCard,
} from './types';
import {
  BUILDINGS,
  WONDERS,
  PROGRESS_TOKENS,
} from './constants';
import {
  calculateCost,
  isCardAvailable,
  calculateDiscardGain,
} from './engine';

export function computeBotMove(state: SWDGameState, botId: string): SWDAction | null {
  const bot = state.players[botId];
  if (!bot) return null;
  const opponentId = state.playerOrder[0] === botId ? state.playerOrder[1] : state.playerOrder[0];
  const opponent = state.players[opponentId];

  // 1. Wonder Drafting
  if (state.currentPhase === 'wonder_draft') {
    if (!state.wonderDraftPool || state.wonderDraftPool.length === 0) return null;

    // Rank wonders by strength
    const wonderPriority = [4, 8, 10, 7, 2, 1, 9, 12, 11, 3, 6, 5];
    const pool = [...state.wonderDraftPool];
    pool.sort((a, b) => {
      const pA = wonderPriority.indexOf(a);
      const pB = wonderPriority.indexOf(b);
      return (pA === -1 ? 99 : pA) - (pB === -1 ? 99 : pB);
    });

    return {
      type: 'draft_wonder',
      wonderId: pool[0],
    };
  }

  // 2. Choose start player for next age
  if (state.currentPhase === 'choose_start_player') {
    return {
      type: 'choose_start_player',
      nextPlayerId: botId, // Bot takes initiative!
    };
  }

  // 3. Choose progress token
  if (state.currentPhase === 'choose_progress_token') {
    const tokens = state.availableSelectionTokens || state.boardProgressTokens;
    if (tokens.length === 0) return null;

    // Law (4), Strategy (8), Philosophy (7), Agriculture (1), Urbanism (10), Architecture (2), Economy (3)
    const tokenRanking = [4, 8, 7, 1, 10, 2, 3, 5, 6, 9];
    const sorted = [...tokens].sort((a, b) => {
      const rA = tokenRanking.indexOf(a);
      const rB = tokenRanking.indexOf(b);
      return (rA === -1 ? 99 : rA) - (rB === -1 ? 99 : rB);
    });

    return {
      type: 'choose_progress_token',
      tokenId: sorted[0],
    };
  }

  // 4. Destroy opponent card (Zeus / Circus Maximus)
  if (state.currentPhase === 'destroy_opponent_card') {
    const targetColor = state.destroyCardColor || 'brown';
    const oppCards = opponent.buildings.filter((id) => BUILDINGS[id]?.type === targetColor);
    if (oppCards.length === 0) return null;
    // Destroy the one that produces the most resources or highest cost
    oppCards.sort((a, b) => (BUILDINGS[b]?.victoryPoints || 0) - (BUILDINGS[a]?.victoryPoints || 0));
    return {
      type: 'destroy_opponent_card',
      cardId: oppCards[0],
    };
  }

  // 5. Choose discarded card (Mausoleum)
  if (state.currentPhase === 'choose_discarded_card') {
    if (state.discardPile.length === 0) return null;
    const sorted = [...state.discardPile].sort((a, b) => {
      const bA = BUILDINGS[a];
      const bB = BUILDINGS[b];
      return (bB?.victoryPoints || 0) + (bB?.military || 0) * 3 - ((bA?.victoryPoints || 0) + (bA?.military || 0) * 3);
    });
    return {
      type: 'choose_discarded_card',
      cardId: sorted[0],
    };
  }

  // 6. Main Game Turn
  if (state.currentPhase !== 'main_game') return null;

  const availableDraftCards = state.draftPool.filter(
    (c) => !c.isTaken && isCardAvailable(c, state.draftPool)
  );

  if (availableDraftCards.length === 0) return null;

  interface CandidateAction {
    action: SWDAction;
    score: number;
    reason: string;
  }

  const candidates: CandidateAction[] = [];

  const unconstructedWonders = bot.wonders.filter((w) => !w.isConstructed);
  const totalWondersBuilt =
    state.players[state.playerOrder[0]].wonders.filter((w) => w.isConstructed).length +
    state.players[state.playerOrder[1]].wonders.filter((w) => w.isConstructed).length;

  for (const draftCard of availableDraftCards) {
    const building = BUILDINGS[draftCard.id];
    if (!building) continue;

    // --- Action A: Construct Building ---
    const buildCost = calculateCost(state, botId, {
      type: 'building',
      building,
    });

    if (buildCost.canAfford) {
      let score = 20;

      // Science symbol bonus
      if (building.scientificSymbol) {
        score += 25;
        // Check if this gives 6th symbol (Instant Win!)
        const uniqueSymbols = new Set(bot.scienceSymbols);
        uniqueSymbols.add(building.scientificSymbol);
        if (uniqueSymbols.size >= 6) {
          score += 1000; // Immediate Scientific Supremacy!
        }
        // Check if this gives a pair for Progress Token
        const count = bot.scienceSymbols.filter((s) => s === building.scientificSymbol).length;
        if (count === 1) score += 35;
      }

      // Military bonus
      if (building.military > 0) {
        let shields = building.military;
        if (bot.progressTokens.includes(8)) shields += 1;
        const currentPos = state.playerOrder[0] === botId ? state.conflictPawnPosition : -state.conflictPawnPosition;
        if (currentPos + shields >= 9) {
          score += 1000; // Immediate Military Supremacy!
        } else {
          score += shields * 18;
          // Crossing plunder token
          if (currentPos < 3 && currentPos + shields >= 3) score += 15;
          if (currentPos < 6 && currentPos + shields >= 6) score += 20;
        }
      }

      // Raw materials in Age 1
      if (state.currentAge === 1 && (building.type === 'brown' || building.type === 'grey')) {
        score += 30;
      }

      // Victory points
      score += building.victoryPoints * 6;

      // Free via chain
      if (buildCost.isFreeThroughLink) {
        score += 15;
      }

      // Deduct for coin cost
      const coinsPaid = buildCost.requiredCoins + buildCost.totalTradeCost;
      score -= coinsPaid * 1.5;

      candidates.push({
        action: { type: 'construct_building', cardId: draftCard.id },
        score,
        reason: `Construct ${building.name} (Score: ${Math.round(score)})`,
      });
    }

    // --- Action B: Construct Wonder ---
    if (totalWondersBuilt < 7 && unconstructedWonders.length > 0) {
      for (const pw of unconstructedWonders) {
        const wonder = WONDERS[pw.id];
        if (!wonder) continue;

        const wonderCost = calculateCost(state, botId, {
          type: 'wonder',
          wonder,
        });

        if (wonderCost.canAfford) {
          let score = 25;
          if (wonder.extraTurn || bot.progressTokens.includes(9)) score += 35;
          if (wonder.victoryPoints) score += wonder.victoryPoints * 5;
          if (wonder.military) score += wonder.military * 20;
          if (wonder.coins) score += wonder.coins * 2;
          if (wonder.opponentCoinLoss) score += wonder.opponentCoinLoss * 3;

          const coinsPaid = wonderCost.requiredCoins + wonderCost.totalTradeCost;
          score -= coinsPaid * 1.5;

          candidates.push({
            action: {
              type: 'construct_wonder',
              cardId: draftCard.id,
              wonderId: wonder.id,
            },
            score,
            reason: `Construct Wonder ${wonder.name} using ${building.name} (Score: ${Math.round(score)})`,
          });
        }
      }
    }

    // --- Action C: Discard Card for Coins ---
    const discardGain = calculateDiscardGain(bot);
    let discardScore = 5 + discardGain * 4;

    // If bot is very low on coins (< 3), incentivize discard
    if (bot.coins < 3) {
      discardScore += 25;
    }

    // Opponent denial: if this card is a dangerous military or science card for opponent
    if (building.scientificSymbol) {
      const oppUnique = new Set(opponent.scienceSymbols);
      oppUnique.add(building.scientificSymbol);
      if (oppUnique.size >= 6) {
        discardScore += 800; // Deny opponent science supremacy!
      }
    }
    if (building.military >= 2) {
      discardScore += 15;
    }

    candidates.push({
      action: { type: 'discard_card', cardId: draftCard.id },
      score: discardScore,
      reason: `Discard ${building.name} for +${discardGain} coins (Score: ${Math.round(discardScore)})`,
    });
  }

  if (candidates.length === 0) return null;

  // Pick highest scoring action
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].action;
}
