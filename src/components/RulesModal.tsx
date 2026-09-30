import React, { useState, useEffect } from 'react';
import { ALL_PIECE_IDS, PIECES } from '../games/genius-square/constants';
import { PieceId } from '../games/genius-square/types';
import { getUniqueOrientations } from '../games/genius-square/solver';
import { CHARACTERS } from '../games/mr-jack/constants';
import { sounds } from '../services/audio';
import { ResourceIcon } from './Catan/CatanIcons';
import {
  X,
  RotateCw,
  FlipHorizontal,
  Dices,
  Shapes,
  Trophy,
  CheckCircle2,
  Lightbulb,
  Search,
  Eye,
  ShieldAlert,
  Coins,
  Anchor,
  AlertTriangle,
  Award,
  Scroll,
  BookOpen,
  Compass,
  Target,
  Home,
  Castle,
  Route,
  Swords,
  Gift,
  Crown,
} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGame?: 'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride';
  currentGame?: 'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride';
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  defaultGame = 'genius-square',
  currentGame,
}) => {
  const effectiveGame = currentGame || defaultGame;
  const [activeGame, setActiveGame] = useState<'genius-square' | 'mr-jack' | 'catan' | 'ticket-to-ride'>(effectiveGame);

  useEffect(() => {
    if (currentGame) {
      setActiveGame(currentGame);
    }
  }, [currentGame, isOpen]);

  // Keyboard shortcut: Esc -> close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Strict game locking: when opened for a specific game, only display that game's rules
  const displayGame = currentGame || activeGame;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col font-['Outfit']">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {displayGame === 'catan' ? (
                  <Compass className="w-6 h-6" />
                ) : displayGame === 'mr-jack' ? (
                  <Search className="w-6 h-6" />
                ) : displayGame === 'ticket-to-ride' ? (
                  <Route className="w-6 h-6" />
                ) : (
                  <Dices className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-100 font-['Fredoka']">
                  {displayGame === 'catan'
                    ? 'The Settlers of Catan — Official Almanac & Rules'
                    : displayGame === 'mr-jack'
                    ? 'Mr. Jack in London — Rules & Mechanics'
                    : displayGame === 'ticket-to-ride'
                    ? 'Ticket to Ride: Europe — Official Rulebook & Scoring'
                    : 'Genius Square — Rules & Guide'}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentGame
                    ? 'Official rulebook and mechanics for your active match'
                    : 'Select a tabletop game to review official rules & mechanics'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Game Selection Toggle (Hidden when opened from within a specific active game) */}
          {!currentGame && (
            <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveGame('genius-square');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  displayGame === 'genius-square'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dices className="w-3.5 h-3.5" /> Genius Square
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveGame('mr-jack');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  displayGame === 'mr-jack'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> Mr. Jack in London
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveGame('catan');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  displayGame === 'catan'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> The Settlers of Catan
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setActiveGame('ticket-to-ride');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  displayGame === 'ticket-to-ride'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Route className="w-3.5 h-3.5" /> Ticket to Ride: Europe
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed flex-1">
          {displayGame === 'genius-square' ? (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-base font-bold text-amber-400 mb-1 flex items-center gap-2 font-['Fredoka']">
                  <Target className="w-4 h-4" /> Genius Square Objective
                </h4>
                <p className="text-xs">
                  A high-speed polyomino puzzle race on a 6x6 grid. Seven blocker dice are rolled to place 7 cylindrical obstacles. Both players race simultaneously to fit all <strong>9 colored shapes</strong> (totaling 29 squares) into the remaining spaces!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-xs">
                  <div className="text-amber-400 font-bold mb-1">1. Roll 7 Dice</div>
                  <p className="text-slate-400">Generates 7 coordinates (e.g. A1, C3, F6). Exactly 62,208 possible setups.</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-xs">
                  <div className="text-amber-400 font-bold mb-1">2. Race to Place</div>
                  <p className="text-slate-400">Rotate [R] and Flip [F] shapes to fill all 29 non-blocker grid cells.</p>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-xs">
                  <div className="text-amber-400 font-bold mb-1">3. Win Condition</div>
                  <p className="text-slate-400">First player to complete their board triggers instantaneous verification.</p>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-emerald-300">100% Guaranteed Solvable:</strong> Every one of the 62,208 possible dice combinations has at least one valid solution.
                </div>
              </div>
            </div>
          ) : displayGame === 'mr-jack' ? (
            /* Mr. Jack Rules */
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-base font-bold text-amber-400 mb-1 flex items-center gap-2 font-['Fredoka']">
                  <Search className="w-4 h-4" /> Mr. Jack in London: Asymmetric Deduction
                </h4>
                <p className="text-xs leading-relaxed">
                  One player represents <strong>Sherlock Holmes & the Police</strong>, while the other plays <strong>Mr. Jack</strong>, who has secretly disguised himself as one of the 8 prominent figures in Victorian Whitechapel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/40 border border-amber-500/30 p-3 rounded-xl text-xs">
                  <div className="text-amber-400 font-bold mb-1">Detective Goal</div>
                  <p className="text-slate-400">
                    Catch Mr. Jack by deduction before the end of Round 8, or move an investigator onto Jack's disguised character to arrest him!
                  </p>
                </div>
                <div className="bg-slate-800/40 border border-rose-500/30 p-3 rounded-xl text-xs">
                  <div className="text-rose-400 font-bold mb-1">Jack's Goal</div>
                  <p className="text-slate-400">
                    Escape through an uncordoned exit in the dark, or remain unidentified through all 8 rounds until morning fog sets in!
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  The 8 Characters & Special Abilities:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.values(CHARACTERS).map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                      <img
                        src={c.suspectTokenImage}
                        alt={c.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 drop-shadow ring-1 ring-amber-500/30"
                      />
                      <div>
                        <div className="font-bold text-slate-200">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.abilityDescription}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200 leading-relaxed">
                <strong>The Witness Call Rule:</strong> At the end of each round, Jack must declare whether his character is <em>Visible</em> (next to a lit gaslight, adjacent to another character, or hit by Watson's lantern beam) or <em>Invisible</em> (in the shadows). This eliminates half the suspects each round!
              </div>
            </div>
          ) : displayGame === 'catan' ? (
            /* DETAILED & COMPREHENSIVE CATAN RULES */
            <div className="space-y-5">
              {/* 1. Objective & Point System */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h4 className="text-base font-extrabold text-amber-400 font-['Fredoka']">
                      Victory Condition: First to 10 Victory Points (VP)
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Goal: 10 VP
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Players are settlers establishing colonies on the rich island of Catan. Gather natural resources (Lumber, Brick, Wool, Grain, and Ore) through dice rolls, pave connecting road networks, found settlements into wealthy trading cities, and compete for special cards and achievements. The first player to reach <strong>10 Victory Points</strong> during their turn instantly wins the match!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-base font-black text-amber-400">1 VP</div>
                    <div className="text-slate-400 flex items-center justify-center gap-1">
                      <Home className="w-3.5 h-3.5 text-amber-400" /> Settlement
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-base font-black text-amber-400">2 VP</div>
                    <div className="text-slate-400 flex items-center justify-center gap-1">
                      <Castle className="w-3.5 h-3.5 text-amber-400" /> City Upgrade
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-base font-black text-amber-400">2 VP</div>
                    <div className="text-slate-400 flex items-center justify-center gap-1">
                      <Route className="w-3.5 h-3.5 text-amber-400" /> Longest Road
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-base font-black text-amber-400">2 VP</div>
                    <div className="text-slate-400 flex items-center justify-center gap-1">
                      <Swords className="w-3.5 h-3.5 text-amber-400" /> Largest Army
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Resources & Terrains */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5" />
                  The 5 Resources & 6 Terrains of Catan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-2.5">
                    <ResourceIcon resource="wood" size="lg" />
                    <div>
                      <div className="font-bold text-emerald-300">Forest &rarr; Lumber</div>
                      <div className="text-[10px] text-slate-400">Used for roads and settlements</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-center gap-2.5">
                    <ResourceIcon resource="brick" size="lg" />
                    <div>
                      <div className="font-bold text-amber-300">Hills &rarr; Brick</div>
                      <div className="text-[10px] text-slate-400">Used for roads and settlements</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-lime-950/20 border border-lime-800/40 flex items-center gap-2.5">
                    <ResourceIcon resource="sheep" size="lg" />
                    <div>
                      <div className="font-bold text-lime-300">Pasture &rarr; Wool</div>
                      <div className="text-[10px] text-slate-400">Used for settlements & dev cards</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-yellow-950/20 border border-yellow-800/40 flex items-center gap-2.5">
                    <ResourceIcon resource="wheat" size="lg" />
                    <div>
                      <div className="font-bold text-yellow-300">Fields &rarr; Grain (Wheat)</div>
                      <div className="text-[10px] text-slate-400">Used for settlements, cities, dev cards</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-2.5">
                    <ResourceIcon resource="ore" size="lg" />
                    <div>
                      <div className="font-bold text-slate-200">Mountains &rarr; Ore</div>
                      <div className="text-[10px] text-slate-400">Used for cities and dev cards</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center gap-2.5">
                    <ResourceIcon resource="desert" size="lg" />
                    <div>
                      <div className="font-bold text-stone-300">Desert &rarr; No Harvest</div>
                      <div className="text-[10px] text-slate-400">Barren land; starts with the Robber</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Setup Snake Draft Phase */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5" />
                  Initial Setup (The Snake Draft)
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    • <strong>Round 1 (Forward):</strong> Players 1 &rarr; 2 &rarr; 3 &rarr; 4 each place <strong>1 Settlement</strong> on an intersection and <strong>1 connecting Road</strong> on an adjacent path.
                  </p>
                  <p>
                    • <strong>Round 2 (Reverse):</strong> In reverse order (Player 4 &rarr; 3 &rarr; 2 &rarr; 1), each player places their <strong>2nd Settlement</strong> and <strong>connecting Road</strong>.
                  </p>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                    <strong className="text-amber-300 inline-flex items-center gap-1"><Gift className="w-3.5 h-3.5 inline text-amber-400" /> Starting Resources Bonus:</strong> The moment you place your 2nd settlement, you immediately collect <strong>1 resource card</strong> for each adjacent land tile! Choosing high-resource tiles for your 2nd settlement gives you a strong starting hand.
                  </div>
                </div>
              </div>

              {/* 4. Turn Sequence & Production Probabilities */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Dices className="w-3.5 h-3.5" />
                  Turn Sequence & Dice Probabilities (2d6)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-amber-300">1. Production Roll</span>
                    <p className="text-[11px] text-slate-400">
                      Roll two 6-sided dice. Hexes matching the sum yield resources. Settlements yield 1 card, cities yield 2 cards.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-300">2. Trade & Exchange</span>
                    <p className="text-[11px] text-slate-400">
                      Trade 4:1 with the Bank, 3:1 at general harbors, or 2:1 at specialized ports that you own.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-300">3. Build & Buy</span>
                    <p className="text-[11px] text-slate-400">
                      Construct roads, settlements, upgrade settlements into cities, or draw Development Cards.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-amber-300">Number Pips & Roll Odds:</strong> Number tokens have dot pips reflecting roll probabilities. Tokens <strong className="text-rose-400">6 and 8</strong> have 5 dots and are colored red (highest chance: 13.9% each!). Tokens 2 and 12 have only 1 dot (rarest chance: 2.8% each).
                </div>
              </div>

              {/* 5. Rolling a 7 & The Robber */}
              <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Rolling a 7: The Robber & Hand Limit Discard
                </div>
                <div className="text-xs text-rose-200/90 space-y-2 leading-relaxed">
                  <p>
                    • <strong>No Tile Harvest:</strong> Rolling a 7 generates zero resources from any board hexes.
                  </p>
                  <p>
                    • <strong>Discard Half if &gt; 7 Cards:</strong> ANY player (including the active roller) with <strong>more than 7 cards</strong> in hand must immediately select and discard <strong>half their cards rounded down</strong>:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-semibold text-rose-200">
                    <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-800/40">8 cards &rarr; Discard 4</div>
                    <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-800/40">9 cards &rarr; Discard 4</div>
                    <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-800/40">10 cards &rarr; Discard 5</div>
                    <div className="p-1.5 rounded-lg bg-rose-900/40 border border-rose-800/40">11 cards &rarr; Discard 5</div>
                  </div>
                  <p>
                    • <strong>Move the Robber:</strong> The roller moves the Robber token to any other land hex. <strong>That hex is now blocked:</strong> it produces no resources whenever its number is rolled until moved away!
                  </p>
                  <p>
                    • <strong>Stealing:</strong> The roller chooses one opponent with a settlement or city adjacent to the Robber's new hex and steals 1 random resource card from their hand.
                  </p>
                </div>
              </div>

              {/* 6. Building Costs & Distance Rule */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Building Costs & Placement Rules</span>
                  <span className="text-[10px] text-slate-400 font-normal">Check Hand Resources</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between font-bold text-slate-100">
                      <span className="flex items-center gap-1.5"><Route className="w-3.5 h-3.5 text-amber-400" /> Road</span>
                      <span className="text-amber-400">1 Wood + 1 Brick</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Must connect to your existing road, settlement, or city. Each edge can only hold 1 road. Max 15 roads per player.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between font-bold text-slate-100">
                      <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-amber-400" /> Settlement (1 VP)</span>
                      <span className="text-amber-400">1 Wood + 1 Brick + 1 Wool + 1 Grain</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Must connect to your road. Produces 1 card per harvest. Max 5 settlements.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between font-bold text-slate-100">
                      <span className="flex items-center gap-1.5"><Castle className="w-3.5 h-3.5 text-amber-400" /> City (+2 VP total)</span>
                      <span className="text-amber-400">2 Wheat + 3 Ore</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Upgrades an existing settlement. Doubles harvest yield to <strong>2 resource cards</strong> per roll! Max 4 cities.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between font-bold text-slate-100">
                      <span className="flex items-center gap-1.5"><Scroll className="w-3.5 h-3.5 text-amber-400" /> Development Card</span>
                      <span className="text-amber-400">1 Sheep + 1 Wheat + 1 Ore</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Draw a card from the deck: Knights, Progress Cards, or hidden Victory Point cards.
                    </p>
                  </div>
                </div>

                {/* THE DISTANCE RULE */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    The Distance Rule (Crucial Placement Law):
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    A settlement may <strong>ONLY</strong> be placed on an intersection if <strong>ALL 3 adjacent intersections</strong> (intersections directly connected by an edge) are completely unoccupied by any player's settlement or city. You can never build two settlements on neighboring vertices!
                  </p>
                </div>
              </div>

              {/* 7. Maritime & Harbor Trading */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5" />
                  Harbor & Port Trading (Maritime Trade)
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-100">Standard Bank Trade (4 : 1)</span>
                      <p className="text-[11px] text-slate-400">Available to all players at all times without owning any port.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs">4 of ANY same card for 1</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-300 flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5" /> General Harbor (3 : 1)
                      </span>
                      <p className="text-[11px] text-slate-400">Requires a Settlement or City built on a coastal 3:1 port vertex.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-xs">3 of ANY same card for 1</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5" /> Specialized 2:1 Ports
                      </span>
                      <p className="text-[11px] text-slate-400">Requires a Settlement or City on that specific resource port vertex (Wood, Brick, Sheep, Wheat, or Ore).</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs">2 MATCHING cards for 1</span>
                  </div>
                </div>
              </div>

              {/* 8. Development Cards Detail */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Development Cards Breakdown
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 space-y-1">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5" /> Knight (14 in deck)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Move the Robber to any hex, steal 1 card from an adjacent player, and build your Army.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/30 space-y-1">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5">
                      <Scroll className="w-3.5 h-3.5" /> Progress Cards (6)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      • <strong>Road Building:</strong> 2 free roads<br />
                      • <strong>Year of Plenty:</strong> 2 free bank resources<br />
                      • <strong>Monopoly:</strong> Claim all of 1 resource!
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" /> Victory Point (5)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Chapel, Library, Market, Great Hall, University. Each provides +1 secret VP toward the 10 VP win!
                    </p>
                  </div>
                </div>
              </div>

              {/* 9. Special 2 VP Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/70 border border-amber-500/30 p-3.5 rounded-2xl">
                  <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Longest Road (2 VP)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Awarded to the first player with a continuous, unbroken road network of at least <strong>5 road segments</strong>. If another player builds a longer road, the title and 2 VP transfer immediately!
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-purple-500/30 p-3.5 rounded-2xl">
                  <div className="text-purple-400 font-bold mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Largest Army (2 VP)
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Awarded to the first player to play at least <strong>3 Knight cards</strong>. If another player plays more knights, the title and 2 VP transfer immediately!
                  </p>
                </div>
              </div>

              {/* 10. Pro Strategy Tips */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 space-y-1">
                <strong className="text-emerald-300 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Settler Pro Tips:
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  • Diversify numbers: Avoid placing all settlements on the same dice numbers so you earn resources on nearly every turn.<br />
                  • Secure Brick & Lumber early to expand your road web before rivals box you in.<br />
                  • Ore and Wheat become crucial in mid-to-late game for City upgrades and Development Cards!
                </p>
              </div>
            </div>
          ) : (
            /* TICKET TO RIDE: EUROPE OFFICIAL RULEBOOK & ALMANAC */
            <div className="space-y-4">
              {/* 1. Game Objective */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                <h4 className="text-base font-bold text-amber-400 mb-1 flex items-center gap-2 font-['Fredoka']">
                  <Route className="w-4 h-4" /> Ticket to Ride: Europe — Game Objective
                </h4>
                <p className="text-xs">
                  Travel across turn-of-the-century Europe! Compete with fellow rail barons to connect iconic European cities, claim high-value railway routes across mountains and seas, complete secret Destination Tickets, and build the longest continuous railway across the continent.
                </p>
              </div>

              {/* 2. On Your Turn (4 Actions) */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Turn Sequence: Take Exactly 1 of 4 Actions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🃏</span> 1. Draw Train Car Cards
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Draw 2 train cards. You may choose face-up cards or blind cards from the top of the deck. If taking a face-up <strong>Locomotive (Wild)</strong>, it counts as your <em>entire</em> turn's draw.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🚂</span> 2. Claim a Route
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Discard a set of matching colored cards equal to the length of the route. Place your plastic train cars on the track and immediately score points on the board track.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🎫</span> 3. Draw Destination Tickets
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Draw 3 Destination Tickets from the top of the deck. You must keep <strong>at least 1</strong> ticket (up to all 3). Any returned tickets are placed on the bottom of the deck.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🚉</span> 4. Build a Train Station
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Place a station in any unoccupied city. Costs 1 card for 1st station, 2 matching cards for 2nd, 3 matching for 3rd. Allows you to borrow 1 opponent route into that city to complete tickets!
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Official Route Scoring Table */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Official Route Scoring Chart</span>
                  <span className="text-[10px] text-slate-400 font-normal">Immediate Points Upon Claim</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">1 Car</div>
                    <div className="text-amber-400 font-bold text-sm">1 Pt</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">2 Cars</div>
                    <div className="text-amber-400 font-bold text-sm">2 Pts</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">3 Cars</div>
                    <div className="text-amber-400 font-bold text-sm">4 Pts</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">4 Cars</div>
                    <div className="text-amber-400 font-bold text-sm">7 Pts</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">6 Cars</div>
                    <div className="text-amber-400 font-bold text-sm">15 Pts</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="text-amber-300 text-[10px]">8 Cars</div>
                    <div className="text-amber-300 font-bold text-sm">21 Pts!</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 italic text-center">
                  *The 8-car track between Stockholm and Petrograd is the single highest-scoring route on the board!
                </p>
              </div>

              {/* 4. Special Route Mechanics (Ferries & Tunnels) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/70 border border-blue-500/30 p-3.5 rounded-2xl space-y-1.5">
                  <div className="text-blue-400 font-bold flex items-center gap-1.5">
                    <Anchor className="w-4 h-4" /> Ferries (Water Crossing Routes)
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Ferries cross bodies of water (e.g., London–Dieppe, Palermo–Smyrna). Each ferry slot marked with an <strong>Anchor (⚓)</strong> requires a <strong>Locomotive card</strong> to claim. The remaining cars may be paid with cards matching the route color.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-amber-500/30 p-3.5 rounded-2xl space-y-1.5">
                  <div className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Castle className="w-4 h-4" /> Tunnels (Mountain Routes)
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Tunnels cut through mountain ranges. After you declare the route and play cards, <strong>3 cards are drawn from the train deck</strong>. For each drawn card that matches your route color or is a locomotive, you must pay <strong>1 additional card</strong> from your hand! If you cannot or choose not to, return your cards to hand without penalty.
                  </p>
                </div>
              </div>

              {/* 5. Destination Tickets & End-Game Scoring */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Destination Tickets & End-Game Scoring
                </div>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    • <strong>Completed Tickets:</strong> If you connect the two cities listed on your Destination Ticket with an unbroken path of your trains by the end of the game, <strong>add the ticket's point value</strong> to your score!
                  </p>
                  <p>
                    • <strong>Uncompleted Tickets:</strong> If you fail to connect the two cities, <strong>subtract that point value</strong> from your final score! Keep tickets carefully.
                  </p>
                  <p>
                    • <strong>Unused Train Stations:</strong> Each of your 3 Train Stations that was not built earns you <strong>+4 points</strong> at the end of the game (up to +12 points).
                  </p>
                  <p>
                    • <strong>European Express (+10 Points):</strong> Awarded to the player with the longest continuous unbroken path of train cars on the map!
                  </p>
                </div>
              </div>

              {/* 6. End of Game Trigger */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-200 space-y-1">
                <strong className="text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Game Conclusion Trigger:
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  When any player's supply of colored train cars drops to <strong>2 or fewer</strong> at the end of their turn, every player (including that player) gets <strong>one final turn</strong> before final scoring takes place!
                </p>
              </div>

              {/* 7. Pro Strategy Tips */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 space-y-1">
                <strong className="text-emerald-300 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Europe Master Railroader Tips:
                </strong>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  • <strong>Stockpile Locomotives:</strong> Ferries require wild locomotives, and tunnels may demand unexpected extra cards. Keep 2–3 locomotives in reserve.<br />
                  • <strong>Claim Chokepoints Early:</strong> Key transit hubs like Frankfurt, Wien, and Paris have limited parallel routes in smaller player counts. Claim critical bottleneck paths before rivals block you.<br />
                  • <strong>Watch Opponent Train Counts:</strong> Monitor how many train cars opponents have left so you aren't caught holding unfinished high-value tickets when the final round is triggered!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md"
          >
            Got it, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
