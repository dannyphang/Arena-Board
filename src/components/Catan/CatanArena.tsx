import React, { useState, useEffect, useRef } from 'react';
import {
  BUILDING_COSTS,
  DEV_CARD_NAMES,
  PLAYER_COLORS,
  RESOURCE_DETAILS,
} from '../../games/catan/constants';
import {
  acceptTradeOffer,
  buildCity,
  buildRoad,
  buildSettlement,
  buyDevCard,
  calculatePlayerLongestRoad,
  cancelTradeOffer,
  createInitialCatanGame,
  discardResources,
  endTurn,
  executeBotTurn,
  getPlayerPortRatios,
  moveRobber,
  playDevCard,
  proposeTradeOffer,
  botEvaluateTradeOffer,
  rollDice,
  tradeWithBank,
  updateSpecialAwards,
  shuffleCatanBoard,
} from '../../games/catan/engine';
import {
  CatanGameState,
  DevCardType,
  ResourceType,
} from '../../games/catan/types';
import { sounds } from '../../services/audio';
import { getSocket } from '../../services/socket';
import { TableRoom } from '../../types/lobby';
import { UserProfile } from '../../types/user';
import { InGameChat } from '../GeniusSquare/InGameChat';
import { CatanBoard } from './CatanBoard';
import {
  Trophy,
  Dices,
  RefreshCw,
  Home,
  Shield,
  Layers,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Coins,
  Check,
  Copy,
  Trash2,
  Plus,
  Bot,
  AlertTriangle,
  X,
  RotateCcw,
  Users,
  ArrowLeftRight,
  Send,
  Route,
  Castle,
  Anchor,
  Handshake,
  Compass,
  Gift,
  Globe,
  Lightbulb,
  Swords,
  User,
} from 'lucide-react';
import {
  ResourceIcon,
  DevCardIcon,
  BuildingIcon,
  AvatarSvg,
} from './CatanIcons';

interface CatanArenaProps {
  user: UserProfile;
  table: TableRoom | null;
  isSoloPractice?: boolean;
  soloTargetVictoryPoints?: number;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch: (timeSec: number, won: boolean) => void;
}

interface HarvestToast {
  id: string;
  resource: ResourceType;
  amount: number;
  playerName: string;
}

export const RESOURCE_THEMES: Record<
  ResourceType,
  {
    bg: string;
    border: string;
    activeBorder: string;
    text: string;
    icon: string;
    hexColor: string;
  }
> = {
  wood: {
    bg: 'bg-emerald-950/85',
    border: 'border-emerald-700/60',
    activeBorder: 'border-emerald-400',
    text: 'text-emerald-200',
    icon: 'text-emerald-400',
    hexColor: '#14532d',
  },
  brick: {
    bg: 'bg-red-950/85',
    border: 'border-red-700/60',
    activeBorder: 'border-red-400',
    text: 'text-red-200',
    icon: 'text-orange-400',
    hexColor: '#7c2d12',
  },
  sheep: {
    bg: 'bg-lime-950/85',
    border: 'border-lime-700/60',
    activeBorder: 'border-lime-400',
    text: 'text-lime-200',
    icon: 'text-lime-400',
    hexColor: '#365314',
  },
  wheat: {
    bg: 'bg-amber-950/85',
    border: 'border-amber-700/60',
    activeBorder: 'border-amber-400',
    text: 'text-amber-200',
    icon: 'text-yellow-400',
    hexColor: '#713f12',
  },
  ore: {
    bg: 'bg-slate-900/95',
    border: 'border-slate-700/70',
    activeBorder: 'border-slate-400',
    text: 'text-slate-200',
    icon: 'text-slate-300',
    hexColor: '#334155',
  },
};

export const CatanArena: React.FC<CatanArenaProps> = ({
  user,
  table,
  isSoloPractice = false,
  soloTargetVictoryPoints,
  onExit,
  onOpenRules,
  onRecordMatch,
}) => {
  const socket = getSocket();

  // Create initial game state for solo or multiplayer
  const [localGame, setLocalGame] = useState<CatanGameState>(() => {
    if (table?.catanState) {
      return table.catanState;
    }
    // Solo practice setup: User + 3 AI Bots (or table players)
    const configs = table
      ? table.players.map((p) => ({
          id: p.userId,
          name: p.username,
          avatar: p.avatar,
          isBot: !!p.isBot,
        }))
      : [
          { id: user.id, name: user.username, avatar: user.avatar, isBot: false },
          { id: 'bot_1', name: 'Knight Bot (AI)', avatar: 'robot', isBot: true },
          { id: 'bot_2', name: 'Settler Bot (AI)', avatar: 'compass', isBot: true },
          { id: 'bot_3', name: 'Merchant Bot (AI)', avatar: 'swords', isBot: true },
        ];
    const initialVP = table?.targetVictoryPoints || (soloTargetVictoryPoints || 10);
    return createInitialCatanGame(configs, initialVP);
  });

  // Sync with table.catanState whenever server state updates
  useEffect(() => {
    if (table?.catanState) {
      setLocalGame(table.catanState);
    }
  }, [table?.catanState]);

  const [copiedCode, setCopiedCode] = useState(false);
  const gameState = table?.catanState || localGame;
  const targetVP = gameState.targetVictoryPoints || table?.targetVictoryPoints || (soloTargetVictoryPoints || 10);
  const isHost = table ? table.hostId === user.id : true;
  const myPlayer = gameState.players.find((p) => p.id === user.id) || gameState.players[0];
  const activePlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = activePlayer?.id === myPlayer.id && !activePlayer.isBot;

  // Active build mode ('road', 'settlement', 'city', 'robber')
  const [buildMode, setBuildMode] = useState<'road' | 'settlement' | 'city' | 'robber' | null>(null);

  // Trade modal state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeModeTab, setTradeModeTab] = useState<'player' | 'bank'>('player');
  const [playerTradeGive, setPlayerTradeGive] = useState<Record<ResourceType, number>>({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  });
  const [playerTradeWant, setPlayerTradeWant] = useState<Record<ResourceType, number>>({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  });
  const [tradeTargetPlayerId, setTradeTargetPlayerId] = useState<string>('all');
  const [tradeGive, setTradeGive] = useState<ResourceType>('wood');
  const [tradeGet, setTradeGet] = useState<ResourceType>('brick');

  // Dev card modals state
  const [isYearOfPlentyOpen, setIsYearOfPlentyOpen] = useState(false);
  const [yopRes1, setYopRes1] = useState<ResourceType>('wheat');
  const [yopRes2, setYopRes2] = useState<ResourceType>('ore');
  const [isMonopolyOpen, setIsMonopolyOpen] = useState(false);
  const [monopolyRes, setMonopolyRes] = useState<ResourceType>('ore');

  // Animation states
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [animatedDice, setAnimatedDice] = useState<[number, number]>(gameState.diceRoll || [3, 4]);
  const [producingHexIds, setProducingHexIds] = useState<number[]>([]);
  const producingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [harvestToasts, setHarvestToasts] = useState<HarvestToast[]>([]);
  const [botActionText, setBotActionText] = useState<string>('');

  const triggerProducingHexesBlink = (total: number, hexes: typeof gameState.hexes) => {
    if (total === 7) {
      setProducingHexIds([]);
      return;
    }
    const hexIds = hexes
      .filter((h) => h.number === total && !h.hasRobber && h.terrain !== 'desert')
      .map((h) => h.id);
    setProducingHexIds(hexIds);
    if (producingTimeoutRef.current) clearTimeout(producingTimeoutRef.current);
    producingTimeoutRef.current = setTimeout(() => {
      setProducingHexIds([]);
    }, 4500);
  };

  // Discard modal state (for rolling 7 hand limit)
  const myDiscardRequirement = gameState.pendingDiscards?.find((d) => d.playerId === myPlayer.id);
  const [discardSelection, setDiscardSelection] = useState<Record<ResourceType, number>>({
    wood: 0,
    brick: 0,
    sheep: 0,
    wheat: 0,
    ore: 0,
  });

  // Keep animated dice synchronized with game state when not actively rolling & trigger harvest blink
  const lastBlinkedRollRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameState.diceRoll && !isRollingDice) {
      setAnimatedDice(gameState.diceRoll);
      const rollKey = `${gameState.diceRoll[0]}-${gameState.diceRoll[1]}-${gameState.currentTurnIndex}-${gameState.turnPhase}`;
      if (lastBlinkedRollRef.current !== rollKey) {
        lastBlinkedRollRef.current = rollKey;
        const total = gameState.diceRoll[0] + gameState.diceRoll[1];
        if (total !== 7) {
          triggerProducingHexesBlink(total, gameState.hexes);
        }
      }
    }
  }, [gameState.diceRoll, isRollingDice, gameState.hexes, gameState.currentTurnIndex, gameState.turnPhase]);

  // Synchronize state locally and broadcast if online
  const updateGameState = (next: CatanGameState) => {
    setLocalGame(next);
    if (table) {
      socket.emit('catan:action', { tableId: table.id, gameState: next });
    }
  };

  // Keyboard shortcut: Esc -> close modals / cancel active build mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTradeModalOpen) setIsTradeModalOpen(false);
        else if (isYearOfPlentyOpen) setIsYearOfPlentyOpen(false);
        else if (isMonopolyOpen) setIsMonopolyOpen(false);
        else if (buildMode !== null) setBuildMode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTradeModalOpen, isYearOfPlentyOpen, isMonopolyOpen, buildMode]);

  // Shuffle board layout
  const handleShuffleBoard = () => {
    sounds.playDiceRoll();
    const next = shuffleCatanBoard(gameState);
    updateGameState(next);
  };

  // Starting resources harvest effect (blinks hexes touching 2nd settlement and shows toasts)
  const lastStartingHarvestRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      gameState.lastStartingHarvest &&
      gameState.lastStartingHarvest.timestamp !== lastStartingHarvestRef.current
    ) {
      lastStartingHarvestRef.current = gameState.lastStartingHarvest.timestamp;
      const { playerId, hexIds, resources } = gameState.lastStartingHarvest;
      const player = gameState.players.find((p) => p.id === playerId);
      if (hexIds && hexIds.length > 0) {
        setProducingHexIds(hexIds);
        if (producingTimeoutRef.current) clearTimeout(producingTimeoutRef.current);
        producingTimeoutRef.current = setTimeout(() => {
          setProducingHexIds([]);
        }, 4500);
      }
      if (resources && resources.length > 0 && player) {
        const newToasts: HarvestToast[] = resources.map((res) => ({
          id: `toast_start_${Date.now()}_${Math.random()}`,
          resource: res,
          amount: 1,
          playerName: `${player.name} (Starting Bonus)`,
        }));
        setHarvestToasts((prev) => [...prev, ...newToasts]);
        setTimeout(() => {
          setHarvestToasts((prev) => prev.slice(newToasts.length));
        }, 3500);
      }
    }
  }, [gameState.lastStartingHarvest, gameState.players]);

  // Roll dice animation helper
  const triggerDiceRoll = (overrideRoll?: () => CatanGameState) => {
    if (isRollingDice) return;
    setIsRollingDice(true);
    sounds.playDiceRoll();

    let count = 0;
    const interval = setInterval(() => {
      setAnimatedDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const nextState = overrideRoll ? overrideRoll() : rollDice(gameState);
        setIsRollingDice(false);
        if (nextState.diceRoll) {
          setAnimatedDice(nextState.diceRoll);
        }
        sounds.playSnap();

        // Check if resources were harvested (non-7)
        if (nextState.diceRoll) {
          const total = nextState.diceRoll[0] + nextState.diceRoll[1];
          if (total !== 7) {
            triggerProducingHexesBlink(total, nextState.hexes);
            const producingHexes = nextState.hexes.filter(
              (h) => h.number === total && !h.hasRobber && h.terrain !== 'desert'
            );
            const newToasts: HarvestToast[] = [];
            producingHexes.forEach((h) => {
              const res = h.terrain as ResourceType;
              nextState.vertices.forEach((v) => {
                if (v.owner && v.hexIds.includes(h.id)) {
                  const p = nextState.players.find((pl) => pl.id === v.owner);
                  if (p) {
                    newToasts.push({
                      id: `toast_${Date.now()}_${Math.random()}`,
                      resource: res,
                      amount: v.type === 'city' ? 2 : 1,
                      playerName: p.name,
                    });
                  }
                }
              });
            });
            if (newToasts.length > 0) {
              setHarvestToasts((prev) => [...prev, ...newToasts]);
              setTimeout(() => {
                setHarvestToasts((prev) => prev.slice(newToasts.length));
              }, 2800);
            }
          }
        }

        updateGameState(nextState);
      }
    }, 85);
  };

  // Bot Turn Automation Effect: Paced realistically so human players can follow along
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (
      activePlayer?.isBot &&
      !gameState.winnerId &&
      gameState.turnPhase !== 'robber-discard' &&
      (isHost || isSoloPractice)
    ) {
      if (gameState.turnPhase === 'setup-settlement-1') {
        setBotActionText(`${activePlayer.name} is choosing 1st Settlement location...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1200);
      } else if (gameState.turnPhase === 'setup-road-1') {
        setBotActionText(`${activePlayer.name} is placing 1st Road...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1100);
      } else if (gameState.turnPhase === 'setup-settlement-2') {
        setBotActionText(`${activePlayer.name} is placing 2nd Settlement (collects starting resources)...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1300);
      } else if (gameState.turnPhase === 'setup-road-2') {
        setBotActionText(`${activePlayer.name} is placing 2nd Road...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1100);
      } else if (gameState.turnPhase === 'roll') {
        setBotActionText(`${activePlayer.name} is preparing to roll...`);
        botTimerRef.current = setTimeout(() => {
          triggerDiceRoll(() => rollDice(gameState));
        }, 1200);
      } else if (gameState.turnPhase === 'robber-move') {
        setBotActionText(`${activePlayer.name} is choosing where to move the Robber...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1500);
      } else {
        setBotActionText(`${activePlayer.name} is considering actions...`);
        botTimerRef.current = setTimeout(() => {
          const next = executeBotTurn(gameState);
          setBotActionText('');
          updateGameState(next);
        }, 1400);
      }
    } else {
      setBotActionText('');
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState, activePlayer, isHost, isSoloPractice]);

  // Handle vertex click
  const handleSelectVertex = (vertexId: number) => {
    if (
      gameState.turnPhase === 'setup-settlement-1' ||
      gameState.turnPhase === 'setup-settlement-2' ||
      buildMode === 'settlement'
    ) {
      sounds.playSnap();
      const next = buildSettlement(gameState, vertexId);
      setBuildMode(null);
      updateGameState(next);
    } else if (buildMode === 'city') {
      sounds.playSnap();
      const next = buildCity(gameState, vertexId);
      setBuildMode(null);
      updateGameState(next);
    }
  };

  // Handle edge click
  const handleSelectEdge = (edgeId: number) => {
    const hasFreeRoads = Boolean(gameState.freeRoadsRemaining && gameState.freeRoadsRemaining > 0);
    if (
      gameState.turnPhase === 'setup-road-1' ||
      gameState.turnPhase === 'setup-road-2' ||
      buildMode === 'road' ||
      (gameState.turnPhase === 'main' && hasFreeRoads)
    ) {
      sounds.playSnap();
      const next = buildRoad(gameState, edgeId);
      const nextMyPlayer = next.players.find((p) => p.id === myPlayer.id);
      if (next.freeRoadsRemaining && next.freeRoadsRemaining > 0 && nextMyPlayer && nextMyPlayer.roadsLeft > 0) {
        setBuildMode('road');
      } else {
        setBuildMode(null);
      }
      updateGameState(next);
    }
  };

  // Handle hex click for robber
  const handleSelectHex = (hexId: number) => {
    if (gameState.turnPhase === 'robber-move' || buildMode === 'robber') {
      sounds.playSnap();
      const next = moveRobber(gameState, hexId);
      setBuildMode(null);
      updateGameState(next);
    }
  };

  // Roll dice trigger for human
  const handleRollDice = () => {
    triggerDiceRoll();
  };

  // Buy Dev Card
  const handleBuyDevCard = () => {
    sounds.playSnap();
    const next = buyDevCard(gameState);
    updateGameState(next);
  };

  // Play Dev Card
  const handlePlayDevCard = (
    type: DevCardType,
    options?: {
      monopolyResource?: ResourceType;
      yearOfPlentyResources?: [ResourceType, ResourceType];
    }
  ) => {
    sounds.playSnap();
    if (type === 'yearOfPlenty' && !options?.yearOfPlentyResources) {
      setIsYearOfPlentyOpen(true);
      return;
    }
    if (type === 'monopoly' && !options?.monopolyResource) {
      setIsMonopolyOpen(true);
      return;
    }
    const next = playDevCard(gameState, type, options, myPlayer.id);
    if (type === 'roadBuilding') {
      setBuildMode('road');
    }
    updateGameState(next);
  };

  // Auto-activate road placement mode when free roads remain from Road Building dev card
  useEffect(() => {
    if (
      isMyTurn &&
      gameState.turnPhase === 'main' &&
      gameState.freeRoadsRemaining !== undefined &&
      gameState.freeRoadsRemaining > 0 &&
      myPlayer.roadsLeft > 0
    ) {
      setBuildMode('road');
    }
  }, [gameState.freeRoadsRemaining, gameState.turnPhase, isMyTurn, myPlayer.roadsLeft]);

  // Auto-sync special awards (Longest Road & Largest Army) on initial load or edge changes
  useEffect(() => {
    const next = updateSpecialAwards(gameState);
    if (
      next.longestRoadPlayerId !== gameState.longestRoadPlayerId ||
      next.longestRoadLength !== gameState.longestRoadLength ||
      next.largestArmyPlayerId !== gameState.largestArmyPlayerId ||
      next.largestArmyCount !== gameState.largestArmyCount ||
      next.players.some((p, i) => p.victoryPoints !== gameState.players[i]?.victoryPoints)
    ) {
      updateGameState(next);
    }
  }, [gameState.edges, gameState.players]);

  // End turn
  const handleEndTurn = () => {
    sounds.playPop();
    setBuildMode(null);
    const next = endTurn(gameState);
    updateGameState(next);
  };

  // Player-to-Player / Bot Trade execution
  const handleProposePlayerTrade = () => {
    const totalGive = Object.values(playerTradeGive).reduce((sum, c) => sum + c, 0);
    const totalWant = Object.values(playerTradeWant).reduce((sum, c) => sum + c, 0);
    if (totalGive === 0 || totalWant === 0) return;

    sounds.playSnap();
    const next = proposeTradeOffer(gameState, {
      fromPlayerId: myPlayer.id,
      fromPlayerName: myPlayer.name,
      toPlayerId: tradeTargetPlayerId === 'all' ? undefined : tradeTargetPlayerId,
      give: playerTradeGive,
      want: playerTradeWant,
    });
    updateGameState(next);
    setIsTradeModalOpen(false);
  };

  const handleCancelTradeOffer = () => {
    sounds.playPop();
    const next = cancelTradeOffer(gameState, myPlayer.id);
    updateGameState(next);
  };

  const handleAcceptTradeOffer = () => {
    if (!gameState.tradeOffer) return;
    sounds.playSnap();
    const next = acceptTradeOffer(gameState, myPlayer.id);
    updateGameState(next);
  };

  // Bot Trade Evaluation Effect: automatically evaluate human proposals and accept if beneficial
  useEffect(() => {
    if (!gameState.tradeOffer || gameState.winnerId) return;
    if (!isHost && !isSoloPractice) return;

    const offer = gameState.tradeOffer;
    const eligibleBots = gameState.players.filter(
      (p) =>
        p.isBot &&
        p.id !== offer.fromPlayerId &&
        (!offer.toPlayerId || offer.toPlayerId === 'all' || offer.toPlayerId === p.id)
    );

    if (eligibleBots.length === 0) return;

    const timer = setTimeout(() => {
      for (const bot of eligibleBots) {
        if (botEvaluateTradeOffer(gameState, bot.id)) {
          sounds.playSnap();
          const next = acceptTradeOffer(gameState, bot.id);
          updateGameState(next);
          break;
        }
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [gameState.tradeOffer, isHost, isSoloPractice]);

  // Port & Bank Trade execution
  const playerPortRatios = getPlayerPortRatios(gameState, myPlayer.id);
  const activeTradeRatio = playerPortRatios[tradeGive] || 4;

  const handleExecuteTrade = () => {
    sounds.playSnap();
    const next = tradeWithBank(gameState, tradeGive, tradeGet, activeTradeRatio, myPlayer.id);
    updateGameState(next);
    setIsTradeModalOpen(false);
  };

  // Discard confirmation for 7 roll
  const totalDiscardSelected = (Object.values(discardSelection) as number[]).reduce(
    (sum, c) => sum + c,
    0
  );

  const handleConfirmDiscard = () => {
    if (!myDiscardRequirement || totalDiscardSelected !== myDiscardRequirement.count) return;
    sounds.playSnap();
    const next = discardResources(gameState, myPlayer.id, discardSelection);
    setDiscardSelection({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    updateGameState(next);
  };

  // Record win
  useEffect(() => {
    if (gameState.winnerId) {
      sounds.playVictory();
      const isWinner = gameState.winnerId === myPlayer.id;
      onRecordMatch(600, isWinner);
    }
  }, [gameState.winnerId]);

  // Restart match (Play Again)
  const handlePlayAgain = () => {
    sounds.playPop();
    const configs = table
      ? table.players.map((p) => ({
          id: p.userId,
          name: p.username,
          avatar: p.avatar,
          isBot: !!p.isBot,
        }))
      : [
          { id: user.id, name: user.username, avatar: user.avatar, isBot: false },
          { id: 'bot_1', name: 'Knight Bot (AI)', avatar: 'robot', isBot: true },
          { id: 'bot_2', name: 'Settler Bot (AI)', avatar: 'compass', isBot: true },
          { id: 'bot_3', name: 'Merchant Bot (AI)', avatar: 'swords', isBot: true },
        ];
    const newGame = createInitialCatanGame(configs, targetVP);
    setBuildMode(null);
    setBotActionText('');
    setHarvestToasts([]);
    setIsTradeModalOpen(false);
    setIsYearOfPlentyOpen(false);
    setIsMonopolyOpen(false);
    updateGameState(newGame);
  };

  // If table is waiting for players (Lobby view)
  if (table && table.status === 'waiting') {
    const canStart = table.players.length >= 2 && isHost;
    const maxSeats = table.maxPlayers || 4;
    const openSeatsCount = Math.max(0, maxSeats - table.players.length);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-slate-100 font-['Outfit']">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-7 h-7 text-amber-400" />
                <h2 className="text-2xl font-black font-['Fredoka'] text-slate-100">
                  {table.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lobby
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The Settlers of Catan • Target: <strong className="text-amber-400">{targetVP} VP</strong> • {table.players.length} / {maxSeats} Players Joined
              </p>
            </div>

            {table.roomCode && (
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-left pl-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    Invite Code
                  </div>
                  <div className="font-mono font-black text-amber-400 text-sm tracking-wider">
                    {table.roomCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(table.roomCode || '');
                    setCopiedCode(true);
                    sounds.playPop();
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Copy room code"
                >
                  {copiedCode ? (
                    <span className="text-emerald-400 text-xs font-bold">Copied!</span>
                  ) : (
                    <span className="text-slate-300 text-xs font-semibold">Copy</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Player Seats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {table.players.map((p) => (
              <div
                key={p.userId}
                className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shadow-inner">
                    <AvatarSvg avatar={p.avatar} size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{p.username}</span>
                      {p.isHost && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                          HOST
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                          BOT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.isBot ? 'Computer Bot' : `${p.rating || 1200} ELO`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    Ready
                  </span>
                  {/* Host can remove any player or bot */}
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => {
                        sounds.playPop();
                        socket.emit('table:remove_player', {
                          tableId: table.id,
                          userId: p.userId,
                        });
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer"
                      title="Remove player or bot from table"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty Waiting Seats with + Add Bot option */}
            {Array.from({ length: openSeatsCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-slate-950/40 border border-dashed border-slate-800 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-400">
                      Open Seat {table.players.length + i + 1}
                    </div>
                    <div className="text-[11px] text-slate-500">Waiting for player or bot</div>
                  </div>
                </div>

                {isHost && (
                  <button
                    onClick={() => {
                      sounds.playPop();
                      socket.emit('table:add_bot', {
                        tableId: table.id,
                        difficulty: 'intermediate',
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Add AI Bot to this seat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <Bot className="w-3.5 h-3.5" />
                    Add Bot
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Leave Lobby
            </button>

            {isHost && (
              <button
                disabled={!canStart}
                onClick={() => {
                  sounds.playSnap();
                  socket.emit('table:start', { tableId: table.id });
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center gap-2"
              >
                Start Game ({table.players.length} Players)
              </button>
            )}
          </div>
        </div>

        {/* In-Game Lobby Chat */}
        <InGameChat
          messages={table.messages || []}
          currentUserId={user.id}
          onSendMessage={(text) => socket.emit('table:chat', { tableId: table.id, text })}
        />
      </div>
    );
  }

  const diceSum = animatedDice[0] + animatedDice[1];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 text-slate-100 font-['Outfit'] select-none relative">
      {/* Floating Resource Harvest Notifications */}
      {harvestToasts.length > 0 && (
        <div className="fixed top-20 right-8 z-40 space-y-2 pointer-events-none">
          {harvestToasts.map((toast) => (
            <div
              key={toast.id}
              className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-amber-500/40 text-amber-200 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce"
            >
              <ResourceIcon type={toast.resource} size={16} />
              <span>
                +{toast.amount} {RESOURCE_DETAILS[toast.resource].name.split(' ')[0]} →{' '}
                <strong className="text-white">{toast.playerName}</strong>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 1. Header Toolbar (Dice display REMOVED per user request) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-emerald-700 flex items-center justify-center text-amber-200 shadow-md border border-amber-500/30">
            <Compass className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black font-['Fredoka'] text-slate-100">
                The Settlers of Catan
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                Target: 10 VP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Harvest resources, pave roads, found settlements, and trade with harbors
            </p>
          </div>
        </div>

        {/* Turn Phase Indicator */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-900 rounded-lg text-amber-400">
              <AvatarSvg avatar={activePlayer?.avatar} size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    PLAYER_COLORS[activePlayer?.color]?.bg || 'bg-amber-400'
                  }`}
                />
                {activePlayer?.name}
                {isMyTurn && <span className="text-amber-400 font-black">(Your Turn)</span>}
              </div>
              <div className="text-[10px] text-amber-300 font-medium">
                Phase:{' '}
                {gameState.turnPhase === 'setup-settlement-1'
                  ? 'Snake Draft R1: 1st Settlement'
                  : gameState.turnPhase === 'setup-road-1'
                  ? 'Snake Draft R1: 1st Road'
                  : gameState.turnPhase === 'setup-settlement-2'
                  ? 'Snake Draft R2: 2nd Settlement (Starting Hand)'
                  : gameState.turnPhase === 'setup-road-2'
                  ? 'Snake Draft R2: 2nd Road'
                  : gameState.turnPhase === 'roll'
                  ? 'Roll Dice'
                  : gameState.turnPhase === 'robber-discard'
                  ? 'Robber: Hand Limit Discard'
                  : gameState.turnPhase === 'robber-move'
                  ? 'Robber: Relocate'
                  : gameState.turnPhase.replace(/-/g, ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Shuffle Board Button */}
          <button
            onClick={handleShuffleBoard}
            className="p-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Shuffle Board Terrains and Numbers"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Shuffle Board</span>
          </button>

          <button
            onClick={() => {
              sounds.playPop();
              onOpenRules();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            onClick={onExit}
            className="p-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold transition cursor-pointer"
          >
            Exit Table
          </button>
        </div>
      </div>

      {/* 2. Horizontal Colony Standings Bar Above Game Board */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 font-['Fredoka']">
              Colony Standings
            </h3>
            <span className="text-[10px] text-slate-400 hidden sm:inline">• {targetVP} Victory Points to Win</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {gameState.longestRoadPlayerId && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Route className="w-3.5 h-3.5 inline" /> Longest Road: {gameState.players.find((p) => p.id === gameState.longestRoadPlayerId)?.name}
              </span>
            )}
            {gameState.largestArmyPlayerId && (
              <span className="text-purple-400 font-semibold flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 inline" /> Largest Army: {gameState.players.find((p) => p.id === gameState.largestArmyPlayerId)?.name}
              </span>
            )}
          </div>
        </div>

        {/* Horizontal Player Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {gameState.players.map((p, idx) => {
            const isCurrent = idx === gameState.currentTurnIndex;
            const totalCards = (Object.values(p.resources) as number[]).reduce((a, b) => a + b, 0);
            const isLongestRoad = gameState.longestRoadPlayerId === p.id;
            const isLargestArmy = gameState.largestArmyPlayerId === p.id;

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border transition relative overflow-hidden ${
                  isCurrent
                    ? 'bg-slate-800/95 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Active Turn Indicator Strip */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 animate-pulse" />
                )}

                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-slate-900 rounded-lg shrink-0 text-slate-300">
                      <AvatarSvg avatar={p.avatar} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${PLAYER_COLORS[p.color]?.bg}`} />
                        <span className="truncate">{p.name}</span>
                        {p.id === myPlayer.id && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {totalCards}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Swords className="w-3 h-3 text-slate-400" />
                          {p.playedKnights}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Victory Points */}
                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end gap-0.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>{p.victoryPoints}</span>
                      <span className="text-[10px] text-amber-300/80 font-normal">VP</span>
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center justify-end gap-1.5">
                      <span className="flex items-center gap-0.5">
                        <Home className="w-2.5 h-2.5 text-slate-400" />
                        {5 - p.settlementsLeft}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Castle className="w-2.5 h-2.5 text-slate-400" />
                        {4 - p.citiesLeft}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Achievements Badges */}
                {(isLongestRoad || isLargestArmy) && (
                  <div className="mt-1 pt-1 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                    {isLongestRoad && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <Route className="w-2.5 h-2.5 text-amber-400" /> Road (2 VP)
                      </span>
                    )}
                    {isLargestArmy && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                        <Swords className="w-2.5 h-2.5 text-purple-400" /> Army (2 VP)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Game Layout: Board + Beside-Board Dice Console (Left) & Player Hands + Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: The Hex Board with Embedded Dice Rolling Console */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Active Player-to-Player / Bot Trade Offer Banner */}
            {gameState.tradeOffer && (() => {
              const offer = gameState.tradeOffer;
              const proposer = gameState.players.find((p) => p.id === offer.fromPlayerId);
              const isMyOffer = offer.fromPlayerId === myPlayer.id;
              const isTargetedToMe = !offer.toPlayerId || offer.toPlayerId === 'all' || offer.toPlayerId === myPlayer.id;

              const giveEntries = (Object.entries(offer.give) as [ResourceType, number][]).filter(([_, c]) => (c || 0) > 0);
              const wantEntries = (Object.entries(offer.want) as [ResourceType, number][]).filter(([_, c]) => (c || 0) > 0);

              const canAfford = wantEntries.every(([res, count]) => myPlayer.resources[res] >= (count || 0));

              return (
                <div className="w-full mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900/95 to-indigo-950/90 border-2 border-blue-500/60 shadow-2xl backdrop-blur animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Handshake className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-300 font-['Fredoka']">
                            {isMyOffer ? 'Your Active Trade Proposal' : `${proposer?.name || 'Player'} Proposed a Trade Deal`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30 font-semibold">
                            {offer.toPlayerId && offer.toPlayerId !== 'all' ? 'Targeted' : 'Open to All'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-200 flex-wrap">
                          <span className="text-slate-400">{isMyOffer ? 'Offering:' : 'You Receive:'}</span>
                          <div className="flex items-center gap-1.5 font-bold text-amber-300">
                            {giveEntries.map(([res, count]) => (
                              <span key={res} className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                                <ResourceIcon type={res} size={13} className="text-amber-300" />
                                <span>{count} {res}</span>
                              </span>
                            ))}
                          </div>

                          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 inline mx-1" />

                          <span className="text-slate-400">{isMyOffer ? 'Requesting:' : 'You Give:'}</span>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                            {wantEntries.map(([res, count]) => (
                              <span key={res} className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                                <ResourceIcon type={res} size={13} className="text-emerald-300" />
                                <span>{count} {res}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {isMyOffer ? (
                        <button
                          onClick={handleCancelTradeOffer}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Cancel Offer
                        </button>
                      ) : isTargetedToMe ? (
                        <button
                          disabled={!canAfford}
                          onClick={handleAcceptTradeOffer}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          {canAfford ? 'Accept Trade Deal' : 'Need More Cards'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Snake Draft Setup Phase Banner */}
            {gameState.turnPhase.startsWith('setup') && (
              <div className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 border border-amber-500/30 shadow-lg backdrop-blur space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-slate-800 text-amber-400">
                      {gameState.turnPhase === 'setup-settlement-2' ? (
                        <Gift className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider font-['Fredoka']">
                        {gameState.turnPhase === 'setup-settlement-1'
                          ? 'Snake Draft — Round 1: Place 1st Settlement'
                          : gameState.turnPhase === 'setup-road-1'
                          ? 'Snake Draft — Round 1: Place 1st Road'
                          : gameState.turnPhase === 'setup-settlement-2'
                          ? 'Snake Draft — Round 2: Place 2nd Settlement (Take Starting Hand!)'
                          : 'Snake Draft — Round 2: Place 2nd Road'}
                      </span>
                      <p className="text-[11px] text-slate-300">
                        {isMyTurn ? (
                          gameState.turnPhase === 'setup-settlement-1' ? (
                            <span>Click any open intersection dot to place your 1st settlement. Distance rule: no adjacent settlements.</span>
                          ) : gameState.turnPhase === 'setup-road-1' ? (
                            <span>Click a highlighted path connected to your 1st settlement to place your road.</span>
                          ) : gameState.turnPhase === 'setup-settlement-2' ? (
                            <span className="text-amber-200 font-semibold">
                              Click an open intersection! You immediately collect 1 resource card for every land tile touching it. Hover to preview!
                            </span>
                          ) : (
                            <span>Click a highlighted path connected to your 2nd settlement to complete your setup.</span>
                          )
                        ) : (
                          <span>
                            {activePlayer?.name} is {gameState.turnPhase.includes('settlement') ? 'choosing a settlement location' : 'placing a road'}...
                            {gameState.turnPhase === 'setup-settlement-2' && ' (they take starting resources touching it)'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Round 1 / Round 2 indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        gameState.turnPhase.includes('1')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Round 1 (1 → {gameState.players.length})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        gameState.turnPhase.includes('2')
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Round 2 ({gameState.players.length} → 1 + Bonus Hand)
                    </span>
                  </div>
                </div>

                {/* Snake Order Turn Tracker Trail */}
                <div className="flex items-center justify-between gap-1 overflow-x-auto py-0.5 scrollbar-none">
                  {(() => {
                    const isRound1 = gameState.turnPhase.includes('1');
                    const draftOrder = isRound1
                      ? gameState.players.map((p, idx) => ({ player: p, index: idx }))
                      : [...gameState.players.map((p, idx) => ({ player: p, index: idx }))].reverse();

                    return draftOrder.map((item, oIdx) => {
                      const isCurrent = item.index === gameState.currentTurnIndex;

                      return (
                        <div
                          key={item.player.id + '-' + oIdx}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition border shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-sm'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <AvatarSvg avatar={item.player.avatar} size={14} className="shrink-0" />
                          <span className="font-bold text-[11px] truncate max-w-[85px]">
                            {item.player.name}
                          </span>
                          {item.player.id === myPlayer.id && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">
                              You
                            </span>
                          )}
                          {isCurrent && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Free Roads from Road Building Banner */}
            {gameState.freeRoadsRemaining !== undefined && gameState.freeRoadsRemaining > 0 && (
              <div className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/25 to-amber-500/20 border border-amber-400/50 shadow-lg text-amber-200 text-xs flex items-center justify-between backdrop-blur animate-in fade-in">
                <span className="font-bold flex items-center gap-2">
                  <Route className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Road Building Active: <strong>{gameState.freeRoadsRemaining} free road(s) remaining</strong>! Click any valid highlighted path to place free of charge.
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                  FREE
                </span>
              </div>
            )}

            {/* Active Build Prompt Banner */}
            {(buildMode || (gameState.freeRoadsRemaining !== undefined && gameState.freeRoadsRemaining > 0)) && (
              <div className="absolute top-4 left-4 right-4 z-10 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between backdrop-blur animate-in fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  {gameState.freeRoadsRemaining && gameState.freeRoadsRemaining > 0
                    ? `Road Building Dev Card: Click a highlighted path to place Free Road #${3 - gameState.freeRoadsRemaining} of 2`
                    : `Select a highlighted ${buildMode === 'road' ? 'path to place a Road' : 'intersection to build'}`}
                </span>
                {(!gameState.freeRoadsRemaining || gameState.freeRoadsRemaining <= 0) && (
                  <button
                    onClick={() => setBuildMode(null)}
                    className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-bold hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {/* The SVG Catan Board */}
            <CatanBoard
              state={gameState}
              myPlayerId={myPlayer.id}
              activeBuildMode={buildMode}
              producingHexIds={producingHexIds}
              onSelectVertex={handleSelectVertex}
              onSelectEdge={handleSelectEdge}
              onSelectHex={handleSelectHex}
            />

            {/* DICE ROLLING ANIMATION & ACTION CONSOLE INSIDE THIS BOARD DIV */}
            <div className="w-full mt-2 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/70 border border-slate-800/60 rounded-xl p-3.5 shadow-xl backdrop-blur-sm z-10">
              {/* Left: 3D Animated Dice Result */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {/* Die 1 */}
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-stone-200 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-300/80 transition-all ${
                      isRollingDice ? 'animate-bounce scale-110 rotate-12' : 'hover:scale-105'
                    }`}
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {animatedDice[0]}
                  </div>

                  <span className="text-lg font-black text-slate-500">+</span>

                  {/* Die 2 */}
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-stone-200 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-amber-300/80 transition-all ${
                      isRollingDice ? 'animate-bounce scale-110 -rotate-12' : 'hover:scale-105'
                    }`}
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {animatedDice[1]}
                  </div>
                </div>

                {/* Total Roll Callout */}
                <div className="pl-3 border-l border-slate-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {isRollingDice ? 'Rolling...' : 'Dice Roll'}
                  </div>
                  <div className="text-xl font-black text-amber-400 flex items-center gap-1.5 font-['Fredoka']">
                    <span>=</span>
                    <span className={diceSum === 7 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}>
                      {diceSum}
                    </span>
                    {diceSum === 7 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wide font-sans">
                        Robber
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Bot Status or Phase Tip */}
              <div className="text-center sm:text-left flex-1 px-2">
                {botActionText ? (
                  <div className="text-xs text-purple-300 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    {botActionText}
                  </div>
                ) : gameState.turnPhase === 'robber-move' ? (
                  <div className="text-xs text-rose-300 font-bold flex items-center justify-center sm:justify-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    Robber is jumping! Click any hex to relocate robber.
                  </div>
                ) : gameState.turnPhase.startsWith('setup') ? (
                  <div className="text-xs text-amber-300 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {isMyTurn
                        ? gameState.turnPhase === 'setup-settlement-1'
                          ? 'Click an open intersection for your 1st Settlement.'
                          : gameState.turnPhase === 'setup-road-1'
                          ? 'Click a highlighted path connected to Settlement 1.'
                          : gameState.turnPhase === 'setup-settlement-2'
                          ? 'Place 2nd Settlement: collect starting cards touching it!'
                          : 'Click a highlighted path connected to Settlement 2.'
                        : `${activePlayer.name}'s turn in the snake draft.`}
                    </span>
                  </div>
                ) : gameState.freeRoadsRemaining && gameState.freeRoadsRemaining > 0 ? (
                  <div className="text-xs text-amber-300 font-bold flex items-center justify-center sm:justify-start gap-1.5 animate-pulse">
                    <Route className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {isMyTurn
                        ? `Road Building Dev Card: Click a highlighted path to place Free Road #${3 - gameState.freeRoadsRemaining} of 2!`
                        : `${activePlayer?.name || 'Player'} is placing free roads (${gameState.freeRoadsRemaining} remaining)...`}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    {isMyTurn ? 'Your turn: Trade with harbors, build, or end turn.' : 'Waiting for opponent...'}
                  </div>
                )}
              </div>

              {/* Right: Roll / End Turn Action Buttons directly inside board container */}
              {isMyTurn && (
                <div className="flex items-center gap-2">
                  {gameState.freeRoadsRemaining && gameState.freeRoadsRemaining > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 animate-pulse">
                      <Route className="w-3.5 h-3.5 text-amber-400" />
                      <span>Free Road {3 - gameState.freeRoadsRemaining}/2</span>
                    </div>
                  )}
                  {gameState.turnPhase.startsWith('setup') && (
                    <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                      {gameState.turnPhase.includes('settlement') ? (
                        <>
                          <Home className="w-3.5 h-3.5" />
                          <span>Select Intersection</span>
                        </>
                      ) : (
                        <>
                          <Route className="w-3.5 h-3.5" />
                          <span>Select Connected Path</span>
                        </>
                      )}
                    </div>
                  )}

                  {gameState.turnPhase === 'roll' && (
                    <button
                      disabled={isRollingDice}
                      onClick={handleRollDice}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 cursor-pointer flex items-center gap-1.5 transition transform active:scale-95 animate-pulse"
                    >
                      <Dices className={`w-4 h-4 ${isRollingDice ? 'animate-spin' : ''}`} />
                      {isRollingDice ? 'Rolling...' : 'Roll Dice (2d6)'}
                    </button>
                  )}

                  {gameState.turnPhase === 'main' && (
                    <button
                      onClick={handleEndTurn}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      End Turn
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Player Hand, Building Tray, Port Trade, Activity Log */}
        <div className="lg:col-span-4 space-y-3.5 flex flex-col">
          {/* Player's Current Resource Hand */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Your Resource Cards
              </h3>
              <span className="text-[11px] text-slate-400">
                Total: {(Object.values(myPlayer.resources) as number[]).reduce((a, b) => a + b, 0)} cards
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center">
              {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((res) => {
                const count = myPlayer.resources[res];
                const theme = RESOURCE_THEMES[res];

                return (
                  <div
                    key={res}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-0.5 transition shadow-sm ${theme.bg} ${
                      count > 0 ? theme.activeBorder : theme.border
                    } hover:brightness-110`}
                  >
                    <div className={`p-1 flex items-center justify-center ${theme.icon}`}>
                      <ResourceIcon type={res} size={20} />
                    </div>
                    <span className={`text-[10px] capitalize font-bold ${theme.text}`}>{res}</span>
                    <span
                      className={`text-sm font-black ${
                        count > 0 ? 'text-amber-300 drop-shadow' : 'text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player's Development Cards Tray */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Development Cards
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                {myPlayer.devCards.length} Held
              </span>
            </div>

            {myPlayer.devCards.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400">
                No Development Cards held. Purchase cards below for{' '}
                <span className="text-amber-300 font-semibold inline-flex items-center gap-1 mx-1">
                  <ResourceIcon type="sheep" size={11} className="text-lime-400" />1
                  <ResourceIcon type="wheat" size={11} className="text-yellow-400" />1
                  <ResourceIcon type="ore" size={11} className="text-slate-300" />1
                </span>.
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const cardCounts: Partial<Record<DevCardType, number>> = {};
                  myPlayer.devCards.forEach((c) => {
                    cardCounts[c] = (cardCounts[c] || 0) + 1;
                  });

                  return (Object.entries(cardCounts) as [DevCardType, number][]).map(([type, count]) => {
                    const info = DEV_CARD_NAMES[type];
                    const isVP = type === 'victoryPoint';
                    const canPlay =
                      isMyTurn &&
                      (type === 'knight'
                        ? gameState.turnPhase === 'main' || gameState.turnPhase === 'roll'
                        : gameState.turnPhase === 'main') &&
                      !isVP;

                    return (
                      <div
                        key={type}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/90 flex flex-col gap-2 transition hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-900 rounded-lg text-amber-400 shrink-0">
                              <DevCardIcon type={type} size={18} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{info.name}</span>
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[10px]">
                                  x{count}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                                {info.desc}
                              </div>
                            </div>
                          </div>

                          {isVP ? (
                            <span className="shrink-0 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-400 inline" /> +{count} VP
                            </span>
                          ) : (
                            <button
                              disabled={!canPlay}
                              onClick={() => handlePlayDevCard(type)}
                              className="shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                            >
                              Play
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Building Tray & Port / Bank Trade Actions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Colony Construction & Trade
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {/* Build Road */}
              {(() => {
                const hasFreeRoads = Boolean(gameState.freeRoadsRemaining && gameState.freeRoadsRemaining > 0);
                const canAffordRoad = myPlayer.resources.wood >= 1 && myPlayer.resources.brick >= 1;
                const canBuildRoad =
                  isMyTurn &&
                  gameState.turnPhase === 'main' &&
                  myPlayer.roadsLeft > 0 &&
                  (hasFreeRoads || canAffordRoad);

                return (
                  <button
                    disabled={!canBuildRoad}
                    onClick={() => {
                      sounds.playPop();
                      setBuildMode(buildMode === 'road' ? null : 'road');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      buildMode === 'road' || hasFreeRoads
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <Route className="w-3.5 h-3.5 text-sky-400" />
                        <span>Road</span>
                        {hasFreeRoads && <span className="text-[10px] text-amber-300 font-extrabold">(FREE x{gameState.freeRoadsRemaining})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {hasFreeRoads ? (
                          'Road Building Dev Card'
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <ResourceIcon type="wood" size={10} className="text-emerald-400" /> 1
                            <ResourceIcon type="brick" size={10} className="text-orange-400" /> 1
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      {myPlayer.roadsLeft} left
                    </span>
                  </button>
                );
              })()}

              {/* Build Settlement */}
              <button
                disabled={
                  !isMyTurn ||
                  gameState.turnPhase !== 'main' ||
                  myPlayer.resources.wood < 1 ||
                  myPlayer.resources.brick < 1 ||
                  myPlayer.resources.sheep < 1 ||
                  myPlayer.resources.wheat < 1 ||
                  myPlayer.settlementsLeft <= 0
                }
                onClick={() => {
                  sounds.playPop();
                  setBuildMode(buildMode === 'settlement' ? null : 'settlement');
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  buildMode === 'settlement'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settlement</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ResourceIcon type="wood" size={10} className="text-emerald-400" /> 1
                      <ResourceIcon type="brick" size={10} className="text-orange-400" /> 1
                      <ResourceIcon type="sheep" size={10} className="text-lime-400" /> 1
                      <ResourceIcon type="wheat" size={10} className="text-yellow-400" /> 1
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {myPlayer.settlementsLeft} left
                </span>
              </button>

              {/* Upgrade City */}
              <button
                disabled={
                  !isMyTurn ||
                  gameState.turnPhase !== 'main' ||
                  myPlayer.resources.wheat < 2 ||
                  myPlayer.resources.ore < 3 ||
                  myPlayer.citiesLeft <= 0
                }
                onClick={() => {
                  sounds.playPop();
                  setBuildMode(buildMode === 'city' ? null : 'city');
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  buildMode === 'city'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <Castle className="w-3.5 h-3.5 text-purple-400" />
                    <span>City (+2 VP)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ResourceIcon type="wheat" size={10} className="text-yellow-400" /> 2
                      <ResourceIcon type="ore" size={10} className="text-slate-300" /> 3
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {myPlayer.citiesLeft} left
                </span>
              </button>

              {/* Buy Dev Card */}
              <button
                disabled={
                  !isMyTurn ||
                  gameState.turnPhase !== 'main' ||
                  myPlayer.resources.sheep < 1 ||
                  myPlayer.resources.wheat < 1 ||
                  myPlayer.resources.ore < 1 ||
                  gameState.devCardDeck.length <= 0
                }
                onClick={handleBuyDevCard}
                className="p-2.5 rounded-xl border bg-slate-950 border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-left transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Dev Card</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ResourceIcon type="sheep" size={10} className="text-lime-400" /> 1
                      <ResourceIcon type="wheat" size={10} className="text-yellow-400" /> 1
                      <ResourceIcon type="ore" size={10} className="text-slate-300" /> 1
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {gameState.devCardDeck.length} deck
                </span>
              </button>
            </div>

            {/* Colony Trading Triggers */}
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!isMyTurn || gameState.turnPhase !== 'main'}
                onClick={() => {
                  sounds.playPop();
                  setTradeModeTab('player');
                  setIsTradeModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/40 text-blue-200 font-bold text-xs disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Trade Players</span>
              </button>

              <button
                disabled={!isMyTurn || gameState.turnPhase !== 'main'}
                onClick={() => {
                  sounds.playPop();
                  setTradeModeTab('bank');
                  setIsTradeModalOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Harbor & Bank</span>
              </button>
            </div>
          </div>

          {/* Activity Log Ticker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between max-h-[220px] shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Island Chronicles
            </h3>
            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 text-xs">
              {gameState.logs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 leading-snug"
                >
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Discard Modal (Rule: 7 Roll with Hand > 7 Cards) */}
      {myDiscardRequirement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 font-['Fredoka']">
                  Robber Raid! (7 Rolled)
                </h3>
                <p className="text-xs text-rose-300">
                  You hold more than 7 cards. You must discard{' '}
                  <strong className="text-white font-bold">{myDiscardRequirement.count}</strong> cards.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((res) => {
                const count = myPlayer.resources[res];
                const selected = discardSelection[res] || 0;
                const detail = RESOURCE_DETAILS[res];

                return (
                  <div
                    key={res}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 text-amber-400">
                        <ResourceIcon type={res} size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 capitalize">
                          {detail.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400">In hand: {count}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={selected <= 0}
                        onClick={() => {
                          sounds.playPop();
                          setDiscardSelection((prev) => ({
                            ...prev,
                            [res]: Math.max(0, (prev[res] || 0) - 1),
                          }));
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-amber-400 text-sm">
                        {selected}
                      </span>
                      <button
                        type="button"
                        disabled={selected >= count || totalDiscardSelected >= myDiscardRequirement.count}
                        onClick={() => {
                          sounds.playPop();
                          setDiscardSelection((prev) => ({
                            ...prev,
                            [res]: (prev[res] || 0) + 1,
                          }));
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Selected:{' '}
                <strong className={totalDiscardSelected === myDiscardRequirement.count ? 'text-emerald-400' : 'text-amber-400'}>
                  {totalDiscardSelected}
                </strong>{' '}
                / {myDiscardRequirement.count}
              </span>

              <button
                disabled={totalDiscardSelected !== myDiscardRequirement.count}
                onClick={handleConfirmDiscard}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-500/20"
              >
                Confirm Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Domestic & Maritime Trading Center Modal */}
      {isTradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl text-slate-100 max-h-[92vh] flex flex-col font-['Outfit']">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {tradeModeTab === 'player' ? (
                    <Handshake className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Anchor className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-['Fredoka']">
                    Catan Trading Center
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Trade resources directly with other players & bots, or exchange via ports with the bank
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTradeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trading Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setTradeModeTab('player');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  tradeModeTab === 'player'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Trade with Players & Bots</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setTradeModeTab('bank');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  tradeModeTab === 'bank'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Harbor & Bank Trade</span>
              </button>
            </div>

            {/* Tab 1: Domestic Trade with Players / Bots */}
            {tradeModeTab === 'player' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Target Partner Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Trade Partner:
                  </label>
                  <select
                    value={tradeTargetPlayerId}
                    onChange={(e) => setTradeTargetPlayerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none cursor-pointer focus:border-blue-400"
                  >
                    <option value="all">All Opponents (Human Players & AI Bots)</option>
                    {gameState.players
                      .filter((p) => p.id !== myPlayer.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isBot ? '(AI Bot)' : '(Human Player)'}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Offer and Request Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: What You Give */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-['Fredoka']">
                        You Give (Offer)
                      </span>
                      <span className="text-[10px] text-amber-200/80 font-bold">
                        {Object.values(playerTradeGive).reduce((s, c) => s + c, 0)} cards
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                        const inHand = myPlayer.resources[r] || 0;
                        const giving = playerTradeGive[r] || 0;
                        const theme = RESOURCE_THEMES[r];

                        return (
                          <div
                            key={'give-' + r}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition shadow-sm ${theme.bg} ${
                              giving > 0 ? theme.activeBorder : theme.border
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-black/30 flex items-center justify-center ${theme.icon}`}>
                                <ResourceIcon type={r} size={18} />
                              </div>
                              <div>
                                <div className={`text-xs font-bold capitalize ${theme.text}`}>{r}</div>
                                <div className="text-[10px] text-slate-400">In hand: {inHand}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={giving <= 0}
                                onClick={() => {
                                  sounds.playPop();
                                  setPlayerTradeGive((prev) => ({
                                    ...prev,
                                    [r]: Math.max(0, (prev[r] || 0) - 1),
                                  }));
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer border border-slate-700/50"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-amber-300 text-xs">
                                {giving}
                              </span>
                              <button
                                type="button"
                                disabled={giving >= inHand}
                                onClick={() => {
                                  sounds.playPop();
                                  setPlayerTradeGive((prev) => ({
                                    ...prev,
                                    [r]: (prev[r] || 0) + 1,
                                  }));
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer border border-slate-700/50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: What You Want */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-300 font-['Fredoka']">
                        You Want (Request)
                      </span>
                      <span className="text-[10px] text-emerald-200/80 font-bold">
                        {Object.values(playerTradeWant).reduce((s, c) => s + c, 0)} cards
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                        const wanting = playerTradeWant[r] || 0;
                        const theme = RESOURCE_THEMES[r];

                        return (
                          <div
                            key={'want-' + r}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition shadow-sm ${theme.bg} ${
                              wanting > 0 ? theme.activeBorder : theme.border
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-black/30 flex items-center justify-center ${theme.icon}`}>
                                <ResourceIcon type={r} size={18} />
                              </div>
                              <div>
                                <div className={`text-xs font-bold capitalize ${theme.text}`}>{r}</div>
                                <div className="text-[10px] text-slate-400">Requesting</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={wanting <= 0}
                                onClick={() => {
                                  sounds.playPop();
                                  setPlayerTradeWant((prev) => ({
                                    ...prev,
                                    [r]: Math.max(0, (prev[r] || 0) - 1),
                                  }));
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer border border-slate-700/50"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-bold text-emerald-400 text-xs">
                                {wanting}
                              </span>
                              <button
                                type="button"
                                disabled={wanting >= 5}
                                onClick={() => {
                                  sounds.playPop();
                                  setPlayerTradeWant((prev) => ({
                                    ...prev,
                                    [r]: (prev[r] || 0) + 1,
                                  }));
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-900/90 hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-black text-xs flex items-center justify-center cursor-pointer border border-slate-700/50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>AI Bots evaluate trades based on resource scarcity and goals. Propose a fair or advantageous trade to complete deals with bots!</span>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerTradeGive({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
                      setPlayerTradeWant({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
                      setIsTradeModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      Object.values(playerTradeGive).reduce((s, c) => s + c, 0) === 0 ||
                      Object.values(playerTradeWant).reduce((s, c) => s + c, 0) === 0
                    }
                    onClick={handleProposePlayerTrade}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Trade Offer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Harbor & Bank (Maritime Trade) */}
            {tradeModeTab === 'bank' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Give Resource Selection */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Give Resource (Ratio applied automatically):
                  </label>
                  <div className="space-y-1.5">
                    {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                      const ratio = playerPortRatios[r] || 4;
                      const count = myPlayer.resources[r];
                      const isSelected = tradeGive === r;
                      const isSpecificPort = ratio === 2;
                      const isGeneralPort = ratio === 3;

                      const theme = RESOURCE_THEMES[r];

                      return (
                        <div
                          key={r}
                          onClick={() => {
                            sounds.playPop();
                            setTradeGive(r);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition shadow-sm ${theme.bg} ${
                            isSelected
                              ? theme.activeBorder
                              : theme.border + ' hover:brightness-110'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg bg-black/30 flex items-center justify-center ${theme.icon}`}>
                              <ResourceIcon type={r} size={18} />
                            </div>
                            <div>
                              <div className={`text-xs font-bold capitalize ${theme.text}`}>{r}</div>
                              <div className="text-[10px] text-slate-400">In hand: {count}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSpecificPort ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                2:1 Port Owned!
                              </span>
                            ) : isGeneralPort ? (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                3:1 Harbor Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                                4:1 Standard Bank
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Receive Resource Selection */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Receive 1 Card of:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => {
                      const isSelected = tradeGet === r;
                      const theme = RESOURCE_THEMES[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            setTradeGet(r);
                          }}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer shadow-sm ${theme.bg} ${
                            isSelected
                              ? theme.activeBorder
                              : theme.border + ' hover:brightness-110'
                          }`}
                        >
                          <div className={`p-1 ${theme.icon}`}>
                            <ResourceIcon type={r} size={20} />
                          </div>
                          <span className={`text-[10px] font-bold capitalize mt-1 ${theme.text}`}>{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary & Confirm */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span>Trade </span>
                    <strong className="text-amber-400">{activeTradeRatio}x {tradeGive}</strong>
                    <span> → 1x {tradeGet}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTradeModalOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={myPlayer.resources[tradeGive] < activeTradeRatio || tradeGive === tradeGet}
                      onClick={handleExecuteTrade}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      Execute Trade ({activeTradeRatio}:1)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Year of Plenty Modal */}
      {isYearOfPlentyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-['Fredoka']">
                    Year of Plenty
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose any 2 resource cards to take directly from the Bank
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsYearOfPlentyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Resource 1 */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                1st Resource:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => (
                  <button
                    key={'r1-' + r}
                    type="button"
                    onClick={() => setYopRes1(r)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition ${
                      yopRes1 === r
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ResourceIcon resource={r} size="md" />
                    <span className="text-[10px] capitalize font-bold mt-1">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Resource 2 */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                2nd Resource:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => (
                  <button
                    key={'r2-' + r}
                    type="button"
                    onClick={() => setYopRes2(r)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition ${
                      yopRes2 === r
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ResourceIcon resource={r} size="md" />
                    <span className="text-[10px] capitalize font-bold mt-1">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handlePlayDevCard('yearOfPlenty', {
                  yearOfPlentyResources: [yopRes1, yopRes2],
                });
                setIsYearOfPlentyOpen(false);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
            >
              Take 1 {yopRes1} & 1 {yopRes2} from Bank
            </button>
          </div>
        </div>
      )}

      {/* 6. Monopoly Modal */}
      {isMonopolyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-['Fredoka']">
                    Declare Monopoly
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose 1 resource type. All opponents must give you all cards of that type!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMonopolyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Monopoly Resource */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Target Resource Type:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['wood', 'brick', 'sheep', 'wheat', 'ore'] as ResourceType[]).map((r) => (
                  <button
                    key={'mono-' + r}
                    type="button"
                    onClick={() => setMonopolyRes(r)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition ${
                      monopolyRes === r
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <ResourceIcon resource={r} size="md" />
                    <span className="text-[10px] capitalize font-bold mt-1">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handlePlayDevCard('monopoly', {
                  monopolyResource: monopolyRes,
                });
                setIsMonopolyOpen(false);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
            >
              Declare Monopoly on {monopolyRes.toUpperCase()}!
            </button>
          </div>
        </div>
      )}

      {/* 7. Victory / Game Over Modal */}
      {gameState.winnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="p-4 w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-amber-400 font-['Fredoka']">
              {gameState.winnerId === myPlayer.id ? 'Triumph on Catan!' : 'Island Colonized!'}
            </h3>
            <p className="text-xs text-slate-300">
              {gameState.players.find((p) => p.id === gameState.winnerId)?.name} has reached {targetVP} Victory Points and established dominance over the island of Catan!
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handlePlayAgain}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Play again
              </button>
              <button
                onClick={onExit}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
