import React, { useState } from 'react';
import {
  DICE_PIPS,
  PLAYER_COLORS,
  RESOURCE_DETAILS,
} from '../../games/catan/constants';
import {
  canPlaceCity,
  canPlaceRoad,
  canPlaceSettlement,
} from '../../games/catan/engine';
import {
  CatanGameState,
  ResourceType,
} from '../../games/catan/types';
import { sounds } from '../../services/audio';
import {
  HexTerrainVector,
  RobberVector,
  PortGraphicSvg,
} from './CatanIcons';

interface CatanBoardProps {
  state: CatanGameState;
  myPlayerId: string;
  activeBuildMode: 'road' | 'settlement' | 'city' | 'robber' | null;
  producingHexIds?: number[];
  onSelectVertex: (vertexId: number) => void;
  onSelectEdge: (edgeId: number) => void;
  onSelectHex: (hexId: number) => void;
}

export const CatanBoard: React.FC<CatanBoardProps> = ({
  state,
  myPlayerId,
  activeBuildMode,
  producingHexIds = [],
  onSelectVertex,
  onSelectEdge,
  onSelectHex,
}) => {
  const [hoveredVertexId, setHoveredVertexId] = useState<number | null>(null);

  const isMyTurn =
    state.players[state.currentTurnIndex]?.id === myPlayerId &&
    !state.players[state.currentTurnIndex]?.isBot;

  // Determine selectable vertices
  const isVertexSelectable = (vId: number) => {
    if (!isMyTurn) return false;
    if (
      state.turnPhase === 'setup-settlement-1' ||
      state.turnPhase === 'setup-settlement-2' ||
      activeBuildMode === 'settlement'
    ) {
      return canPlaceSettlement(state, vId, myPlayerId);
    }
    if (activeBuildMode === 'city') {
      return canPlaceCity(state, vId, myPlayerId);
    }
    return false;
  };

  // Determine selectable edges
  const isEdgeSelectable = (eId: number) => {
    if (!isMyTurn) return false;
    const hasFreeRoads = Boolean(state.freeRoadsRemaining && state.freeRoadsRemaining > 0);
    if (
      state.turnPhase === 'setup-road-1' ||
      state.turnPhase === 'setup-road-2' ||
      activeBuildMode === 'road' ||
      (state.turnPhase === 'main' && hasFreeRoads)
    ) {
      return canPlaceRoad(state, eId, myPlayerId);
    }
    return false;
  };

  // Hex corner helper (pointy-topped hex, radius 54)
  const R = 54;
  const cornersDeg = [-90, -30, 30, 90, 150, 210];
  const getHexPoints = (cx: number, cy: number) =>
    cornersDeg
      .map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return `${cx + R * Math.cos(rad)},${cy + R * Math.sin(rad)}`;
      })
      .join(' ');

  return (
    <div className="relative w-full aspect-square max-w-[530px] mx-auto select-none flex items-center justify-center p-1">
      <svg
        viewBox="80 30 520 500"
        className="w-full h-full drop-shadow-2xl overflow-visible"
      >
        <defs>
          <style>{`
            @keyframes hexHarvestPulse {
              0%, 100% {
                fill-opacity: 0.15;
                stroke-width: 4px;
                stroke: #fbbf24;
              }
              50% {
                fill-opacity: 0.55;
                stroke-width: 7px;
                stroke: #fef08a;
              }
            }
            .hex-blink-pulse {
              animation: hexHarvestPulse 1s ease-in-out infinite;
            }
          `}</style>

          {/* Subtle ocean sea background gradient */}
          <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Hex 3D Lighting Filter */}
          <filter id="hexShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.4" />
          </filter>

          {/* Harvest Glow Filter */}
          <filter id="harvestGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f59e0b" floodOpacity="0.8" />
          </filter>

          {/* Building Shadow Filter */}
          <filter id="buildingShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* Ocean Background ring */}
        <circle cx="340" cy="280" r="230" fill="url(#oceanGrad)" stroke="#1e293b" strokeWidth="4" />

        {/* 0. Coastal Ports (Harbors) */}
        {(state.ports || []).map((port) => {
          const v1 = state.vertices[port.v1];
          const v2 = state.vertices[port.v2];
          if (!v1 || !v2) return null;

          // Check if my player owns this port (has building on either vertex)
          const isOwnedByMe =
            (v1.owner === myPlayerId && !!v1.type) || (v2.owner === myPlayerId && !!v2.type);
          const ownerPlayer = state.players.find(
            (p) => (v1.owner === p.id && !!v1.type) || (v2.owner === p.id && !!v2.type)
          );

          return (
            <g key={`port-${port.id}`} className="select-none pointer-events-none">
              {/* Wooden pier bridges to the two coastal vertices */}
              <line
                x1={v1.x}
                y1={v1.y}
                x2={port.x}
                y2={port.y}
                stroke="#78350f"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="3 2"
              />
              <line
                x1={v2.x}
                y1={v2.y}
                x2={port.x}
                y2={port.y}
                stroke="#78350f"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="3 2"
              />

              {/* Port Harbor Badge */}
              <circle
                cx={port.x}
                cy={port.y}
                r="17"
                fill={isOwnedByMe ? '#0284c7' : ownerPlayer ? '#1e293b' : '#0f172a'}
                stroke={isOwnedByMe ? '#38bdf8' : ownerPlayer ? PLAYER_COLORS[ownerPlayer.color]?.hex || '#475569' : '#334155'}
                strokeWidth={isOwnedByMe ? '2.5' : '1.5'}
                filter="url(#hexShadow)"
              />
              <PortGraphicSvg type={port.type} x={port.x} y={port.y} />
            </g>
          );
        })}

        {/* 1. Hexes */}
        {state.hexes.map((hex) => {
          const detail = RESOURCE_DETAILS[hex.terrain];
          const isRobberSelectable = isMyTurn && (state.turnPhase === 'robber-move' || activeBuildMode === 'robber');
          const isRobberHere = hex.hasRobber;
          const isRobberNeedsMoving = (state.turnPhase === 'robber-move' || activeBuildMode === 'robber') && isRobberHere;
          const isProducing = producingHexIds.includes(hex.id);

          return (
            <g
              key={`hex-${hex.id}`}
              onClick={() => {
                if (isRobberSelectable && hex.id !== state.robberHexId) {
                  sounds.playSnap();
                  onSelectHex(hex.id);
                }
              }}
              className={isRobberSelectable && hex.id !== state.robberHexId ? 'cursor-pointer' : ''}
            >
              {/* Hex Polygon */}
              <polygon
                points={getHexPoints(hex.x, hex.y)}
                fill={detail.bg}
                stroke={isProducing ? '#f59e0b' : isRobberSelectable && hex.id !== state.robberHexId ? '#f59e0b' : detail.border}
                strokeWidth={isProducing ? '5' : isRobberSelectable && hex.id !== state.robberHexId ? '3' : '2'}
                filter={isProducing ? 'url(#harvestGlow)' : 'url(#hexShadow)'}
                className={isProducing ? 'transition-all hex-blink-pulse brightness-110' : 'transition-colors hover:brightness-105'}
              />

              {/* Blinking Harvest Overlay */}
              {isProducing && (
                <g className="pointer-events-none select-none">
                  {/* High-visibility pulsating harvest zone */}
                  <polygon
                    points={getHexPoints(hex.x, hex.y)}
                    fill="#fbbf24"
                    fillOpacity="0.3"
                    stroke="#fde047"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    className="hex-blink-pulse"
                  />
                  <g transform={`translate(${hex.x}, ${hex.y - 34})`} className="animate-bounce">
                    <rect
                      x="-36"
                      y="-9"
                      width="72"
                      height="18"
                      rx="9"
                      fill="#b45309"
                      stroke="#fef08a"
                      strokeWidth="1.5"
                      filter="url(#hexShadow)"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8.5"
                      fontWeight="900"
                      fill="#ffffff"
                      fontFamily="'Fredoka', sans-serif"
                    >
                      HARVEST YIELD
                    </text>
                  </g>
                </g>
              )}

              {/* Terrain Vector Graphic (SVG) */}
              <HexTerrainVector
                terrain={hex.terrain}
                x={hex.x}
                y={hex.y}
                hasNumber={Boolean(hex.number)}
              />

              {/* Number Token (if not desert) */}
              {hex.number && (
                <g className="pointer-events-none select-none">
                  <circle
                    cx={hex.x}
                    cy={hex.y + 12}
                    r="15"
                    fill="#fef3c7"
                    stroke="#b45309"
                    strokeWidth="1.5"
                  />
                  {/* Number text: Red for 6 & 8, Dark Slate for others */}
                  <text
                    x={hex.x}
                    y={hex.y + 10}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={hex.number === 6 || hex.number === 8 ? '15' : '13'}
                    fontWeight="bold"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#1e293b'}
                    fontFamily="'Fredoka', sans-serif"
                  >
                    {hex.number}
                  </text>

                  {/* Dice Probability Pips */}
                  <text
                    x={hex.x}
                    y={hex.y + 21}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="bold"
                    fill={hex.number === 6 || hex.number === 8 ? '#dc2626' : '#64748b'}
                  >
                    {'•'.repeat(DICE_PIPS[hex.number] || 1)}
                  </text>
                </g>
              )}

              {/* The Robber - Jumping animation when player must move it, steady otherwise */}
              {isRobberHere && (
                <g className={isRobberNeedsMoving ? 'animate-bounce cursor-pointer' : 'pointer-events-none select-none'}>
                  {/* Warning Beacon when robber needs to be moved */}
                  {isRobberNeedsMoving && (
                    <circle
                      cx={hex.x}
                      cy={hex.y}
                      r="20"
                      fill="#ef4444"
                      fillOpacity="0.2"
                      stroke="#ef4444"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                  )}
                  {/* Robber solid dark outer rim */}
                  <circle
                    cx={hex.x}
                    cy={hex.y}
                    r="16"
                    fill="#0f172a"
                    stroke="#ef4444"
                    strokeWidth={isRobberNeedsMoving ? '3' : '2.5'}
                  />
                  {/* Robber inner core */}
                  <circle
                    cx={hex.x}
                    cy={hex.y}
                    r="11"
                    fill="#1e293b"
                  />
                  <RobberVector x={hex.x} y={hex.y} />
                  {/* Move Me Attention Badge */}
                  {isRobberNeedsMoving && (
                    <g transform={`translate(${hex.x}, ${hex.y - 25})`}>
                      <rect
                        x="-28"
                        y="-9"
                        width="56"
                        height="18"
                        rx="9"
                        fill="#b91c1c"
                        stroke="#fca5a5"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="900"
                        fill="#ffffff"
                        fontFamily="'Fredoka', sans-serif"
                      >
                        MOVE ME
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 2. Edges (Roads) */}
        {state.edges.map((edge) => {
          const ownerPlayer = state.players.find((p) => p.id === edge.owner);
          const selectable = isEdgeSelectable(edge.id);

          return (
            <g
              key={`edge-${edge.id}`}
              onClick={() => {
                if (selectable) {
                  sounds.playSnap();
                  onSelectEdge(edge.id);
                }
              }}
              className={selectable ? 'cursor-pointer group' : ''}
            >
              {/* Hit area for clicking */}
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="transparent"
                strokeWidth="18"
              />

              {/* Built Road - Rendered with double-stroke tactile wooden beam (ZERO filter clipping so vertical paths never disappear) */}
              {ownerPlayer && (
                <g>
                  {/* Dark base outline */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#020617"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  {/* Colored wooden road beam */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={PLAYER_COLORS[ownerPlayer.color]?.hex || '#ffffff'}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* 3D wooden edge sheen */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeOpacity="0.4"
                  />
                </g>
              )}

              {/* Road Placement Highlight */}
              {selectable && (
                <g>
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#0284c7"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#38bdf8"
                    strokeWidth="5"
                    strokeDasharray="6 3"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* 3. Vertices (Settlements & Cities) */}
        {state.vertices.map((vertex) => {
          const ownerPlayer = state.players.find((p) => p.id === vertex.owner);
          const selectable = isVertexSelectable(vertex.id);
          const isAdjacentToProducingHex = vertex.hexIds.some((hId) => producingHexIds.includes(hId));

          const startingResources =
            state.turnPhase === 'setup-settlement-2' && selectable
              ? vertex.hexIds
                  .map((hId) => state.hexes[hId])
                  .filter((h) => h && h.terrain !== 'desert')
                  .map((h) => h.terrain as ResourceType)
              : [];

          return (
            <g
              key={`vertex-${vertex.id}`}
              onClick={() => {
                if (selectable) {
                  sounds.playSnap();
                  onSelectVertex(vertex.id);
                }
              }}
              onMouseEnter={() => {
                if (selectable) setHoveredVertexId(vertex.id);
              }}
              onMouseLeave={() => {
                if (hoveredVertexId === vertex.id) setHoveredVertexId(null);
              }}
              className={selectable ? 'cursor-pointer group' : ''}
            >
              {/* Hit target circle */}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r="14"
                fill="transparent"
              />

              {/* Port Emblem Indicator if vertex has port */}
              {vertex.port && !vertex.owner && (
                <circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="5"
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              )}

              {/* Built Building (Settlement or City) */}
              {ownerPlayer && (
                <g filter="url(#buildingShadow)">
                  {vertex.type === 'city' ? (
                    // City: Church / Cathedral shape
                    <g transform={`translate(${vertex.x - 12}, ${vertex.y - 12})`}>
                      <path
                        d="M 3 10 L 3 22 L 21 22 L 21 10 L 16 5 L 12 10 L 8 5 Z"
                        fill={PLAYER_COLORS[ownerPlayer.color]?.hex || '#fff'}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* Fortress Battlements & Spires */}
                      <path
                        d="M 6 14 L 6 18 M 18 14 L 18 18 M 12 14 L 12 21"
                        stroke="#0f172a"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="7" r="1.2" fill="#0f172a" />
                    </g>
                  ) : (
                    // Settlement: Classic wooden house
                    <g transform={`translate(${vertex.x - 10}, ${vertex.y - 10})`}>
                      <path
                        d="M 2 9 L 10 2 L 18 9 L 18 19 L 2 19 Z"
                        fill={PLAYER_COLORS[ownerPlayer.color]?.hex || '#fff'}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* Harvest Yield Beacon (+1 or +2) when connected to producing hex */}
              {ownerPlayer && isAdjacentToProducingHex && (
                <g className="pointer-events-none select-none">
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="15"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    className="hex-blink-pulse"
                  />
                  <g transform={`translate(${vertex.x + 8}, ${vertex.y - 11})`} className="animate-bounce">
                    <rect
                      x="-7"
                      y="-7"
                      width="14"
                      height="14"
                      rx="7"
                      fill="#b45309"
                      stroke="#fef08a"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      fontWeight="900"
                      fill="#ffffff"
                      fontFamily="'Fredoka', sans-serif"
                    >
                      +{vertex.type === 'city' ? '2' : '1'}
                    </text>
                  </g>
                </g>
              )}

              {/* Vertex Placement Target Highlight - Clean, steady, calm node with NO blinking or strobing */}
              {selectable && (
                <g className="cursor-pointer">
                  {/* Steady calm aura */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="8"
                    fill="#38bdf8"
                    fillOpacity="0.25"
                  />
                  {/* Steady target node */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="5"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Center pin */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r="2"
                    fill="#0f172a"
                  />

                  {/* Starting Resources Hover Preview in Setup Round 2 */}
                  {state.turnPhase === 'setup-settlement-2' &&
                    hoveredVertexId === vertex.id &&
                    startingResources.length > 0 && (
                      <g
                        transform={`translate(${vertex.x}, ${vertex.y - 20})`}
                        className="pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150"
                      >
                        <rect
                          x={-(startingResources.length * 9 + 14)}
                          y="-10"
                          width={startingResources.length * 18 + 28}
                          height="20"
                          rx="10"
                          fill="#0f172a"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          filter="url(#buildingShadow)"
                        />
                        {/* Vector Gift Box Icon */}
                        <g transform={`translate(${-(startingResources.length * 9) - 6}, -5)`}>
                          <rect x="0" y="3" width="9" height="7" rx="1" fill="#fbbf24" />
                          <rect x="-0.5" y="1" width="10" height="2" rx="0.5" fill="#f59e0b" />
                          <line x1="4.5" y1="1" x2="4.5" y2="10" stroke="#b45309" strokeWidth="1" />
                        </g>
                        {startingResources.map((res, rIdx) => {
                          const det = RESOURCE_DETAILS[res];
                          return (
                            <g
                              key={rIdx}
                              transform={`translate(${-(startingResources.length * 9) + 12 + rIdx * 16}, -5)`}
                            >
                              <circle cx="5" cy="5" r="5.5" fill={det.bg} stroke={det.border} strokeWidth="1" />
                              <text
                                x="5"
                                y="6"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="6.5"
                                fontWeight="900"
                                fill="#ffffff"
                                fontFamily="'Fredoka', sans-serif"
                              >
                                {res[0].toUpperCase()}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
