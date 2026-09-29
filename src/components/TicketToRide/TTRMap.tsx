import React from 'react';
import { Route, TTRGameState, TrainColor } from '../../games/ticket-to-ride/types';
import { INITIAL_ROUTES } from '../../games/ticket-to-ride/constants';
import { CITY_COORDINATES } from '../../games/ticket-to-ride/coordinates';

interface TTRMapProps {
  gameState: TTRGameState;
  onClaimRoute: (routeId: string) => void;
  hoveredCities?: [string, string] | null; // [city1, city2] of hovered ticket
}

const TRAIN_COLORS: Record<string, string> = {
  purple: '#9333ea',
  blue: '#2563eb',
  orange: '#f97316',
  white: '#f8fafc',
  green: '#16a34a',
  yellow: '#eab308',
  black: '#1e293b',
  red: '#ef4444',
  any: '#94a3b8',
};

export const TTRMap: React.FC<TTRMapProps> = ({ gameState, onClaimRoute, hoveredCities }) => {
  const routes = Object.values(gameState.routes);

  // Group routes between same cities to handle offsets (double routes)
  const routeGroups: Record<string, Route[]> = {};
  routes.forEach(route => {
    const key = [route.city1, route.city2].sort().join('-');
    if (!routeGroups[key]) routeGroups[key] = [];
    routeGroups[key].push(route);
  });

  return (
    <div className="w-full h-full relative overflow-auto bg-[#1e293b] rounded-xl border border-slate-700 shadow-inner">
      <svg
        viewBox="0 0 1200 900"
        className="w-full h-full min-w-[1000px]"
        style={{ backgroundColor: '#0f172a' }} // Water background
      >
        {/* Draw Routes */}
        {Object.values(routeGroups).map(group => {
          return group.map((route, idx) => {
            const p1 = CITY_COORDINATES[route.city1];
            const p2 = CITY_COORDINATES[route.city2];
            
            if (!p1 || !p2) return null;

            // Calculate angle and offset for double routes
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const angle = Math.atan2(dy, dx);
            
            // Offset perpendicular to the line
            let offsetX = 0;
            let offsetY = 0;
            if (group.length > 1) {
              const offsetDist = idx === 0 ? -8 : 8;
              offsetX = Math.cos(angle + Math.PI / 2) * offsetDist;
              offsetY = Math.sin(angle + Math.PI / 2) * offsetDist;
            }

            const isClaimed = !!route.claimedBy;
            const claimedColor = isClaimed ? (gameState.players[route.claimedBy!]?.color || '#fff') : undefined;
            const strokeColor = isClaimed ? claimedColor : TRAIN_COLORS[route.color];

            return (
              <g 
                key={route.id} 
                className={!isClaimed ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                onClick={() => !isClaimed && onClaimRoute(route.id)}
              >
                <title>
                  {route.city1} to {route.city2}
                  {isClaimed 
                    ? `\nClaimed` 
                    : `\nRequires ${route.length} ${route.color === 'any' ? 'matching' : route.color} card${route.length > 1 ? 's' : ''}`}
                </title>
                {/* Thick background for hit area */}
                <line
                  x1={p1.x + offsetX}
                  y1={p1.y + offsetY}
                  x2={p2.x + offsetX}
                  y2={p2.y + offsetY}
                  stroke="transparent"
                  strokeWidth="20"
                />
                {/* Actual route line */}
                <line
                  x1={p1.x + offsetX}
                  y1={p1.y + offsetY}
                  x2={p2.x + offsetX}
                  y2={p2.y + offsetY}
                  stroke={isClaimed ? '#000' : '#334155'}
                  strokeWidth={isClaimed ? 12 : 8}
                  strokeLinecap="round"
                />
                <line
                  x1={p1.x + offsetX}
                  y1={p1.y + offsetY}
                  x2={p2.x + offsetX}
                  y2={p2.y + offsetY}
                  stroke={strokeColor}
                  strokeWidth={isClaimed ? 8 : 4}
                  strokeLinecap="round"
                  strokeDasharray={isClaimed ? 'none' : '10, 10'} // Dotted if unclaimed to represent segments
                />
                
                {/* Icons for ferries / tunnels */}
                {!isClaimed && (route.locomotivesRequired || route.isTunnel) && (
                  <circle 
                    cx={p1.x + dx/2 + offsetX} 
                    cy={p1.y + dy/2 + offsetY} 
                    r="8" 
                    fill="#1e293b" 
                    stroke={strokeColor}
                    strokeWidth="2"
                  />
                )}
                {!isClaimed && route.locomotivesRequired && (
                  <text x={p1.x + dx/2 + offsetX} y={p1.y + dy/2 + offsetY + 3} fontSize="10" textAnchor="middle" fill="#fff">⛴</text>
                )}
                {!isClaimed && route.isTunnel && !route.locomotivesRequired && (
                  <text x={p1.x + dx/2 + offsetX} y={p1.y + dy/2 + offsetY + 3} fontSize="10" textAnchor="middle" fill="#fff">⛰</text>
                )}
              </g>
            );
          });
        })}

        {/* Draw Cities */}
        {Object.entries(CITY_COORDINATES).map(([cityName, pos]) => {
          const isHighlighted = hoveredCities && (cityName === hoveredCities[0] || cityName === hoveredCities[1]);
          return (
            <g key={cityName}>
              {isHighlighted && (
                <circle cx={pos.x} cy={pos.y} r="14" fill="#fbbf24" opacity="0.35" />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHighlighted ? 8 : 6}
                fill={isHighlighted ? '#fbbf24' : '#ef4444'}
                stroke="#fff"
                strokeWidth={isHighlighted ? 3 : 2}
              />
              <text
                x={pos.x}
                y={pos.y - 12}
                fill={isHighlighted ? '#fbbf24' : '#e2e8f0'}
                fontSize={isHighlighted ? 13 : 12}
                fontWeight="bold"
                textAnchor="middle"
                className="drop-shadow-md pointer-events-none select-none"
                style={{ textShadow: '1px 1px 3px #000' }}
              >
                {cityName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
