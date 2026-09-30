import React, { useState, useRef, useMemo } from 'react';
import { Route, TTRGameState, TrainColor } from '../../games/ticket-to-ride/types';
import { CITY_COORDINATES, CityPos } from '../../games/ticket-to-ride/coordinates';
import { INITIAL_ROUTES } from '../../games/ticket-to-ride/constants';
import { ZoomIn, ZoomOut, RotateCcw, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface TTRMapProps {
  gameState: TTRGameState;
  onClaimRoute: (routeId: string) => void;
  hoveredCities?: [string, string] | null;
  currentUserId?: string;
  isMyTurn?: boolean;
}

// Consistent standard geometry constants
const CAR_LENGTH = 22;
const CAR_WIDTH = 11;
const CITY_CLEARANCE = 17; // Clean margin from city center so tracks never overlap city hubs
const TRACK_BED_WIDTH = 14; // Uniform stroke width for all track beds

// High-contrast color palette matching the authentic Ticket to Ride Europe board (Image 1)
// With distinct borders and ties so Black, Grey, White and all colors are 100% visible on parchment
const TRAIN_COLORS: Record<string, { fill: string; border: string; tie: string; text: string; label: string }> = {
  purple: { fill: '#9333ea', border: '#4c1d95', tie: '#f3e8ff', text: '#fff', label: 'Purple' },
  blue: { fill: '#2563eb', border: '#1e3a8a', tie: '#dbeafe', text: '#fff', label: 'Blue' },
  orange: { fill: '#ea580c', border: '#7c2d12', tie: '#ffedd5', text: '#fff', label: 'Orange' },
  white: { fill: '#ffffff', border: '#0f172a', tie: '#64748b', text: '#0f172a', label: 'White' },
  green: { fill: '#16a34a', border: '#14532d', tie: '#dcfce7', text: '#fff', label: 'Green' },
  yellow: { fill: '#eab308', border: '#713f12', tie: '#fef9c3', text: '#0f172a', label: 'Yellow' },
  black: { fill: '#0f172a', border: '#f8fafc', tie: '#cbd5e1', text: '#fff', label: 'Black' }, // High-contrast crisp white border + silver ties
  red: { fill: '#dc2626', border: '#7f1d1d', tie: '#fee2e2', text: '#fff', label: 'Red' },
  any: { fill: '#64748b', border: '#1e293b', tie: '#f8fafc', text: '#fff', label: 'Gray / Any' }, // Distinct stone/slate grey with dark border & white ties
};

// Route curvatures for natural curved railway tracks (avoiding label overlap & geographic collisions)
const ROUTE_SPECIFIC_CURVES: Record<string, number> = {
  // Bay of Biscay & Atlantic sea routes
  'brest-pamplona': -55,
  'brest-dieppe': -18,
  'dieppe-bruxelles': -12,
  'lisboa-cadiz': -28,
  'barcelona-marseille': -24,

  // North Sea & Scandinavian waters
  'london-amsterdam': -26,
  'essen-kobenhavn': -25,
  'stockholm-petrograd': -38,
  'kobenhavn-stockholm': -14,
  'kobenhavn-oslo': 14,

  // Mediterranean & Italian sea routes
  'marseille-roma': -26,
  'roma-palermo': -24,
  'napoli-palermo': 20,
  'palermo-smyrna': 35,
  'brindisi-athina': -26,
  'athina-smyrna': 20,

  // Black Sea routes
  'sevastopol-constantinople': 22,
  'sevastopol-erzurum': -22,
  'sochi-erzurum': -22,
  'bucuresti-constantinople': -14,

  // Baltic coastline
  'berlin-danzig': -20,
  'danzig-riga': -22,
  'riga-petrograd': -18,

  // Inland routes with subtle curves to avoid straight line crowding
  'madrid-lisboa': 14,
  'madrid-cadiz': -10,
  'madrid-barcelona': -12,
  'pamplona-barcelona': 14,
  'pamplona-marseille': -10,
  'paris-marseille': 18,
  'paris-zurich': -14,
  'brest-paris': 8,
  'amsterdam-essen': -10,
  'essen-berlin': -10,
  'frankfurt-berlin': 12,
  'frankfurt-munchen': -10,
  'leipzig-munchen': 10,
  'munchen-venezia': -12,
  'zurich-venezia': 12,
  'venezia-roma': 14,
  'venezia-zagreb': -12,
  'zagreb-sarajevo': 12,
  'sarajevo-athina': -14,
  'athina-sofia': 14,
  'sarajevo-sofia': -10,
  'budapest-bucuresti': 16,
  'budapest-kyiv': -16,
  'wien-warszawa': -12,
  'warszawa-kyiv': 12,
  'warszawa-smolensk': -12,
  'smolensk-moskva': -10,
  'petrograd-moskva': 14,
  'kyiv-kharkov': -10,
  'kharkov-rostov': 12,
  'rostov-sochi': -14,
  'constantinople-angora': -14,
  'angora-erzurum': 12,
  'constantinople-smyrna': 14,
};

const POINTS_BY_LENGTH: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15,
  8: 21,
};

function getCityLabelCoordinates(pos: CityPos, cityName: string) {
  const p = pos.labelPos || 'top';
  let dx = 0;
  let dy = -16;
  let anchor: 'start' | 'middle' | 'end' = 'middle';

  switch (p) {
    case 'top':
      dx = 0; dy = -16; anchor = 'middle'; break;
    case 'bottom':
      dx = 0; dy = 18; anchor = 'middle'; break;
    case 'left':
      dx = -14; dy = 4; anchor = 'end'; break;
    case 'right':
      dx = 14; dy = 4; anchor = 'start'; break;
    case 'top-left':
      dx = -12; dy = -14; anchor = 'end'; break;
    case 'top-right':
      dx = 12; dy = -14; anchor = 'start'; break;
    case 'bottom-left':
      dx = -12; dy = 16; anchor = 'end'; break;
    case 'bottom-right':
      dx = 12; dy = 16; anchor = 'start'; break;
  }

  const charWidth = 6.0;
  const badgeWidth = Math.max(cityName.length * charWidth + 12, 34);
  const badgeHeight = 17;

  let badgeX = pos.x + dx - badgeWidth / 2;
  if (anchor === 'start') badgeX = pos.x + dx - 3;
  if (anchor === 'end') badgeX = pos.x + dx - badgeWidth + 3;

  const badgeY = pos.y + dy - badgeHeight / 2 - 1;

  return {
    textX: pos.x + dx,
    textY: pos.y + dy + 4,
    anchor,
    badgeX,
    badgeY,
    badgeWidth,
    badgeHeight,
  };
}

export const TTRMap: React.FC<TTRMapProps> = ({
  gameState,
  onClaimRoute,
  hoveredCities,
  currentUserId,
  isMyTurn,
}) => {
  const routes = useMemo(() => {
    return Object.values(gameState.routes).filter(
      route => route.id !== 'smyrna-erzurum' && !!INITIAL_ROUTES[route.id]
    );
  }, [gameState.routes]);

  // Group routes between same cities to calculate parallel double routes
  const routeGroups = useMemo(() => {
    const groups: Record<string, Route[]> = {};
    routes.forEach(route => {
      const key = [route.city1, route.city2].sort().join('-');
      if (!groups[key]) groups[key] = [];
      groups[key].push(route);
    });
    return groups;
  }, [routes]);

  // Pan & Zoom State (No scroll-to-zoom; Left-click drag to pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'claimable' | 'my-routes'>('all');
  const [showLegend, setShowLegend] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const hasDraggedRef = useRef(false);

  // Left click dragging handler (eliminates middle click requirement)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isMouseDownRef.current = true;
      hasDraggedRef.current = false;
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (isMouseDownRef.current) {
      const dist = Math.hypot(
        e.clientX - mouseDownPosRef.current.x,
        e.clientY - mouseDownPosRef.current.y
      );
      if (dist > 4) {
        hasDraggedRef.current = true;
        setIsDragging(true);
        setPan({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      }
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.65));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper: Can current user afford route
  const userCanAfford = (route: Route) => {
    if (!currentUserId || !gameState.players[currentUserId]) return { canAfford: false, message: '' };
    const player = gameState.players[currentUserId];

    if (player.trainCarsRemaining < route.length) {
      return { canAfford: false, message: `Need ${route.length} trains (${player.trainCarsRemaining} left)` };
    }

    const hand = player.trainCards;
    const locos = hand.filter(c => c === 'locomotive').length;

    if (route.locomotivesRequired && locos < route.locomotivesRequired) {
      return { canAfford: false, message: `Need ${route.locomotivesRequired} Locomotive(s)` };
    }

    if (route.color === 'any') {
      const counts: Record<string, number> = {};
      hand.forEach(c => {
        if (c !== 'locomotive') counts[c] = (counts[c] || 0) + 1;
      });
      const maxColorCount = Math.max(0, ...Object.values(counts));
      const requiredNormalCards = route.length - (route.locomotivesRequired || 0);
      const remainingLocos = locos - (route.locomotivesRequired || 0);

      if (maxColorCount + remainingLocos >= requiredNormalCards) {
        return { canAfford: true, message: 'Ready to Claim!', color: '#22c55e' };
      }
      return { canAfford: false, message: `Need ${route.length} cards of any single color`, color: '#ef4444' };
    } else {
      const matchCount = hand.filter(c => c === route.color).length;
      const requiredNormalCards = route.length - (route.locomotivesRequired || 0);
      const remainingLocos = locos - (route.locomotivesRequired || 0);

      if (matchCount + remainingLocos >= requiredNormalCards) {
        return { canAfford: true, message: 'Ready to Claim!', color: '#22c55e' };
      }
      return {
        canAfford: false,
        message: `Need ${route.length} ${route.color} cards (have ${matchCount + remainingLocos})`,
        color: '#ef4444',
      };
    }
  };

  const hoveredRoute = useMemo(() => {
    if (!hoveredRouteId) return null;
    return gameState.routes[hoveredRouteId] || null;
  }, [hoveredRouteId, gameState.routes]);

  const hoveredPathData = useMemo(() => {
    if (!hoveredCities || hoveredCities.length < 2) return null;
    const c1 = CITY_COORDINATES[hoveredCities[0]];
    const c2 = CITY_COORDINATES[hoveredCities[1]];
    if (!c1 || !c2) return null;

    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.hypot(dx, dy);
    const midX = (c1.x + c2.x) / 2;
    const midY = (c1.y + c2.y) / 2;

    const nx = -dy / dist;
    const ny = dx / dist;
    const curvature = Math.min(90, Math.max(35, dist * 0.22));
    const arcX = midX + nx * curvature;
    const arcY = midY + ny * curvature;

    return {
      d: `M ${c1.x} ${c1.y} Q ${arcX} ${arcY} ${c2.x} ${c2.y}`,
      c1,
      c2,
    };
  }, [hoveredCities]);

  // Precompute clean SVG curved path geometry for all routes
  const preparedRoutes = useMemo(() => {
    const list: Array<{
      route: Route;
      p1: CityPos;
      p2: CityPos;
      dist: number;
      ctrlX: number;
      ctrlY: number;
      pathD: string;
      bedStartX: number;
      bedStartY: number;
      bedEndX: number;
      bedEndY: number;
      carPositions: Array<{ cx: number; cy: number; deg: number; index: number }>;
    }> = [];

    Object.values(routeGroups).forEach(group => {
      group.forEach((route, groupIdx) => {
        const p1 = CITY_COORDINATES[route.city1];
        const p2 = CITY_COORDINATES[route.city2];
        if (!p1 || !p2) return;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        const nx = -dy / dist;
        const ny = dx / dist;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        // Calculate graceful curve offset
        let curvature = 0;
        if (group.length > 1) {
          // Double routes: bow symmetrically outward in opposite directions!
          curvature = groupIdx === 0 ? -22 : 22;
        } else if (ROUTE_SPECIFIC_CURVES[route.id]) {
          curvature = ROUTE_SPECIFIC_CURVES[route.id];
        } else {
          // Subtle natural curve for all routes to prevent rigid intersecting straight lines
          curvature = 0;
        }

        const ctrlX = midX + nx * curvature;
        const ctrlY = midY + ny * curvature;

        // Quadratic Bezier evaluation function for points and tangents
        const evalQuad = (t: number) => {
          const inv = 1 - t;
          const x = inv * inv * p1.x + 2 * inv * t * ctrlX + t * t * p2.x;
          const y = inv * inv * p1.y + 2 * inv * t * ctrlY + t * t * p2.y;
          const tx = 2 * inv * (ctrlX - p1.x) + 2 * t * (p2.x - ctrlX);
          const ty = 2 * inv * (ctrlY - p1.y) + 2 * t * (p2.y - ctrlY);
          const deg = (Math.atan2(ty, tx) * 180) / Math.PI;
          return { x, y, deg };
        };

        // City clearance endpoints along curve
        const tStart = Math.min(0.25, CITY_CLEARANCE / dist);
        const tEnd = Math.max(0.75, 1 - CITY_CLEARANCE / dist);

        const startPt = evalQuad(tStart);
        const endPt = evalQuad(tEnd);

        const pathD = `M ${startPt.x} ${startPt.y} Q ${ctrlX} ${ctrlY} ${endPt.x} ${endPt.y}`;

        // Standardized 22px × 11px cars distributed evenly along the curve
        const carPositions: Array<{ cx: number; cy: number; deg: number; index: number }> = [];
        for (let i = 0; i < route.length; i++) {
          const tCar = tStart + (tEnd - tStart) * ((i + 0.5) / route.length);
          const carPt = evalQuad(tCar);
          carPositions.push({ cx: carPt.x, cy: carPt.y, deg: carPt.deg, index: i });
        }

        list.push({
          route,
          p1,
          p2,
          dist,
          ctrlX,
          ctrlY,
          pathD,
          bedStartX: startPt.x,
          bedStartY: startPt.y,
          bedEndX: endPt.x,
          bedEndY: endPt.y,
          carPositions,
        });
      });
    });

    return list;
  }, [routeGroups]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#1a233a] select-none flex flex-col"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Collapsible Floating Map Controls & Filters (Hideable to left with a to-left icon button) */}
      <div
        className={`absolute top-3 left-3 z-30 flex items-center transition-all duration-300 ease-in-out ${
          isToolbarOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 bg-[#fdfbf7]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#d5c7b0] shadow-xl text-slate-800">
          {/* Hideable button with to-left icon */}
          <button
            onClick={() => setIsToolbarOpen(false)}
            title="Hide Map Controls"
            className="p-1 hover:bg-[#ede5d3] rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="w-[1px] h-4 bg-[#d5c7b0] mx-0.5" />

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 hover:bg-[#ede5d3] rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomIn size={17} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 hover:bg-[#ede5d3] rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ZoomOut size={17} />
          </button>
          <button
            onClick={handleResetView}
            title="Fit & Reset Map"
            className="p-1 hover:bg-[#ede5d3] rounded-lg text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw size={17} />
          </button>

          <div className="w-[1px] h-4 bg-[#d5c7b0] mx-0.5" />

          {/* Filter Modes */}
          <div className="flex items-center gap-1 bg-[#ede5d3]/70 p-0.5 rounded-lg border border-[#d5c7b0]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#b45309] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All Tracks
            </button>
            <button
              onClick={() => setFilterMode('claimable')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterMode === 'claimable'
                  ? 'bg-[#b45309] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Claimable
            </button>
            <button
              onClick={() => setFilterMode('my-routes')}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                filterMode === 'my-routes'
                  ? 'bg-[#b45309] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              My Routes
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#d5c7b0] mx-0.5" />

          <button
            onClick={() => setShowLegend(prev => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              showLegend
                ? 'bg-[#b45309]/15 text-[#92400e] border border-[#b45309]/30'
                : 'text-slate-700 hover:bg-[#ede5d3]'
            }`}
            title="Map Legend & Scoring"
          >
            <Info size={14} />
            <span>Legend</span>
          </button>
        </div>
      </div>

      {/* Discrete tab button to re-open toolbar when hidden */}
      {!isToolbarOpen && (
        <button
          onClick={() => setIsToolbarOpen(true)}
          title="Show Controls"
          className="absolute top-3 left-0 z-30 flex items-center gap-1 bg-[#fdfbf7]/95 backdrop-blur-md px-2.5 py-1.5 rounded-r-xl border-y border-r border-[#d5c7b0] shadow-lg text-slate-700 hover:text-slate-950 hover:bg-[#ede5d3] transition-all cursor-pointer animate-in fade-in slide-in-from-left duration-200"
        >
          <ChevronRight size={17} />
          <span className="text-xs font-semibold">Controls</span>
        </button>
      )}

      {/* Legend Popover */}
      {showLegend && (
        <div className="absolute top-14 left-3 z-40 w-80 bg-[#fdfbf7]/95 backdrop-blur-md rounded-2xl border border-[#c4b59d] shadow-2xl p-4 text-xs text-slate-800 animate-in fade-in duration-150 font-sans">
          <div className="flex items-center justify-between border-b border-[#e2d8c3] pb-2 mb-3">
            <h4 className="font-bold text-[#92400e] text-sm flex items-center gap-1.5 font-serif">
              <Info size={16} /> Official Europe Board Rules
            </h4>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-500 hover:text-slate-800 p-1 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="font-bold text-slate-900 mb-1">Route Scoring Points</div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px]">
                <div className="bg-[#f0e7d5] p-1 rounded border border-[#dcd0b8]">1 🚂: 1pt</div>
                <div className="bg-[#f0e7d5] p-1 rounded border border-[#dcd0b8]">2 🚂: 2pt</div>
                <div className="bg-[#f0e7d5] p-1 rounded border border-[#dcd0b8]">3 🚂: 4pt</div>
                <div className="bg-[#f0e7d5] p-1 rounded border border-[#dcd0b8]">4 🚂: 7pt</div>
                <div className="bg-[#f0e7d5] p-1 rounded border border-[#dcd0b8]">6 🚂: 15pt</div>
                <div className="bg-[#e9dcc5] p-1 rounded border border-[#c8b79b] col-span-3 font-bold text-[#92400e]">
                  8 🚂 (Stockholm-Petrograd): 21pt!
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-900 mb-1">Special Track Types</div>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm font-bold text-blue-900">⚓</span>
                  <span><strong>Ferries:</strong> Requires locomotive card(s) marked on the slot.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm font-bold text-amber-900">⛰</span>
                  <span><strong>Tunnels:</strong> 3 train cards drawn; extra matching cards may be needed.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Floating HTML Route Tooltip (ALWAYS ON TOP of all cities and labels) */}
      {hoveredRoute && mousePos && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
          }}
        >
          {(() => {
            const afford = userCanAfford(hoveredRoute);
            const points = POINTS_BY_LENGTH[hoveredRoute.length] || hoveredRoute.length * 2;
            const theme = TRAIN_COLORS[hoveredRoute.color] || TRAIN_COLORS.any;

            return (
              <div className="bg-[#182030]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border-2 border-amber-500 shadow-2xl text-white min-w-[210px] text-center select-none animate-in fade-in zoom-in-95 duration-100">
                <div className="font-bold text-sm text-slate-100 flex items-center justify-center gap-1.5">
                  <span>{hoveredRoute.city1}</span>
                  <span className="text-amber-400">➔</span>
                  <span>{hoveredRoute.city2}</span>
                </div>
                <div className="text-[11px] text-slate-300 my-0.5 flex items-center justify-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300">{hoveredRoute.length} Cars</span>
                  <span>·</span>
                  <span className="font-mono font-bold text-emerald-400">{points} Pts</span>
                  <span>·</span>
                  <span className="capitalize font-semibold" style={{ color: theme.fill === '#ffffff' ? '#e2e8f0' : theme.fill }}>
                    {theme.label}
                  </span>
                </div>
                {hoveredRoute.locomotivesRequired && (
                  <div className="text-[10px] text-blue-300 font-semibold">
                    ⚓ Ferry: Requires {hoveredRoute.locomotivesRequired} Locomotive(s)
                  </div>
                )}
                {hoveredRoute.isTunnel && (
                  <div className="text-[10px] text-amber-300 font-semibold">
                    ⛰ Mountain Tunnel Route
                  </div>
                )}
                <div
                  className="text-[11px] font-bold mt-1 pt-1 border-t border-slate-700/60"
                  style={{ color: afford.color }}
                >
                  {afford.message}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SVG Board Canvas */}
      <svg
        viewBox="0 0 1440 960"
        className="w-full h-full flex-1"
        style={{
          backgroundColor: '#b8d2e8', // Historical antique maritime sea blue (Image 1)
        }}
      >
        <defs>
          <filter id="board-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#1e293b" floodOpacity="0.4" />
          </filter>

          <filter id="city-pin-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.5" />
          </filter>

          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Transformed Group (Controlled by Pan & Zoom and Left-click dragging) */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* 1. Sea Surface */}
          <rect id="map-bg" x="0" y="0" width="1440" height="960" fill="#b8d2e8" />

          {/* 2. Antique European Landmass Paths matching Image 1 */}
          <g id="landmass" filter="url(#board-shadow)">
            {/* Great Britain */}
            <path
              d="M 190 70 
                 Q 230 65 240 100 
                 Q 260 160 290 230 
                 Q 320 280 290 320 
                 Q 250 330 220 300 
                 Q 200 240 180 180 
                 Q 160 120 190 70 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />
            {/* Ireland */}
            <path
              d="M 120 180 Q 160 170 170 220 Q 160 280 130 300 Q 90 260 100 200 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />

            {/* Scandinavia */}
            <path
              d="M 520 25 
                 Q 640 15 760 30 
                 Q 820 40 850 100 
                 Q 810 160 760 130 
                 Q 700 120 640 110 
                 Q 580 90 530 40 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />
            {/* Denmark */}
            <path
              d="M 640 145 Q 675 145 665 195 Q 640 200 635 175 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />

            {/* Continental Europe */}
            <path
              d="M 50 820 
                 Q 80 760 140 730 
                 Q 220 720 280 720 
                 Q 310 650 330 590 
                 Q 240 570 160 520 
                 Q 160 440 230 430 
                 Q 290 420 340 400 
                 Q 410 320 460 290 
                 Q 550 270 610 270 
                 Q 720 240 810 240 
                 Q 910 190 1000 150 
                 Q 1110 80 1230 80 
                 Q 1350 100 1400 180 
                 L 1400 890 
                 L 1300 880 
                 Q 1190 870 1140 810 
                 Q 1050 810 1000 880 
                 Q 940 920 850 920 
                 Q 830 870 790 830 
                 Q 760 850 710 870 
                 Q 640 890 600 820 
                 Q 590 760 530 720 
                 Q 470 740 400 780 
                 Q 360 860 300 900 
                 Q 220 930 130 935 
                 Q 40 890 50 820 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />

            {/* Black Sea Water Cutout */}
            <path
              d="M 1120 730 
                 Q 1200 700 1260 670 
                 Q 1330 660 1370 650 
                 Q 1360 700 1310 740 
                 Q 1220 760 1130 740 Z"
              fill="#b8d2e8"
              stroke="#9bbbd3"
              strokeWidth="2"
            />

            {/* Sicily */}
            <path
              d="M 680 910 Q 730 910 720 950 Q 670 950 680 910 Z"
              fill="#f4eedb"
              stroke="#b5a58a"
              strokeWidth="2"
            />
          </g>

          {/* 3. Mountain Ranges in authentic sepia ink matching Image 1 */}
          <g id="mountains" stroke="#8c785d" strokeWidth="1.2" fill="none" opacity="0.6">
            <path d="M 270 705 L 285 688 L 300 705 L 315 685 L 330 705 L 345 690 L 360 705" />
            <path d="M 500 575 L 515 555 L 530 575 L 545 550 L 560 575 L 575 552 L 590 575 L 605 555 L 620 575" />
            <path d="M 910 540 Q 980 520 1030 570 L 1050 620" strokeDasharray="4 3" strokeWidth="1.8" />
            <path d="M 1260 690 L 1275 670 L 1290 690 L 1305 668 L 1320 690 L 1335 672 L 1350 690" />
          </g>

          {/* 4. Vintage Nautical Sea Names & Illustrations matching Image 1 */}
          <g id="sea-decorations" className="font-serif select-none pointer-events-none" fill="#526e85">
            <text
              x="120"
              y="380"
              fontSize="16"
              letterSpacing="6"
              fontStyle="italic"
              transform="rotate(-40 120 380)"
              opacity="0.6"
            >
              ATLANTIC OCEAN
            </text>
            <text
              x="390"
              y="190"
              fontSize="13"
              letterSpacing="4"
              fontStyle="italic"
              opacity="0.6"
            >
              NORTH SEA
            </text>
            <text
              x="760"
              y="180"
              fontSize="13"
              letterSpacing="4"
              fontStyle="italic"
              opacity="0.6"
            >
              BALTIC SEA
            </text>
            <text
              x="470"
              y="860"
              fontSize="15"
              letterSpacing="5"
              fontStyle="italic"
              opacity="0.6"
            >
              MEDITERRANEAN SEA
            </text>
            <text
              x="1180"
              y="700"
              fontSize="13"
              letterSpacing="4"
              fontStyle="italic"
              opacity="0.6"
            >
              BLACK SEA
            </text>

            <g transform="translate(90, 580) scale(0.6)" opacity="0.55">
              <path d="M 0 30 Q 30 35 60 30 L 50 45 Q 25 50 10 45 Z" fill="#475569" />
              <line x1="20" y1="30" x2="20" y2="5" stroke="#334155" strokeWidth="2" />
              <line x1="40" y1="30" x2="40" y2="8" stroke="#334155" strokeWidth="2" />
              <path d="M 20 8 Q 30 15 20 28 Z" fill="#cbd5e1" stroke="#475569" />
              <path d="M 40 12 Q 50 18 40 28 Z" fill="#cbd5e1" stroke="#475569" />
            </g>
          </g>

          {/* 5. Destination Flight Arc (When ticket hovered) */}
          {hoveredPathData && (
            <g id="destination-flight-path" className="pointer-events-none">
              <path
                d={hoveredPathData.d}
                fill="none"
                stroke="#b45309"
                strokeWidth="8"
                opacity="0.3"
                filter="url(#gold-glow)"
              />
              <path
                d={hoveredPathData.d}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeDasharray="9 7"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="100"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          )}

          {/* 6. CURVED RAILWAY TRACK BEDS (Underlying solid railbeds - Layer A) */}
          <g id="track-beds" className="pointer-events-none">
            {preparedRoutes.map(item => {
              const isClaimed = !!item.route.claimedBy;
              let opacity = 0.88;
              if (filterMode === 'claimable') {
                const afford = userCanAfford(item.route);
                if (!afford.canAfford && !isClaimed) opacity = 0.22;
              } else if (filterMode === 'my-routes') {
                if (item.route.claimedBy !== currentUserId) opacity = 0.2;
              }

              return (
                <path
                  key={`bed-${item.route.id}`}
                  d={item.pathD}
                  fill="none"
                  stroke={isClaimed ? '#0f172a' : '#1e1b18'}
                  strokeWidth={TRACK_BED_WIDTH}
                  strokeLinecap="round"
                  opacity={opacity}
                />
              );
            })}
          </g>

          {/* 7. CURVED RAILWAY CARRIAGE SLOTS & TOKENS (Layer B - exact tangent rotation) */}
          <g id="train-carriages">
            {preparedRoutes.map(item => {
              const { route, pathD, carPositions } = item;
              const isClaimed = !!route.claimedBy;
              const claimedPlayer = isClaimed ? gameState.players[route.claimedBy!] : null;
              const playerColor = claimedPlayer?.color || '#dc2626';

              const routeTheme = TRAIN_COLORS[route.color] || TRAIN_COLORS.any;
              const isHovered = hoveredRouteId === route.id;

              let opacity = 1;
              if (filterMode === 'claimable') {
                const afford = userCanAfford(route);
                if (!afford.canAfford && !isClaimed) opacity = 0.22;
              } else if (filterMode === 'my-routes') {
                if (route.claimedBy !== currentUserId) opacity = 0.2;
              }

              return (
                <g
                  key={route.id}
                  className="transition-opacity duration-150"
                  style={{ opacity }}
                  onMouseEnter={() => setHoveredRouteId(route.id)}
                  onMouseLeave={() => setHoveredRouteId(null)}
                  onClick={() => {
                    if (hasDraggedRef.current) return;
                    if (!isClaimed && isMyTurn) {
                      onClaimRoute(route.id);
                    }
                  }}
                >
                  {/* Curved Hit Area for easy clickability matching curved path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="28"
                    className={!isClaimed && isMyTurn ? 'cursor-pointer' : 'cursor-default'}
                  />

                  {/* Individual Standardized Cars along Curve (FIXED 22px × 11px) */}
                  {carPositions.map(car => {
                    const isFerrySlot =
                      !isClaimed &&
                      route.locomotivesRequired &&
                      car.index < route.locomotivesRequired;

                    return (
                      <g
                        key={car.index}
                        transform={`translate(${car.cx}, ${car.cy}) rotate(${car.deg})`}
                        filter="url(#board-shadow)"
                        className={!isClaimed && isMyTurn ? 'cursor-pointer' : ''}
                      >
                        {isClaimed ? (
                          /* Claimed 3D Player Train Token */
                          <g>
                            <rect
                              x={-CAR_LENGTH / 2}
                              y={-CAR_WIDTH / 2}
                              width={CAR_LENGTH}
                              height={CAR_WIDTH}
                              rx={3}
                              fill={playerColor}
                              stroke="#ffffff"
                              strokeWidth="1.3"
                            />
                            <rect
                              x={-CAR_LENGTH / 2 + 2}
                              y={-CAR_WIDTH / 2 + 1.5}
                              width={CAR_LENGTH - 4}
                              height={CAR_WIDTH / 2 - 1.5}
                              rx={2}
                              fill="#ffffff"
                              opacity="0.4"
                            />
                            <circle cx={-CAR_LENGTH / 2} cy="0" r="1.4" fill="#000" />
                            <circle cx={CAR_LENGTH / 2} cy="0" r="1.4" fill="#000" />
                          </g>
                        ) : (
                          /* Unclaimed Track Slot (Uniform CAR_LENGTH × CAR_WIDTH) */
                          <g>
                            {/* Outer frame */}
                            <rect
                              x={-CAR_LENGTH / 2}
                              y={-CAR_WIDTH / 2}
                              width={CAR_LENGTH}
                              height={CAR_WIDTH}
                              rx={2.5}
                              fill="#1c1917"
                              stroke={isHovered ? '#f59e0b' : routeTheme.border}
                              strokeWidth={isHovered ? 2 : 1.4}
                            />
                            {/* Inner Color Fill */}
                            <rect
                              x={-CAR_LENGTH / 2 + 1.8}
                              y={-CAR_WIDTH / 2 + 1.8}
                              width={CAR_LENGTH - 3.6}
                              height={CAR_WIDTH - 3.6}
                              rx={1.8}
                              fill={routeTheme.fill}
                            />

                            {/* Railroad tie track line inside slot */}
                            <line
                              x1={0}
                              y1={-CAR_WIDTH / 2 + 2}
                              x2={0}
                              y2={CAR_WIDTH / 2 - 2}
                              stroke={routeTheme.tie}
                              strokeWidth="1.2"
                              opacity="0.9"
                            />

                            {/* Tunnel Serrated Portal Edges */}
                            {route.isTunnel && (
                              <line
                                x1={-CAR_LENGTH / 2 + 3}
                                y1={0}
                                x2={CAR_LENGTH / 2 - 3}
                                y2={0}
                                stroke="#1e1b18"
                                strokeWidth="1.4"
                                strokeDasharray="2 2"
                              />
                            )}

                            {/* Ferry Locomotive Symbol */}
                            {isFerrySlot && (
                              <g transform="scale(0.8)">
                                <circle cx="0" cy="0" r="4.5" fill="#1e293b" />
                                <text
                                  x="0"
                                  y="3"
                                  fontSize="7.5"
                                  textAnchor="middle"
                                  fill="#fff"
                                  fontWeight="bold"
                                >
                                  ⚓
                                </text>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>

          {/* 8. CITIES & STATIONS (Layer C - rendered ON TOP of tracks so lines never leak into cities) */}
          <g id="city-stations">
            {Object.entries(CITY_COORDINATES).map(([cityName, pos]) => {
              const isDestinationTarget =
                hoveredCities && (cityName === hoveredCities[0] || cityName === hoveredCities[1]);

              return (
                <g key={`station-${cityName}`} className="select-none pointer-events-none">
                  {/* Anchored SVG Pulse Beacon without CSS translate */}
                  {isDestinationTarget && (
                    <g>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="10"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      >
                        <animate attributeName="r" values="10;24;10" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="16"
                        fill="#f59e0b"
                        opacity="0.3"
                      >
                        <animate attributeName="opacity" values="0.2;0.45;0.2" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {/* Outer Junction Backing Disk (Hides any converging line seams) */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isDestinationTarget ? 13 : 11}
                    fill="#f4eedb"
                    stroke="#8c785d"
                    strokeWidth="1.2"
                  />

                  {/* Brass Station Rim (Image 1) */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isDestinationTarget ? 10.5 : 8.5}
                    fill="#ca8a04"
                    stroke={isDestinationTarget ? '#f59e0b' : '#78350f'}
                    strokeWidth={isDestinationTarget ? 2.5 : 1.5}
                    filter="url(#city-pin-shadow)"
                  />

                  {/* Inner Carmine Red Dot */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isDestinationTarget ? 6.5 : 4.8}
                    fill={isDestinationTarget ? '#f59e0b' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}
          </g>

          {/* 9. CITY LABELS (Layer D - crisp serif badges positioned to avoid tracks) */}
          <g id="city-labels">
            {Object.entries(CITY_COORDINATES).map(([cityName, pos]) => {
              const isDestinationTarget =
                hoveredCities && (cityName === hoveredCities[0] || cityName === hoveredCities[1]);

              const label = getCityLabelCoordinates(pos, cityName);

              return (
                <g key={`label-${cityName}`} className="select-none pointer-events-none">
                  <rect
                    x={label.badgeX}
                    y={label.badgeY}
                    width={label.badgeWidth}
                    height={label.badgeHeight}
                    rx="3.5"
                    fill={isDestinationTarget ? '#fef3c7' : 'rgba(253, 251, 247, 0.94)'}
                    stroke={isDestinationTarget ? '#d97706' : '#c4b59d'}
                    strokeWidth={isDestinationTarget ? 1.5 : 0.9}
                  />
                  <text
                    x={label.textX}
                    y={label.textY}
                    textAnchor={label.anchor}
                    fill={isDestinationTarget ? '#92400e' : '#1c1917'}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="ui-serif, Georgia, Cambria, serif"
                    letterSpacing="0.3"
                  >
                    {cityName}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 10. Classic Perimeter Scoring Border Frame (Image 1) */}
          <g id="scoring-track-border" className="pointer-events-none select-none" opacity="0.85">
            <rect
              x="4"
              y="4"
              width="1432"
              height="952"
              fill="none"
              stroke="#573b18"
              strokeWidth="10"
              rx="6"
            />
            <rect
              x="12"
              y="12"
              width="1416"
              height="936"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="1.5"
              strokeDasharray="14 14"
            />
            <circle cx="20" cy="20" r="12" fill="#ca8a04" stroke="#573b18" strokeWidth="2" />
            <circle cx="1420" cy="20" r="12" fill="#ca8a04" stroke="#573b18" strokeWidth="2" />
            <circle cx="20" cy="940" r="12" fill="#ca8a04" stroke="#573b18" strokeWidth="2" />
            <circle cx="1420" cy="940" r="12" fill="#ca8a04" stroke="#573b18" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
};
