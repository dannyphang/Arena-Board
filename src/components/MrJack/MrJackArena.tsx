import React, { useState, useEffect } from 'react';
import { MrJackGameState, Role, CharacterId, HexCoord, AlibiCard } from '../../games/mr-jack/types';
import { CHARACTERS, ROUND_DRAFT_ORDERS, EXITS, ALL_CHARACTERS } from '../../games/mr-jack/constants';
import {
  WHITECHAPEL_HEXES,
  BUILDING_HEXES,
  EXITS_CONFIG,
  WATSON_DIRECTION_LABELS,
} from '../../games/mr-jack/topology';
import {
  isCharacterVisible,
  getReachableHexes,
  evaluateWitnessCall,
  createInitialMrJackGame,
  checkJackEscape,
  useSherlockHolmesAbility,
  useLestradeAbility,
  useBertAbility,
  useSmithAbility,
  useGullAbility,
  useGoodleyAbility,
  getStepCloserTo,
  shuffle,
} from '../../games/mr-jack/engine';
import { sounds } from '../../services/audio';
import { getSocket } from '../../services/socket';
import { TableRoom } from '../../types/lobby';
import { UserProfile } from '../../types/user';
import { MrJackBoard } from './MrJackBoard';
import { InGameChat } from '../GeniusSquare/InGameChat';
import {
  Eye,
  EyeOff,
  Compass,
  Footprints,
  ShieldAlert,
  Search,
  CheckCircle,
  RotateCw,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  RotateCcw,
  Home,
  Skull,
  Shield,
  Zap,
  FileText,
  Bell,
  Swords,
  User,
  Sliders,
  Layers,
  HelpCircle,
  ArrowLeftRight,
  Hourglass,
  X,
} from 'lucide-react';

interface MrJackArenaProps {
  user: UserProfile;
  table: TableRoom | null;
  isSoloPractice?: boolean;
  onExit: () => void;
  onOpenRules: () => void;
  onRecordMatch: (timeSec: number, won: boolean) => void;
}

export const MrJackArena: React.FC<MrJackArenaProps> = ({
  user,
  table,
  isSoloPractice = false,
  onExit,
  onOpenRules,
  onRecordMatch,
}) => {
  const socket = getSocket();

  // User role (Detective by default, or Jack)
  const isHost = table ? table.hostId === user.id : true;
  const userRole: Role = table
    ? table.players.find((p) => p.userId === user.id)?.role || (isHost ? 'detective' : 'jack')
    : 'detective';

  // Game state
  const [localGame, setLocalGame] = useState<MrJackGameState>(() =>
    table?.mrJackState ? table.mrJackState : createInitialMrJackGame()
  );

  const gameState = table?.mrJackState || localGame;

  // Selected character & reachable hexes (0 to 85)
  const [selectedCharId, setSelectedCharId] = useState<CharacterId | null>(null);
  const [inspectedCharId, setInspectedCharId] = useState<CharacterId | null>(null);
  const [reachableHexes, setReachableHexes] = useState<number[]>([]);
  const [selectedHex, setSelectedHex] = useState<number | null>(null);

  // Ability interactive modals/states
  const [activeModal, setActiveModal] = useState<
    | 'none'
    | 'watson_direction'
    | 'lestrade_cordon'
    | 'bert_manhole'
    | 'smith_gaslight'
    | 'gull_choice'
    | 'gull_swap'
    | 'goodley_whistle'
    | 'witness_banner'
    | 'alibi_view'
  >('none');
  const [pendingMovedCharId, setPendingMovedCharId] = useState<CharacterId | null>(null);
  const [selectedCordonSource, setSelectedCordonSource] = useState<number | null>(null);
  const [selectedGaslightSource, setSelectedGaslightSource] = useState<number | null>(null);
  const [selectedManholeSource, setSelectedManholeSource] = useState<number | null>(null);
  const [whistlePointsRemaining, setWhistlePointsRemaining] = useState<number>(3);

  // Keyboard shortcut: Esc -> close active modals / deselect character / dismiss info
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
          setSelectedGaslightSource(null);
          setSelectedManholeSource(null);
          setSelectedCordonSource(null);
        } else if (selectedCharId) {
          setSelectedCharId(null);
          setReachableHexes([]);
          setSelectedHex(null);
        } else if (inspectedCharId) {
          setInspectedCharId(null);
        }
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, [activeModal, selectedCharId, inspectedCharId]);

  // Synchronize state updates
  const updateGameState = (next: MrJackGameState) => {
    if (table) {
      socket.emit('mrjack:move', {
        tableId: table.id,
        gameState: next,
      });
    } else {
      setLocalGame(next);
    }
  };

  // Turn calculation
  const draftOrder = ROUND_DRAFT_ORDERS[gameState.round] || ['detective', 'jack', 'jack', 'detective'];
  const currentTurnRole = draftOrder[gameState.turnIndex];
  const isMyTurn = isSoloPractice || currentTurnRole === userRole;

  // AI Solo Automation
  useEffect(() => {
    if (!isSoloPractice || isMyTurn || gameState.isGameOver) return;

    // Simulate opponent thinking
    const timer = setTimeout(() => {
      // Find first unplayed card
      const availableCards = gameState.roundCards.filter((c) => !c.isPlayed);
      if (availableCards.length === 0) return;

      const chosenCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      const charDef = CHARACTERS[chosenCard.characterId];
      const charState = gameState.characters[chosenCard.characterId];

      const occupied = Object.values(gameState.characters).map((c) => c.hex);
      const moves = getReachableHexes(
        charState.hex,
        charDef.maxMovement,
        chosenCard.characterId === 'stealthy',
        gameState.manholes,
        occupied,
        gameState.gaslights
      );

      const targetHex = moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : charState.hex;

      // Execute AI Move
      executeMove(chosenCard.characterId, targetHex, true);
    }, 900);

    return () => clearTimeout(timer);
  }, [gameState, isSoloPractice, isMyTurn]);

  // Select / Inspect a character action card
  const handleSelectCard = (charId: CharacterId) => {
    // Always set inspected character so right side shows full move & ability dossier!
    setInspectedCharId(charId);

    const roundCard = gameState.roundCards.find((c) => c.characterId === charId);
    if (!isMyTurn || gameState.isGameOver || !roundCard || roundCard.isPlayed) {
      // Just inspecting info, no move selection needed
      return;
    }

    sounds.playPop();

    // Sir William Gull can either move 1-3 spaces or swap positions!
    if (charId === 'gull') {
      setSelectedCharId(charId);
      setActiveModal('gull_choice');
      return;
    }

    setSelectedCharId(charId);
    setSelectedHex(null);

    const charDef = CHARACTERS[charId];
    const charState = gameState.characters[charId];

    // Compute reachable moves
    const occupied = Object.values(gameState.characters).map((c) => c.hex);
    const reachable = getReachableHexes(
      charState.hex,
      charDef.maxMovement,
      charId === 'stealthy',
      gameState.manholes,
      occupied,
      gameState.gaslights
    );

    setReachableHexes(reachable);
  };

  const handleGullNormalMove = () => {
    setActiveModal('none');
    setSelectedHex(null);
    const charDef = CHARACTERS['gull'];
    const charState = gameState.characters['gull'];
    const occupied = Object.values(gameState.characters).map((c) => c.hex);
    const reachable = getReachableHexes(
      charState.hex,
      charDef.maxMovement,
      false,
      gameState.manholes,
      occupied,
      gameState.gaslights
    );
    setReachableHexes(reachable);
  };

  const handleGullSwapWith = (otherId: CharacterId) => {
    sounds.playSnap();
    let next = useGullAbility(gameState, otherId);
    const card = next.roundCards.find((c) => c.characterId === 'gull');
    if (card) {
      card.isPlayed = true;
      card.playedBy = currentTurnRole;
    }
    setSelectedCharId(null);
    setReachableHexes([]);
    setSelectedHex(null);
    setActiveModal('none');
    advanceTurn(next);
  };

  // Rotate Watson's lantern direction
  const handleRotateWatson = (newFacing: 0 | 1 | 2 | 3 | 4 | 5) => {
    const next = { ...gameState };
    const watson = next.characters['watson'];
    if (watson) {
      watson.watsonFacing = newFacing;
      updateGameState(next);
    }
  };

  // Execute movement of character to targetHex
  const executeMove = (charId: CharacterId, destHex: number, isBot = false) => {
    sounds.playSnap();

    let next = { ...gameState };

    // Move character
    next.characters[charId] = {
      ...next.characters[charId],
      hex: destHex,
      coord: [WHITECHAPEL_HEXES[destHex].col, WHITECHAPEL_HEXES[destHex].row],
    };

    // Check Jack Escape Victory!
    if (charId === next.jackIdentity && checkJackEscape(charId, destHex, next)) {
      next.isGameOver = true;
      next.winner = 'jack';
      next.winReason = `Mr. Jack slipped past the cordon through an unblocked gate into the fog and escaped!`;
      updateGameState(next);
      sounds.playVictory();
      onRecordMatch(120, userRole === 'jack');
      return;
    }

    // Check Detective Accusation (landing on another character)
    const otherCharEntry = Object.entries(next.characters).find(
      ([id, c]) => id !== charId && c.hex === destHex
    );
    if (otherCharEntry && currentTurnRole === 'detective') {
      const [accusedId] = otherCharEntry;
      if (accusedId === next.jackIdentity) {
        next.isGameOver = true;
        next.winner = 'detective';
        next.winReason = `Sherlock Holmes cornered Mr. Jack (${CHARACTERS[accusedId as CharacterId].name}) and made an arrest!`;
      } else {
        next.isGameOver = true;
        next.winner = 'jack';
        next.winReason = `Wrongful accusation! ${CHARACTERS[accusedId as CharacterId].name} is innocent. Jack wins!`;
      }
      updateGameState(next);
      sounds.playVictory();
      onRecordMatch(120, next.winner === userRole);
      return;
    }

    // Handle Sherlock Holmes ability: draw alibi
    if (charId === 'sherlock') {
      next = useSherlockHolmesAbility(next, currentTurnRole);
    }

    // Mark card as played
    const card = next.roundCards.find((c) => c.characterId === charId);
    if (card) {
      card.isPlayed = true;
      card.playedBy = currentTurnRole;
    }

    setSelectedCharId(null);
    setReachableHexes([]);
    setSelectedHex(null);

    // If active character has an ability that requires player choice:
    if (!isBot) {
      if (charId === 'watson') {
        setActiveModal('watson_direction');
        setPendingMovedCharId(charId);
        updateGameState(next);
        return;
      } else if (charId === 'lestrade') {
        setSelectedCordonSource(null);
        setActiveModal('lestrade_cordon');
        setPendingMovedCharId(charId);
        updateGameState(next);
        return;
      } else if (charId === 'bert') {
        setSelectedManholeSource(null);
        setActiveModal('bert_manhole');
        setPendingMovedCharId(charId);
        updateGameState(next);
        return;
      } else if (charId === 'smith') {
        setSelectedGaslightSource(null);
        setActiveModal('smith_gaslight');
        setPendingMovedCharId(charId);
        updateGameState(next);
        return;
      } else if (charId === 'goodley') {
        setWhistlePointsRemaining(3);
        setActiveModal('goodley_whistle');
        setPendingMovedCharId(charId);
        updateGameState(next);
        return;
      }
    } else {
      // Bot automated ability handling
      if (charId === 'watson') {
        const watson = next.characters['watson'];
        if (watson) watson.watsonFacing = Math.floor(Math.random() * 6) as any;
      } else if (charId === 'lestrade') {
        const openExits = EXITS_CONFIG.filter((e) => !next.cordons.some((c) => c.exitIndex === e.id));
        if (openExits.length > 0 && next.cordons.length > 0) {
          const cordonIdx = next.cordons[0].exitIndex;
          const targetExit = openExits[0].id;
          next = useLestradeAbility(next, cordonIdx, targetExit);
        }
      } else if (charId === 'bert') {
        const covered = next.manholes.find((m) => !m.isOpen);
        const openMh = next.manholes.find((m) => m.isOpen);
        if (covered && openMh) {
          next = useBertAbility(next, covered.hex, openMh.hex);
        }
      } else if (charId === 'smith') {
        const lit = next.gaslights.find((g) => g.isLit);
        const unlit = next.gaslights.find((g) => !g.isLit);
        if (lit && unlit) {
          next = useSmithAbility(next, lit.hex, unlit.hex);
        }
      }
    }

    // Otherwise advance turn index directly
    advanceTurn(next);
  };

  // Complete a turn and advance turn index or round
  const advanceTurn = (currState: MrJackGameState) => {
    const next = { ...currState };
    const nextTurnIndex = next.turnIndex + 1;

    // If 4 cards finished for the round -> Trigger WITNESS CALL!
    if (nextTurnIndex >= 4) {
      const evaluated = evaluateWitnessCall(next);
      evaluated.turnIndex = 0;
      evaluated.round = evaluated.round + 1;

      // Draw next 4 cards or shuffle pile if new cycle
      if (evaluated.availableCardPile.length >= 4) {
        evaluated.roundCards = evaluated.availableCardPile.slice(0, 4).map((cid) => ({
          characterId: cid,
          isPlayed: false,
        }));
        evaluated.availableCardPile = evaluated.availableCardPile.slice(4);
      } else {
        // Recycle all 8 character cards
        const all = shuffle([...ALL_CHARACTERS]);
        evaluated.roundCards = all.slice(0, 4).map((cid) => ({
          characterId: cid,
          isPlayed: false,
        }));
        evaluated.availableCardPile = all.slice(4);
      }

      setActiveModal('witness_banner');
      updateGameState(evaluated);
      sounds.playDiceRoll();

      if (evaluated.isGameOver) {
        sounds.playVictory();
        onRecordMatch(120, evaluated.winner === userRole);
      }
    } else {
      next.turnIndex = nextTurnIndex;
      updateGameState(next);
    }
  };

  // Handle board hex clicks
  const handleHexClick = (hexId: number) => {
    // If John Smith gaslight modal is active, clicking lamp hexes works directly on the board:
    if (activeModal === 'smith_gaslight') {
      const litGas = gameState.gaslights.find((g) => g.hex === hexId && g.isLit);
      const unlitGas = gameState.gaslights.find((g) => g.hex === hexId && !g.isLit);
      if (selectedGaslightSource === null && litGas) {
        sounds.playPop();
        setSelectedGaslightSource(hexId);
        return;
      }
      if (selectedGaslightSource !== null && (unlitGas || hexId === 26 || hexId === 58)) {
        sounds.playPop();
        const next = useSmithAbility(gameState, selectedGaslightSource, hexId);
        setSelectedGaslightSource(null);
        setActiveModal('none');
        advanceTurn(next);
        return;
      }
    }

    // If clicking a character token hex when no character is selected for movement, inspect character:
    const clickedChar = Object.values(gameState.characters).find((c) => c.hex === hexId);
    if (clickedChar && !selectedCharId) {
      handleSelectCard(clickedChar.id);
      return;
    }

    if (!selectedCharId || !isMyTurn || gameState.isGameOver) return;

    if (!reachableHexes.includes(hexId)) {
      sounds.playBuzz();
      return;
    }

    executeMove(selectedCharId, hexId, false);
  };

  const isWinner = gameState.winner === userRole;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 text-slate-100 font-['Outfit']">
      {/* Victorian Whitechapel Header Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Round & Turn Tracker */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-stone-900 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black font-['Fredoka'] text-amber-400">
                Mr. Jack in London
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Round {gameState.round} / 8
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Turn {gameState.turnIndex + 1} of 4 • Current Turn:{' '}
              <strong
                className={
                  currentTurnRole === 'detective' ? 'text-amber-400 uppercase font-black' : 'text-rose-400 uppercase font-black'
                }
              >
                {currentTurnRole} {isMyTurn ? '(You!)' : '(Opponent)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Center: Secret Role Badge & Hourglasses */}
        <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Your Secret Role</div>
            <div className="font-extrabold text-sm capitalize flex items-center gap-1.5">
              {userRole === 'detective' ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Search className="w-4 h-4" /> Sherlock's Detective
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Mr. Jack ({CHARACTERS[gameState.jackIdentity].name})
                </span>
              )}
            </div>
          </div>

          {/* Hourglasses Counter */}
          <div className="pl-4 border-l border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Jack Hourglasses</div>
            <div className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-amber-400 inline" />
              <span>{gameState.jackHourglasses} / 6</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playPop();
              setActiveModal('alibi_view');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Alibis ({userRole === 'detective' ? gameState.detectiveAlibis.length : gameState.jackAlibis.length})
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              onOpenRules();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            Rules
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              onExit();
            }}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Exit Table
          </button>
        </div>
      </div>

      {/* Main Board & Sidebar Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Board Column */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-4">
          <MrJackBoard
            gameState={gameState}
            userRole={userRole}
            reachableHexes={reachableHexes}
            selectedHex={selectedHex}
            onHexClick={handleHexClick}
            onCharacterClick={(id) => handleSelectCard(id)}
            onRotateWatson={handleRotateWatson}
          />

          {/* Authentic Character Action Cards Draft */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Round {gameState.round} Character Action Draft:
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                Draft Order: {draftOrder.map((r, i) => (
                  <span
                    key={i}
                    className={`ml-1 font-bold ${
                      i === gameState.turnIndex ? 'underline font-black text-white px-1.5 py-0.5 rounded bg-amber-500/30' : 'opacity-60'
                    }`}
                  >
                    [{r[0].toUpperCase()}]
                  </span>
                ))}
              </span>
            </div>

            {/* 4 Authentic Action Cards from repo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gameState.roundCards.map((card) => {
                const charDef = CHARACTERS[card.characterId];
                const isSelected = selectedCharId === card.characterId;

                const cardSrc = card.isPlayed
                  ? charDef.cardUsedImage
                  : isSelected
                  ? charDef.cardSelectedImage
                  : charDef.cardImage;

                return (
                  <button
                    key={card.characterId}
                    disabled={card.isPlayed || !isMyTurn || gameState.isGameOver}
                    onClick={() => handleSelectCard(card.characterId)}
                    className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 text-left flex flex-col ${
                      card.isPlayed
                        ? 'opacity-40 grayscale border-slate-800 cursor-not-allowed'
                        : isSelected
                        ? 'ring-4 ring-amber-400 border-amber-300 shadow-2xl scale-105'
                        : 'border-slate-700/80 hover:border-amber-400/80 hover:shadow-xl hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    {/* Authentic Card Image from Repo */}
                    <div className="w-full aspect-[2/3] bg-slate-950 overflow-hidden relative">
                      <img
                        src={cardSrc}
                        alt={charDef.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                      />

                      {/* Played Overlay */}
                      {card.isPlayed && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-black uppercase text-slate-300">
                            Played ({card.playedBy})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Description Footer */}
                    <div className="p-2.5 bg-slate-950/90 border-t border-slate-800">
                      <div className="text-xs font-black text-slate-200 truncate">
                        {charDef.name}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">
                        Moves 1 - {charDef.maxMovement} hexes
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {charDef.abilityDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Character Dossier (Move & Ability Info shown on token / card / lineup click) */}
          {(() => {
            const activeInspectId = inspectedCharId || selectedCharId;
            if (!activeInspectId) return null;
            const def = CHARACTERS[activeInspectId];
            const charState = gameState.characters[activeInspectId];
            const isCleared = charState?.isExonerated;
            const isVisible = isCharacterVisible(activeInspectId, gameState);
            const isJackSecret = userRole === 'jack' && activeInspectId === gameState.jackIdentity;
            const roundCard = gameState.roundCards.find((c) => c.characterId === activeInspectId);
            const isCardAvailable = roundCard && !roundCard.isPlayed && isMyTurn && !gameState.isGameOver;

            return (
              <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={isCleared ? def.innocentTokenImage : def.suspectTokenImage}
                        alt={def.name}
                        className="w-12 h-12 rounded-full border-2 border-amber-400 shadow-md object-cover"
                      />
                      {isCleared && (
                        <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-emerald-500 text-slate-950 text-[9px] font-black rounded">
                          CLEAR
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                        <span>{def.name}</span>
                        {isJackSecret && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                            JACK
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-400 font-semibold">Suspect #{def.numericId} • Whitechapel</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectedCharId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                    title="Close dossier (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Visibility</div>
                      <div className={`font-bold ${isVisible ? 'text-amber-300' : 'text-indigo-300'}`}>
                        {isVisible ? 'Lit (Seen)' : 'In Shadow'}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Location</div>
                      <div className="font-mono font-bold text-slate-200">
                        Hex #{charState?.hex}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Movement Info */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-amber-400" />
                    Movement:
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    Moves 1 to {def.maxMovement} hexes
                  </div>
                  {activeInspectId === 'stealthy' && (
                    <p className="text-[11px] text-slate-400">
                      Stealthy can climb over buildings and walls!
                    </p>
                  )}
                </div>

                {/* Ability Info */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Special Ability:
                  </div>
                  <div className="text-xs font-bold text-amber-300">
                    {def.abilityDescription}
                  </div>
                </div>

                {/* Quick select/move action button */}
                {isCardAvailable && (
                  <button
                    onClick={() => handleSelectCard(activeInspectId)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Select & Move {def.name.split(' ')[0]}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Latest Witness Call Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              Witness Report (Round End)
            </h4>

            {gameState.witnessCallMade ? (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  gameState.isJackVisibleInWitnessCall
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={gameState.isJackVisibleInWitnessCall ? '/mrjack/seen.png' : '/mrjack/unseen.png'}
                    alt="Witness Status"
                    className="h-7 object-contain drop-shadow"
                  />
                  <span>
                    Jack is{' '}
                    <strong className="uppercase">
                      {gameState.isJackVisibleInWitnessCall ? 'Seen in the Light' : 'Unseen in the Shadows'}
                    </strong>!
                  </span>
                </div>
                {gameState.clearedInRound.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    Cleared {gameState.clearedInRound.length} innocent suspects!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Witness call takes place at round end after 4 character actions.
              </div>
            )}
          </div>

          {/* Suspect Lineup Tracker */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Suspect Lineup ({Object.values(gameState.characters).filter((c) => c.isSuspect).length} Remaining)</span>
              <span className="text-[10px] text-amber-400 font-mono">Whitechapel</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {ALL_CHARACTERS.map((charId) => {
                const def = CHARACTERS[charId];
                const charState = gameState.characters[charId];
                const isCleared = charState?.isExonerated;
                const isJackSecret = userRole === 'jack' && charId === gameState.jackIdentity;
                const isVisible = isCharacterVisible(charId, gameState);

                const tokenSrc = isCleared ? def.innocentTokenImage : def.suspectTokenImage;

                return (
                  <div
                    key={charId}
                    onClick={() => {
                      sounds.playPop();
                      setInspectedCharId(charId);
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition cursor-pointer hover:scale-[1.02] ${
                      charId === inspectedCharId
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-500/10'
                        : isCleared
                        ? 'opacity-40 bg-slate-950/40 border-slate-900 grayscale hover:opacity-80'
                        : isJackSecret
                        ? 'bg-rose-950/40 border-rose-500/70 ring-1 ring-rose-500 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                    }`}
                    title="Click to view move and ability"
                  >
                    <img
                      src={tokenSrc}
                      alt={def.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 drop-shadow"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{def.name.split(' ')[0]}</span>
                        {isJackSecret && <Sparkles className="w-3 h-3 text-rose-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className={isCleared ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {isCleared ? 'Innocent' : 'Suspect'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className={isVisible ? 'text-amber-400' : 'text-indigo-400'}>
                          {isVisible ? 'Lit' : 'Dark'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* In-Game Table Chat */}
          {table && (
            <InGameChat
              messages={table.messages}
              currentUserId={user.id}
              onSendMessage={(text) => socket.emit('table:chat', { tableId: table.id, text })}
            />
          )}
        </div>
      </div>

      {/* Ability Modals */}
      {/* 1. Watson Direction Modal */}
      {activeModal === 'watson_direction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black font-['Fredoka'] text-amber-300">
              Point Watson's Lantern Beam
            </h3>
            <p className="text-xs text-slate-400">
              Doctor Watson illuminates all characters in a straight line. Choose which direction to point his lantern:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[0, 1, 2, 3, 4, 5].map((dir) => (
                <button
                  key={dir}
                  onClick={() => {
                    sounds.playPop();
                    handleRotateWatson(dir as any);
                    setActiveModal('none');
                    advanceTurn(gameState);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/60 font-bold text-slate-200 transition cursor-pointer"
                >
                  {WATSON_DIRECTION_LABELS[dir]?.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Lestrade Police Cordon Modal */}
      {activeModal === 'lestrade_cordon' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-center mb-1">
              <img src="/mrjack/way.png" alt="Police Cordon" className="h-10 object-contain drop-shadow" />
            </div>
            <h3 className="text-lg font-black font-['Fredoka'] text-purple-300">
              Inspecteur Lestrade: Police Cordon
            </h3>
            {selectedCordonSource === null ? (
              <>
                <p className="text-xs text-slate-400">
                  Step 1: Select which blocked police cordon barricade you want to remove:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {gameState.cordons.map((cordon) => {
                    const exit = EXITS_CONFIG.find((e) => e.id === cordon.exitIndex);
                    return (
                      <button
                        key={cordon.id}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedCordonSource(cordon.exitIndex);
                        }}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-purple-500/20 border border-slate-700 hover:border-purple-500/60 font-bold text-slate-200 transition cursor-pointer flex flex-col items-center gap-1.5"
                      >
                        <span className="text-purple-400 font-black">Cordon #{cordon.id}</span>
                        <span>{exit?.name || `Exit ${cordon.exitIndex}`}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Step 2: Place the police cordon barricade on an open city gate:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {EXITS_CONFIG.filter((e) => !gameState.cordons.some((c) => c.exitIndex === e.id)).map((exit) => (
                    <button
                      key={exit.id}
                      onClick={() => {
                        sounds.playPop();
                        const next = useLestradeAbility(gameState, selectedCordonSource, exit.id);
                        setSelectedCordonSource(null);
                        setActiveModal('none');
                        advanceTurn(next);
                      }}
                      className="p-3 rounded-xl bg-purple-950/40 hover:bg-purple-500/30 border border-purple-500/50 font-bold text-purple-200 transition cursor-pointer flex flex-col items-center gap-1.5"
                    >
                      <span className="text-emerald-400 text-[10px] uppercase tracking-wide">Open Gate</span>
                      <span>{exit.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedCordonSource(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline mt-2"
                >
                  &larr; Choose different cordon
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Jeremy Bert Manhole Cover Modal */}
      {activeModal === 'bert_manhole' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-pink-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-center mb-1">
              <img src="/mrjack/block.png" alt="Manhole Cover" className="h-10 object-contain drop-shadow" />
            </div>
            <h3 className="text-lg font-black font-['Fredoka'] text-pink-300">
              Jeremy Bert: Move Manhole Cover
            </h3>
            {selectedManholeSource === null ? (
              <>
                <p className="text-xs text-slate-400">
                  Step 1: Select which covered sewer tile you want to remove (open):
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {gameState.manholes
                    .filter((m) => !m.isOpen)
                    .map((m) => (
                      <button
                        key={m.hex}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedManholeSource(m.hex);
                        }}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-pink-500/20 border border-slate-700 hover:border-pink-500/60 font-bold text-slate-200 transition cursor-pointer flex flex-col items-center gap-1"
                      >
                        <span className="text-pink-400 font-mono font-bold">Hex #{m.hex}</span>
                        <span className="text-[10px] text-slate-400">Currently Blocked</span>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Step 2: Place the sewer cover tile onto an open manhole to block it:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs max-h-56 overflow-y-auto p-1">
                  {gameState.manholes
                    .filter((m) => m.isOpen)
                    .map((m) => (
                      <button
                        key={m.hex}
                        onClick={() => {
                          sounds.playPop();
                          const next = useBertAbility(gameState, selectedManholeSource, m.hex);
                          setSelectedManholeSource(null);
                          setActiveModal('none');
                          advanceTurn(next);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-pink-500/30 border border-slate-700 hover:border-pink-500/50 font-bold text-pink-200 transition cursor-pointer"
                      >
                        Hex #{m.hex}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setSelectedManholeSource(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline mt-2"
                >
                  &larr; Choose different covered manhole
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. John Smith Gaslight Modal */}
      {activeModal === 'smith_gaslight' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-center mb-1">
              <img src="/mrjack/light.png" alt="Gaslight" className="h-10 object-contain drop-shadow" />
            </div>
            <h3 className="text-lg font-black font-['Fredoka'] text-rose-300">
              John Smith: Move Gaslight
            </h3>
            {selectedGaslightSource === null ? (
              <>
                <p className="text-xs text-slate-400">
                  Step 1: Select which lit gaslight tile you want to pick up:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {gameState.gaslights
                    .filter((g) => g.isLit)
                    .map((g) => (
                      <button
                        key={g.hex}
                        onClick={() => {
                          sounds.playPop();
                          setSelectedGaslightSource(g.hex);
                        }}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/60 font-bold text-slate-200 transition cursor-pointer flex flex-col items-center gap-1 shadow-sm"
                      >
                        <span className="text-amber-400 font-bold">Lamp #{g.id}</span>
                        <span className="text-[10px] text-slate-400">Hex #{g.hex} (Lit)</span>
                      </button>
                    ))}
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-center">
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setActiveModal('none');
                      setSelectedGaslightSource(null);
                      advanceTurn(gameState);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Skip Moving Gaslight &rarr;
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Step 2: Place the lit gaslight tile onto an unlit lamp post:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(() => {
                    const unlit = gameState.gaslights.filter(
                      (g) => !g.isLit && g.hex !== selectedGaslightSource
                    );
                    const list =
                      unlit.length > 0
                        ? unlit
                        : [
                            { id: 7, hex: 26, isLit: false, turnsOffRound: null, coord: [4, 2] },
                            { id: 8, hex: 58, isLit: false, turnsOffRound: null, coord: [8, 3] },
                          ];
                    return list.map((g) => (
                      <button
                        key={g.hex}
                        onClick={() => {
                          sounds.playPop();
                          const next = useSmithAbility(gameState, selectedGaslightSource, g.hex);
                          setSelectedGaslightSource(null);
                          setActiveModal('none');
                          advanceTurn(next);
                        }}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-rose-500/30 border border-slate-700 hover:border-rose-500/50 font-bold text-rose-200 transition cursor-pointer flex items-center gap-2 justify-center shadow-md"
                      >
                        <img src="/mrjack/clight.png" alt="Unlit lamp" className="w-6 h-6 object-contain" />
                        <span>Lamp #{g.id} (Hex #{g.hex})</span>
                      </button>
                    ));
                  })()}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedGaslightSource(null)}
                    className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    &larr; Choose different lit gaslight
                  </button>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setActiveModal('none');
                      setSelectedGaslightSource(null);
                      advanceTurn(gameState);
                    }}
                    className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Keep as is &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4b. Sir William Gull Choice Modal */}
      {activeModal === 'gull_choice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-24 mx-auto overflow-hidden rounded-xl border border-slate-600 shadow-md">
              <img src="/mrjack/c8.png" alt="Sir William Gull" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-black font-['Fredoka'] text-amber-300">
              Sir William Gull
            </h3>
            <p className="text-xs text-slate-400">
              Sir William Gull may either make a standard move (1-3 spaces) OR swap positions with any other character!
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  handleGullNormalMove();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 transition cursor-pointer border border-slate-700 hover:border-amber-400"
              >
                Standard Move (1-3 spaces)
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveModal('gull_swap');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-xs text-slate-950 transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Special: Swap Position with Another Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4c. Sir William Gull Swap Modal */}
      {activeModal === 'gull_swap' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black font-['Fredoka'] text-amber-300">
              Sir William Gull: Swap Positions
            </h3>
            <p className="text-xs text-slate-400">
              Select which character on the board to swap positions with:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs max-h-72 overflow-y-auto p-1">
              {ALL_CHARACTERS.filter((id) => id !== 'gull').map((id) => {
                const def = CHARACTERS[id];
                const charState = gameState.characters[id];
                const tokenImg = charState?.isExonerated ? def.innocentTokenImage : def.suspectTokenImage;
                return (
                  <button
                    key={id}
                    onClick={() => handleGullSwapWith(id)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/60 font-bold text-slate-200 transition cursor-pointer flex items-center gap-2.5 text-left"
                  >
                    <img src={tokenImg} alt={def.name} className="w-8 h-8 rounded-full object-cover shrink-0 drop-shadow" />
                    <div className="overflow-hidden">
                      <div className="truncate text-xs">{def.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-amber-400/80">Hex #{charState?.hex}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setActiveModal('gull_choice')}
              className="text-xs text-slate-400 hover:text-slate-200 underline mt-2"
            >
              &larr; Back to Choice
            </button>
          </div>
        </div>
      )}

      {/* 4d. Sergeant Goodley Whistle Modal */}
      {activeModal === 'goodley_whistle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-center mb-1">
              <img src="/mrjack/m7.png" alt="Sergeant Goodley" className="w-12 h-12 rounded-full object-cover shadow-lg border border-emerald-500/50" />
            </div>
            <div>
              <h3 className="text-lg font-black font-['Fredoka'] text-emerald-300">
                Sergeant Goodley: Police Whistle
              </h3>
              <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black">
                {whistlePointsRemaining} Call Point{whistlePointsRemaining > 1 ? 's' : ''} Remaining
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Goodley blows his whistle to call other characters closer to him. Click a character to pull them 1 step along the street towards Goodley:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs max-h-56 overflow-y-auto p-1">
              {ALL_CHARACTERS.filter((id) => id !== 'goodley').map((id) => {
                const def = CHARACTERS[id];
                const charState = gameState.characters[id];
                const goodleyHex = gameState.characters['goodley'].hex;
                const occupied = Object.values(gameState.characters).map((c) => c.hex);
                const stepHex = getStepCloserTo(charState.hex, goodleyHex, gameState.gaslights, occupied);
                const tokenImg = charState?.isExonerated ? def.innocentTokenImage : def.suspectTokenImage;

                return (
                  <button
                    key={id}
                    disabled={stepHex === null}
                    onClick={() => {
                      if (stepHex === null) return;
                      sounds.playSnap();
                      const next = useGoodleyAbility(gameState, id, stepHex);
                      updateGameState(next);
                      if (whistlePointsRemaining <= 1) {
                        setActiveModal('none');
                        advanceTurn(next);
                      } else {
                        setWhistlePointsRemaining((prev) => prev - 1);
                      }
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2 text-left transition ${
                      stepHex !== null
                        ? 'bg-slate-800 hover:bg-emerald-500/20 border-slate-700 hover:border-emerald-500/60 cursor-pointer'
                        : 'bg-slate-900/40 border-slate-800 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <img src={tokenImg} alt={def.name} className="w-8 h-8 rounded-full object-cover shrink-0 drop-shadow" />
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs truncate">{def.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-emerald-400">
                        {stepHex !== null ? `Pull to #${stepHex}` : 'At Goodley / Blocked'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                setActiveModal('none');
                advanceTurn(gameState);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-700"
            >
              Done / Skip Whistle
            </button>
          </div>
        </div>
      )}

      {/* 5. Alibi Cards View Modal */}
      {activeModal === 'alibi_view' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-black font-['Fredoka'] text-amber-400">
              Your Secret Alibi Cards
            </h3>
            <p className="text-xs text-slate-400">
              {userRole === 'detective'
                ? 'These characters have proven alibis and are definitively innocent.'
                : 'Secret alibi cards held by Jack. They grant hourglasses and withhold clues!'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
              {(userRole === 'detective' ? gameState.detectiveAlibis : gameState.jackAlibis).map((c) => {
                const def = CHARACTERS[c.characterId];
                return (
                  <div
                    key={c.characterId}
                    className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md"
                  >
                    <img
                      src={def.alibiImage}
                      alt={def.name}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="p-1.5 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1">
                      <span>{def.name.split(' ')[0]}</span>
                      {c.hourglasses > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          (<Hourglass className="w-2.5 h-2.5 inline" /> {c.hourglasses})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 6. Witness Call Round Banner Modal */}
      {activeModal === 'witness_banner' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <img
              src={gameState.isJackVisibleInWitnessCall ? '/mrjack/seen.png' : '/mrjack/unseen.png'}
              alt="Witness Call"
              className="h-16 mx-auto object-contain drop-shadow-xl"
            />
            <h3 className="text-2xl font-black font-['Fredoka'] text-amber-300">
              {gameState.isJackVisibleInWitnessCall ? 'MR. JACK IS SEEN!' : 'MR. JACK IS IN THE SHADOWS!'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {gameState.isJackVisibleInWitnessCall ? (
                <span>
                  Jack is standing near a lit gaslight, adjacent to another character, or illuminated by Watson's lantern!
                  All <strong>invisible characters</strong> are proven innocent!
                </span>
              ) : (
                <span>
                  Jack is hidden in the dark! All <strong>visible characters</strong> are proven innocent, and Jack earns{' '}
                  <strong className="text-amber-400">1 Hourglass</strong>!
                </span>
              )}
            </p>

            <button
              onClick={() => {
                sounds.playPop();
                setActiveModal('none');
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Continue to Round {gameState.round}
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto mb-3">
              {isWinner ? <Trophy className="w-8 h-8 text-amber-400" /> : <Skull className="w-8 h-8 text-rose-400" />}
            </div>
            <h3 className="text-2xl font-black font-['Fredoka'] mb-2">
              {gameState.winner === 'detective' ? 'Sherlock Holmes Victorious!' : 'Mr. Jack Escapes!'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {gameState.winReason ||
                `The match concluded with ${gameState.winner?.toUpperCase()} achieving their victory condition.`}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  sounds.playPop();
                  const newGame = createInitialMrJackGame();
                  updateGameState(newGame);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                Play again
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
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
