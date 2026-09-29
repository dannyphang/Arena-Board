import React from 'react';
import {
  Trees,
  BrickWall,
  Wheat,
  Mountain,
  Sun,
  Shield,
  Swords,
  Route,
  Gift,
  Coins,
  Trophy,
  Anchor,
  Handshake,
  Home,
  Castle,
  Bot,
  Compass,
  Crown,
  Zap,
  Brain,
  Wand2,
  Crosshair,
  Rocket,
  Gem,
  Flame,
  User,
  Sparkles,
  HelpCircle,
  LucideProps,
  Dices,
} from 'lucide-react';
import { HexTerrain, ResourceType, DevCardType } from '../../games/catan/types';

// ==========================================
// 1. Crisp Sheep SVG Icon
// ==========================================
export const SheepVectorIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 16,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    stroke="none"
  >
    {/* Fluffy sheep body clouds */}
    <ellipse cx="12" cy="13" rx="7.5" ry="5.5" />
    <circle cx="8" cy="10" r="3" />
    <circle cx="12" cy="8.5" r="3.2" />
    <circle cx="16" cy="10" r="3" />
    <circle cx="6" cy="13" r="2.8" />
    <circle cx="18" cy="13" r="2.8" />
    {/* Sheep head */}
    <ellipse cx="6" cy="9.5" rx="2.5" ry="3" fill="#0f172a" />
    {/* Sheep ears */}
    <ellipse cx="4.2" cy="7.2" rx="1.2" ry="0.8" transform="rotate(-30 4.2 7.2)" fill="#0f172a" />
    <ellipse cx="7.8" cy="7.2" rx="1.2" ry="0.8" transform="rotate(30 7.8 7.2)" fill="#0f172a" />
    {/* Eye dot */}
    <circle cx="5.3" cy="9.2" r="0.6" fill="#f8fafc" />
    {/* Little hooves */}
    <rect x="8.5" y="17.5" width="1.6" height="3.5" rx="0.8" fill="#0f172a" />
    <rect x="13.9" y="17.5" width="1.6" height="3.5" rx="0.8" fill="#0f172a" />
  </svg>
);

// ==========================================
// 2. Resource Icon (React Component)
// ==========================================
interface ResourceIconProps {
  type?: HexTerrain | ResourceType | 'desert';
  resource?: HexTerrain | ResourceType | 'desert';
  className?: string;
  size?: number | string;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({
  type,
  resource,
  className = 'w-4 h-4',
  size = 16,
}) => {
  const actualType = type || resource || 'wood';
  const numericSize =
    typeof size === 'number'
      ? size
      : size === 'lg'
      ? 24
      : size === 'xl'
      ? 32
      : size === 'sm'
      ? 14
      : 16;

  switch (actualType) {
    case 'wood':
      return <Trees size={size} className={className} />;
    case 'brick':
      return <BrickWall size={size} className={className} />;
    case 'sheep':
      return <SheepVectorIcon size={numericSize} className={className} />;
    case 'wheat':
      return <Wheat size={size} className={className} />;
    case 'ore':
      return <Mountain size={size} className={className} />;
    case 'desert':
      return <Sun size={size} className={className} />;
    default:
      return <Sparkles size={size} className={className} />;
  }
};

// ==========================================
// 3. Hex Board Terrain Graphics (Pure SVG inside <svg>)
// ==========================================
export const HexTerrainVector: React.FC<{
  terrain: HexTerrain;
  x: number;
  y: number;
  hasNumber: boolean;
}> = ({ terrain, x, y, hasNumber }) => {
  const offsetY = hasNumber ? y - 16 : y;

  switch (terrain) {
    case 'wood':
      return (
        <g transform={`translate(${x - 18}, ${offsetY - 18})`} className="pointer-events-none select-none">
          {/* Back Tree */}
          <polygon points="18,4 10,17 26,17" fill="#15803d" />
          <polygon points="18,10 8,24 28,24" fill="#16a34a" />
          <rect x="16.5" y="24" width="3" height="5" fill="#78350f" rx="1" />
          {/* Left Tree */}
          <polygon points="9,11 3,21 15,21" fill="#166534" />
          <polygon points="9,16 2,27 16,27" fill="#15803d" />
          <rect x="7.5" y="27" width="3" height="4" fill="#78350f" rx="1" />
          {/* Right Tree */}
          <polygon points="27,11 21,21 33,21" fill="#22c55e" />
          <polygon points="27,16 20,27 34,27" fill="#16a34a" />
          <rect x="25.5" y="27" width="3" height="4" fill="#78350f" rx="1" />
        </g>
      );

    case 'brick':
      return (
        <g transform={`translate(${x - 18}, ${offsetY - 14})`} className="pointer-events-none select-none">
          {/* Wall layer 1 */}
          <rect x="2" y="2" width="15" height="7" rx="1.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
          <rect x="19" y="2" width="15" height="7" rx="1.5" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
          {/* Wall layer 2 */}
          <rect x="0" y="11" width="9" height="7" rx="1.5" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
          <rect x="11" y="11" width="14" height="7" rx="1.5" fill="#f97316" stroke="#9a3412" strokeWidth="1" />
          <rect x="27" y="11" width="9" height="7" rx="1.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
          {/* Wall layer 3 */}
          <rect x="2" y="20" width="15" height="7" rx="1.5" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
          <rect x="19" y="20" width="15" height="7" rx="1.5" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />
        </g>
      );

    case 'sheep':
      return (
        <g transform={`translate(${x - 17}, ${offsetY - 14})`} className="pointer-events-none select-none">
          {/* Rolling pasture grass mound */}
          <path d="M 2 24 Q 17 18 32 24" fill="none" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
          {/* Sheep body fluff */}
          <ellipse cx="17" cy="12" rx="9" ry="6.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <circle cx="12" cy="9" r="3.5" fill="#f8fafc" />
          <circle cx="17" cy="7.5" r="3.5" fill="#ffffff" />
          <circle cx="22" cy="9" r="3.5" fill="#f8fafc" />
          {/* Sheep head */}
          <ellipse cx="9" cy="9" rx="3" ry="3.5" fill="#334155" />
          <circle cx="8" cy="8.5" r="0.7" fill="#ffffff" />
          {/* Sheep legs */}
          <line x1="13" y1="18" x2="13" y2="23" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <line x1="21" y1="18" x2="21" y2="23" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    case 'wheat':
      return (
        <g transform={`translate(${x - 16}, ${offsetY - 17})`} className="pointer-events-none select-none">
          {/* Center wheat stem & grains */}
          <path d="M 16 32 Q 16 18 16 4" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="16" cy="6" rx="2.5" ry="4" fill="#eab308" transform="rotate(0 16 6)" />
          <ellipse cx="12.5" cy="10" rx="2.3" ry="3.8" fill="#facc15" transform="rotate(-30 12.5 10)" />
          <ellipse cx="19.5" cy="10" rx="2.3" ry="3.8" fill="#facc15" transform="rotate(30 19.5 10)" />
          <ellipse cx="12.5" cy="16" rx="2.3" ry="3.8" fill="#eab308" transform="rotate(-30 12.5 16)" />
          <ellipse cx="19.5" cy="16" rx="2.3" ry="3.8" fill="#eab308" transform="rotate(30 19.5 16)" />
          <ellipse cx="13" cy="22" rx="2.2" ry="3.5" fill="#ca8a04" transform="rotate(-30 13 22)" />
          <ellipse cx="19" cy="22" rx="2.2" ry="3.5" fill="#ca8a04" transform="rotate(30 19 22)" />
          {/* Left stalk */}
          <path d="M 16 26 Q 10 20 6 12" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="6" cy="12" rx="2" ry="3" fill="#eab308" transform="rotate(-40 6 12)" />
          {/* Right stalk */}
          <path d="M 16 26 Q 22 20 26 12" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <ellipse cx="26" cy="12" rx="2" ry="3" fill="#eab308" transform="rotate(40 26 12)" />
        </g>
      );

    case 'ore':
      return (
        <g transform={`translate(${x - 20}, ${offsetY - 16})`} className="pointer-events-none select-none">
          {/* Rear Dark Mountain */}
          <polygon points="12,7 2,26 22,26" fill="#475569" stroke="#334155" strokeWidth="1" />
          {/* Front Main Mountain */}
          <polygon points="25,4 11,27 39,27" fill="#64748b" stroke="#334155" strokeWidth="1" />
          {/* Snow cap on main mountain */}
          <polygon points="25,4 20,12 23,10 25,13 28,10 30,12" fill="#f8fafc" />
          {/* Snow cap on rear mountain */}
          <polygon points="12,7 8,13 12,11 15,13" fill="#e2e8f0" />
          {/* Mineral ore veins */}
          <circle cx="21" cy="18" r="1.8" fill="#cbd5e1" />
          <circle cx="28" cy="20" r="1.5" fill="#94a3b8" />
          <circle cx="17" cy="22" r="1.5" fill="#cbd5e1" />
        </g>
      );

    case 'desert':
      return (
        <g transform={`translate(${x - 18}, ${offsetY - 16})`} className="pointer-events-none select-none">
          {/* Sun */}
          <circle cx="18" cy="11" r="5.5" fill="#f59e0b" />
          <line x1="18" y1="2" x2="18" y2="4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="18" x2="18" y2="20" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="11" x2="11" y2="11" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="25" y1="11" x2="27" y2="11" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          {/* Dunes */}
          <path d="M 2 24 Q 10 17 20 23 Q 28 19 34 26" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 5 28 Q 15 22 25 28" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
        </g>
      );

    default:
      return null;
  }
};

// ==========================================
// 4. Robber SVG Token (Inside Board SVG)
// ==========================================
export const RobberVector: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x - 10}, ${y - 10})`} className="pointer-events-none select-none">
    {/* Dark cloak & hood */}
    <path
      d="M 10 2 C 5 2 2 6 2 11 C 2 15 5 18 10 18 C 15 18 18 15 18 11 C 18 6 15 2 10 2 Z"
      fill="#0f172a"
    />
    {/* Bandit Mask */}
    <rect x="5" y="7" width="10" height="4" rx="1.5" fill="#dc2626" />
    {/* Piercing white eye slits */}
    <ellipse cx="7.5" cy="9" rx="1.2" ry="0.8" fill="#ffffff" />
    <ellipse cx="12.5" cy="9" rx="1.2" ry="0.8" fill="#ffffff" />
  </g>
);

// ==========================================
// 5. Port Harbor SVG Graphic (Inside Board SVG)
// ==========================================
export const PortGraphicSvg: React.FC<{
  type: 'threeToOne' | 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';
  x: number;
  y: number;
}> = ({ type, x, y }) => {
  if (type === 'threeToOne') {
    return (
      <g transform={`translate(${x - 12}, ${y - 8})`} className="pointer-events-none select-none">
        <text
          x="7"
          y="9"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8.5"
          fontWeight="900"
          fill="#ffffff"
          fontFamily="'Fredoka', sans-serif"
        >
          3:1
        </text>
        {/* Curved trade arrows */}
        <path
          d="M 16 4 A 4 4 0 0 1 20 8 M 20 8 L 18 7 M 20 8 L 21 6"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M 20 12 A 4 4 0 0 1 16 16 M 16 16 L 18 17 M 16 16 L 15 18"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // 2:1 Resource Specific Port
  return (
    <g transform={`translate(${x - 13}, ${y - 8})`} className="pointer-events-none select-none">
      <text
        x="6"
        y="9"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontWeight="900"
        fill="#ffffff"
        fontFamily="'Fredoka', sans-serif"
      >
        2:1
      </text>
      {/* Mini Resource Icon */}
      <g transform="translate(13, 3) scale(0.45)">
        {type === 'wood' && (
          <polygon points="10,0 2,16 18,16" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
        )}
        {type === 'brick' && (
          <rect x="0" y="2" width="18" height="12" rx="2" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
        )}
        {type === 'sheep' && (
          <ellipse cx="10" cy="8" rx="8" ry="6" fill="#f8fafc" stroke="#65a30d" strokeWidth="2" />
        )}
        {type === 'wheat' && (
          <polygon points="10,0 6,18 14,18" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        )}
        {type === 'ore' && (
          <polygon points="10,0 0,18 20,18" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
        )}
      </g>
    </g>
  );
};

// ==========================================
// 6. Development Card SVG Icons
// ==========================================
export const DevCardIcon: React.FC<{
  type: DevCardType;
  className?: string;
  size?: number;
}> = ({ type, className = 'w-4 h-4', size = 16 }) => {
  switch (type) {
    case 'knight':
      return <Swords size={size} className={className} />;
    case 'roadBuilding':
      return <Route size={size} className={className} />;
    case 'yearOfPlenty':
      return <Gift size={size} className={className} />;
    case 'monopoly':
      return <Coins size={size} className={className} />;
    case 'victoryPoint':
      return <Trophy size={size} className={className} />;
    default:
      return <Sparkles size={size} className={className} />;
  }
};

// ==========================================
// 7. Building Structure Icons
// ==========================================
export const BuildingIcon: React.FC<{
  type: 'road' | 'settlement' | 'city';
  className?: string;
  size?: number;
}> = ({ type, className = 'w-4 h-4', size = 16 }) => {
  switch (type) {
    case 'road':
      return <Route size={size} className={className} />;
    case 'settlement':
      return <Home size={size} className={className} />;
    case 'city':
      return <Castle size={size} className={className} />;
  }
};

// ==========================================
// 8. Universal Avatar SVG (Replacing raw emojis)
// ==========================================
interface AvatarSvgProps {
  avatar?: string;
  className?: string;
  size?: number;
}

export const AvatarSvg: React.FC<AvatarSvgProps> = ({
  avatar = 'user',
  className = 'w-5 h-5',
  size = 20,
}) => {
  const a = (avatar || '').trim().toLowerCase();

  // Check key words or emoji unicode ranges
  if (a.includes('bot') || a.includes('robot') || /[\u{1F916}]/u.test(a)) {
    return <Bot size={size} className={className} />;
  }
  if (a.includes('compass') || a.includes('settler') || /[\u{1F9ED}]/u.test(a)) {
    return <Compass size={size} className={className} />;
  }
  if (a.includes('sword') || a.includes('merchant') || /[\u{2694}]/u.test(a)) {
    return <Swords size={size} className={className} />;
  }
  if (a.includes('brain') || a.includes('genius') || /[\u{1F9E0}]/u.test(a)) {
    return <Brain size={size} className={className} />;
  }
  if (a.includes('crown') || a.includes('king') || /[\u{1F451}]/u.test(a)) {
    return <Crown size={size} className={className} />;
  }
  if (a.includes('shield') || /[\u{1F6E1}]/u.test(a)) {
    return <Shield size={size} className={className} />;
  }
  if (a.includes('wizard') || a.includes('wand') || a.includes('mage') || /[\u{1F9D9}]/u.test(a)) {
    return <Wand2 size={size} className={className} />;
  }
  if (a.includes('target') || a.includes('bullseye') || /[\u{1F3AF}]/u.test(a)) {
    return <Crosshair size={size} className={className} />;
  }
  if (a.includes('rocket') || /[\u{1F680}]/u.test(a)) {
    return <Rocket size={size} className={className} />;
  }
  if (a.includes('gem') || a.includes('diamond') || /[\u{1F48E}]/u.test(a)) {
    return <Gem size={size} className={className} />;
  }
  if (a.includes('flame') || a.includes('fire') || /[\u{1F525}]/u.test(a)) {
    return <Flame size={size} className={className} />;
  }
  if (a.includes('zap') || a.includes('lightning') || /[\u{26A1}]/u.test(a)) {
    return <Zap size={size} className={className} />;
  }
  if (a.includes('dice') || a.includes('dices') || /[\u{1F3B2}]/u.test(a)) {
    return <Dices size={size} className={className} />;
  }
  if (a.includes('trophy') || /[\u{1F3C6}]/u.test(a)) {
    return <Trophy size={size} className={className} />;
  }
  if (a.includes('star') || /[\u{2B50}]/u.test(a)) {
    return <Sparkles size={size} className={className} />;
  }

  // Fallback cleanly to human player icon
  return <User size={size} className={className} />;
};
