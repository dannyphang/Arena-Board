import React, { useState } from 'react';
import { MrJackGameState, CharacterId, HexCoord, Role } from '../../games/mr-jack/types';
import { CHARACTERS, EXITS } from '../../games/mr-jack/constants';
import {
  WHITECHAPEL_HEXES,
  BUILDING_HEXES,
  EXITS_CONFIG,
  WATSON_DIRECTION_LABELS,
} from '../../games/mr-jack/topology';
import { isCharacterVisible, getWatsonBeam } from '../../games/mr-jack/engine';
import { sounds } from '../../services/audio';
import {
  Eye,
  EyeOff,
  ShieldAlert,
  Compass,
  Zap,
  Building2,
  Flame,
  DoorOpen,
  CircleDot,
  RotateCw,
} from 'lucide-react';

interface MrJackBoardProps {
  gameState: MrJackGameState;
  userRole: Role;
  reachableHexes: number[];
  selectedHex: number | null;
  onHexClick: (hexId: number) => void;
  onCharacterClick?: (charId: CharacterId) => void;
  onRotateWatson?: (newFacing: 0 | 1 | 2 | 3 | 4 | 5) => void;
}

export const MrJackBoard: React.FC<MrJackBoardProps> = ({
  gameState,
  userRole,
  reachableHexes,
  selectedHex,
  onHexClick,
  onCharacterClick,
  onRotateWatson,
}) => {
  const [hoverHex, setHoverHex] = useState<number | null>(null);

  // Map characters by hex
  const charHexMap = new Map<number, CharacterId>();
  Object.values(gameState.characters).forEach((char) => {
    charHexMap.set(char.hex, char.id);
  });

  // Map gaslights by hex
  const gaslightMap = new Map<number, { isLit: boolean; id: number }>();
  gameState.gaslights.forEach((g) => {
    gaslightMap.set(g.hex, { isLit: g.isLit, id: g.id });
  });

  // Map manholes by hex
  const manholeMap = new Map<number, { isOpen: boolean; id: number }>();
  gameState.manholes.forEach((m) => {
    manholeMap.set(m.hex, { isOpen: m.isOpen, id: m.id });
  });

  // Blocked exits
  const blockedExitIndices = new Set(gameState.cordons.map((c) => c.exitIndex));

  // Watson's beam
  const watson = gameState.characters['watson'];
  const watsonFacing = watson?.watsonFacing ?? 4;
  const watsonBeamHexes = watson
    ? getWatsonBeam(watson.hex, watsonFacing, gameState.gaslights)
    : [];
  const watsonBeamSet = new Set(watsonBeamHexes);

  const reachableSet = new Set(reachableHexes);

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-4xl overflow-x-auto pb-4">
      {/* Victorian Whitechapel Street Hex Grid */}
      <div className="relative bg-gradient-to-br from-slate-950 via-stone-950 to-slate-900 border-4 border-amber-950/80 p-3 sm:p-5 rounded-3xl shadow-2xl ring-1 ring-amber-500/20 w-full max-w-[860px]">
        {/* Board Top Header / Controls Info */}
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3 px-2">
          <div className="flex items-center gap-3">
            <span className="font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Whitechapel District (1888)
            </span>
            <span className="text-[11px] text-slate-400">86 Hex Topology</span>
          </div>

          {/* Watson direction rotator shortcut if Watson is active */}
          {gameState.activeCharacterId === 'watson' && onRotateWatson && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-300">
                Lantern: {WATSON_DIRECTION_LABELS[watsonFacing]?.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playPop();
                  const nextFacing = ((watsonFacing + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5;
                  onRotateWatson(nextFacing);
                }}
                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer flex items-center gap-1 transition"
                title="Rotate Watson's Lantern Direction"
              >
                <RotateCw className="w-3 h-3" /> Rotate
              </button>
            </div>
          )}
        </div>

        {/* Authentic SVG Map Container */}
        <div className="relative w-full aspect-[856/720] rounded-2xl overflow-hidden shadow-inner border border-stone-800 bg-[#16120e]">
          <svg
            viewBox="0 0 856 720"
            className="w-full h-full drop-shadow-md"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Map background image from repo */}
            <image
              href="/mrjack/map.jpg"
              x="0"
              y="0"
              width="856"
              height="720"
              preserveAspectRatio="none"
              className="opacity-100"
            />

            {/* Watson's Lantern Beam Highlights */}
            {watsonBeamHexes.map((hexId) => {
              const node = WHITECHAPEL_HEXES[hexId];
              if (!node) return null;
              return (
                <polygon
                  key={`watson-beam-${hexId}`}
                  points={node.points}
                  fill="rgba(251, 191, 36, 0.28)"
                  stroke="rgba(245, 158, 11, 0.7)"
                  strokeWidth="2"
                  className="pointer-events-none animate-pulse"
                />
              );
            })}

            {/* Lit Gaslight Auras */}
            {gameState.gaslights
              .filter((g) => g.isLit)
              .map((g) => {
                const node = WHITECHAPEL_HEXES[g.hex];
                if (!node) return null;
                return (
                  <circle
                    key={`aura-${g.id}`}
                    cx={node.cx}
                    cy={node.cy}
                    r="46"
                    fill="url(#gaslight-glow)"
                    className="pointer-events-none opacity-80"
                  />
                );
              })}

            {/* SVG Defs for Glow Gradients */}
            <defs>
              <radialGradient id="gaslight-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="reachable-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Hex Mesh */}
            {WHITECHAPEL_HEXES.map((node) => {
              const hexId = node.id;
              const isBldg = BUILDING_HEXES.has(hexId);
              const isReachable = reachableSet.has(hexId);
              const isSelected = selectedHex === hexId;
              const isHovered = hoverHex === hexId;
              const charId = charHexMap.get(hexId);
              const gaslight = gaslightMap.get(hexId);
              const manhole = manholeMap.get(hexId);

              return (
                <g
                  key={hexId}
                  onClick={() => onHexClick(hexId)}
                  onMouseEnter={() => setHoverHex(hexId)}
                  onMouseLeave={() => setHoverHex(null)}
                  className={`transition-all duration-150 ${
                    isReachable
                      ? 'cursor-pointer'
                      : charId
                      ? 'cursor-pointer'
                      : isBldg
                      ? 'cursor-not-allowed'
                      : 'cursor-default'
                  }`}
                >
                  {/* Hex Polygon: transparent by default to avoid doubling the map.jpg background artwork! */}
                  <polygon
                    points={node.points}
                    fill={
                      isSelected
                        ? 'rgba(245, 158, 11, 0.45)'
                        : isReachable
                        ? isHovered
                          ? 'rgba(16, 185, 129, 0.55)'
                          : 'rgba(16, 185, 129, 0.35)'
                        : 'transparent'
                    }
                    stroke={
                      isSelected
                        ? '#fbbf24'
                        : isReachable
                        ? '#34d399'
                        : 'none'
                    }
                    strokeWidth={isSelected ? '3' : isReachable ? '2.5' : '0'}
                    className={isReachable ? 'animate-pulse' : ''}
                  />

                  {/* Reachable Marker Indicator */}
                  {isReachable && !charId && (
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r="7"
                      fill="#10b981"
                      stroke="#ecfdf5"
                      strokeWidth="2"
                      className="pointer-events-none drop-shadow"
                    />
                  )}

                  {/* Covered Sewer Manholes (block.png from repo) - open manholes are already drawn in map art */}
                  {manhole && !manhole.isOpen && (
                    <g className="pointer-events-none">
                      <image
                        href="/mrjack/block.png"
                        x={node.cx - 18}
                        y={node.cy - 18}
                        width="36"
                        height="36"
                        className="drop-shadow-md"
                      />
                    </g>
                  )}

                  {/* Gaslights */}
                  {gaslight && (
                    <g className="pointer-events-none">
                      <image
                        href={
                          gaslight.isLit
                            ? gaslight.id <= 4
                              ? `/mrjack/light${gaslight.id}.png`
                              : `/mrjack/light.png`
                            : `/mrjack/clight.png`
                        }
                        x={node.cx - 18}
                        y={node.cy - 18}
                        width="36"
                        height="36"
                        className={gaslight.isLit ? 'drop-shadow-lg' : 'opacity-65 drop-shadow'}
                      />
                    </g>
                  )}

                  {/* Character Token */}
                  {charId && (() => {
                    const charDef = CHARACTERS[charId];
                    const charState = gameState.characters[charId];
                    const isExonerated = charState?.isExonerated;
                    const tokenImg = isExonerated
                      ? charDef.innocentTokenImage
                      : charDef.suspectTokenImage;
                    const isVisible = isCharacterVisible(charId, gameState);
                    const isWatson = charId === 'watson';

                    return (
                      <g
                        key={`char-${charId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onCharacterClick) onCharacterClick(charId);
                          else onHexClick(hexId);
                        }}
                        className="cursor-pointer group"
                      >
                        {/* Watson Direction Pointer Ring */}
                        {isWatson && (
                          <g transform={`rotate(${WATSON_DIRECTION_LABELS[watsonFacing]?.angleDeg ?? 0}, ${node.cx}, ${node.cy})`}>
                            <polygon
                              points={`${node.cx + 25},${node.cy} ${node.cx + 17},${node.cy - 5} ${node.cx + 17},${node.cy + 5}`}
                              fill="#f59e0b"
                              stroke="#78350f"
                              strokeWidth="1"
                            />
                          </g>
                        )}

                        {/* Light growing outline on hover (no bouncing scale) */}
                        <circle
                          cx={node.cx}
                          cy={node.cy}
                          r="22"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2.5"
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                        />

                        {/* Character Circular Token Image from repo */}
                        <image
                          href={tokenImg}
                          x={node.cx - 20}
                          y={node.cy - 20}
                          width="40"
                          height="40"
                          className="drop-shadow-lg"
                        />

                        {/* Visibility Pill Badge */}
                        <g transform={`translate(${node.cx + 10}, ${node.cy - 18})`}>
                          <circle
                            cx="0"
                            cy="0"
                            r="7"
                            fill={isVisible ? '#f59e0b' : '#312e81'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="drop-shadow"
                          />
                          {isVisible ? (
                            <path
                              d="M -3 0 Q 0 -3 3 0 Q 0 3 -3 0 M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0"
                              fill="#ffffff"
                            />
                          ) : (
                            <path
                              d="M -3 -3 L 3 3 M -3 0 Q 0 -2 3 0"
                              stroke="#ffffff"
                              strokeWidth="1.2"
                              fill="none"
                            />
                          )}
                        </g>

                        {/* Exonerated Badge */}
                        {isExonerated && (
                          <g transform={`translate(${node.cx - 10}, ${node.cy + 14})`}>
                            <rect
                              x="-14"
                              y="-5"
                              width="28"
                              height="10"
                              rx="5"
                              fill="#059669"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="6"
                              fontWeight="bold"
                            >
                              CLEAR
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })()}
                </g>
              );
            })}

            {/* 4 Exits with Police Cordons */}
            {EXITS_CONFIG.map((exit) => {
              const isBlocked = blockedExitIndices.has(exit.id);
              if (!isBlocked) return null; // Open exits are naturally illustrated on map.jpg

              return (
                <g
                  key={`exit-${exit.id}`}
                  transform={`translate(${exit.x}, ${exit.y}) rotate(${exit.rotation || 0})`}
                  className="cursor-pointer"
                  onClick={() => onHexClick(exit.hex)}
                >
                  {/* Authentic Police Cordon Barricade (way.png from repo) */}
                  <image
                    href="/mrjack/way.png"
                    x="0"
                    y="0"
                    width="96"
                    height="50"
                    className="drop-shadow-2xl hover:scale-105 transition-transform"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Board Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Lit by Gaslight/Lantern
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
              In the Shadows (Unseen)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Cleared Innocent Suspect
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Exits:</span>
            {EXITS.map((e) => (
              <span
                key={e.index}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  blockedExitIndices.has(e.index)
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                {e.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
