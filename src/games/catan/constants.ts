import { DevCardType, HexTerrain, PlayerColor, ResourceCount } from './types';

export const BUILDING_COSTS: Record<'road' | 'settlement' | 'city' | 'devCard', ResourceCount> = {
  road: { wood: 1, brick: 1, sheep: 0, wheat: 0, ore: 0 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1, ore: 0 },
  city: { wood: 0, brick: 0, sheep: 0, wheat: 2, ore: 3 },
  devCard: { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 },
};

export const RESOURCE_DETAILS: Record<
  HexTerrain,
  { name: string; icon: string; color: string; bg: string; border: string }
> = {
  wood: {
    name: 'Lumber (Forest)',
    icon: 'wood',
    color: '#22c55e',
    bg: '#14532d',
    border: '#16a34a',
  },
  brick: {
    name: 'Brick (Hills)',
    icon: 'brick',
    color: '#f97316',
    bg: '#7c2d12',
    border: '#ea580c',
  },
  sheep: {
    name: 'Wool (Pasture)',
    icon: 'sheep',
    color: '#84cc16',
    bg: '#365314',
    border: '#65a30d',
  },
  wheat: {
    name: 'Grain (Fields)',
    icon: 'wheat',
    color: '#eab308',
    bg: '#713f12',
    border: '#ca8a04',
  },
  ore: {
    name: 'Ore (Mountains)',
    icon: 'ore',
    color: '#94a3b8',
    bg: '#334155',
    border: '#64748b',
  },
  desert: {
    name: 'Desert (Barren)',
    icon: 'desert',
    color: '#d97706',
    bg: '#451a03',
    border: '#b45309',
  },
};

export const PLAYER_COLORS: Record<
  PlayerColor,
  { name: string; hex: string; bg: string; border: string; text: string }
> = {
  red: {
    name: 'Red',
    hex: '#ef4444',
    bg: '#7f1d1d',
    border: '#dc2626',
    text: 'text-red-400',
  },
  blue: {
    name: 'Blue',
    hex: '#3b82f6',
    bg: '#1e3a8a',
    border: '#2563eb',
    text: 'text-blue-400',
  },
  orange: {
    name: 'Orange',
    hex: '#f97316',
    bg: '#7c2d12',
    border: '#ea580c',
    text: 'text-orange-400',
  },
  white: {
    name: 'White',
    hex: '#f8fafc',
    bg: '#334155',
    border: '#cbd5e1',
    text: 'text-slate-100',
  },
};

export const DICE_PIPS: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

export const DEV_CARD_NAMES: Record<DevCardType, { name: string; icon: string; desc: string }> = {
  knight: {
    name: 'Knight',
    icon: 'knight',
    desc: 'Move the robber and steal 1 resource from an adjacent settlement owner. 3 knights = Largest Army (2 VP).',
  },
  roadBuilding: {
    name: 'Road Building',
    icon: 'roadBuilding',
    desc: 'Place 2 free roads immediately without spending resources.',
  },
  yearOfPlenty: {
    name: 'Year of Plenty',
    icon: 'yearOfPlenty',
    desc: 'Take any 2 resources from the bank of your choice.',
  },
  monopoly: {
    name: 'Monopoly',
    icon: 'monopoly',
    desc: 'Name 1 resource type. All other players must give you all their cards of that type.',
  },
  victoryPoint: {
    name: 'Victory Point',
    icon: 'victoryPoint',
    desc: 'Secret 1 Victory Point! Reveals automatically upon reaching 10 VP.',
  },
};

export const INITIAL_DEV_CARD_DECK: DevCardType[] = [
  ...Array(14).fill('knight'),
  ...Array(5).fill('victoryPoint'),
  ...Array(2).fill('roadBuilding'),
  ...Array(2).fill('yearOfPlenty'),
  ...Array(2).fill('monopoly'),
];
