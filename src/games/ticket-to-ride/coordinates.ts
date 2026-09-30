import { CITIES } from './constants';

export interface CityPos {
  x: number;
  y: number;
  labelPos?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const CITY_COORDINATES: Record<string, CityPos> = {
  // Great Britain
  [CITIES.EDINBURGH]: { x: 215, y: 95, labelPos: 'top' },
  [CITIES.LONDON]: { x: 275, y: 285, labelPos: 'bottom-left' },

  // France & Iberia
  [CITIES.DIEPPE]: { x: 310, y: 405, labelPos: 'top-left' },
  [CITIES.BREST]: { x: 180, y: 460, labelPos: 'left' },
  [CITIES.PARIS]: { x: 365, y: 485, labelPos: 'top' },
  [CITIES.PAMPLONA]: { x: 285, y: 690, labelPos: 'left' },
  [CITIES.MADRID]: { x: 185, y: 795, labelPos: 'top-left' },
  [CITIES.LISBOA]: { x: 65, y: 840, labelPos: 'left' },
  [CITIES.CADIZ]: { x: 150, y: 930, labelPos: 'bottom' },
  [CITIES.BARCELONA]: { x: 330, y: 825, labelPos: 'bottom-right' },
  [CITIES.MARSEILLE]: { x: 490, y: 700, labelPos: 'bottom-left' },

  // Central Europe
  [CITIES.BRUXELLES]: { x: 420, y: 380, labelPos: 'top-right' },
  [CITIES.AMSTERDAM]: { x: 440, y: 285, labelPos: 'top' },
  [CITIES.ESSEN]: { x: 545, y: 325, labelPos: 'top' },
  [CITIES.FRANKFURT]: { x: 555, y: 420, labelPos: 'bottom-left' },
  [CITIES.ZURICH]: { x: 520, y: 560, labelPos: 'left' },
  [CITIES.MUNCHEN]: { x: 615, y: 495, labelPos: 'top-right' },
  [CITIES.LEIPZIG]: { x: 655, y: 410, labelPos: 'top-left' },
  [CITIES.BERLIN]: { x: 695, y: 335, labelPos: 'top' },
  [CITIES.WIEN]: { x: 755, y: 485, labelPos: 'top' },
  [CITIES.DANZIG]: { x: 845, y: 235, labelPos: 'top' },
  [CITIES.WARSZAWA]: { x: 925, y: 325, labelPos: 'top-left' },

  // Italy
  [CITIES.VENEZIA]: { x: 655, y: 615, labelPos: 'top-right' },
  [CITIES.FIRENZE]: { x: 640, y: 680, labelPos: 'left' },
  [CITIES.ROMA]: { x: 635, y: 755, labelPos: 'left' },
  [CITIES.NAPOLI]: { x: 705, y: 805, labelPos: 'bottom' },
  [CITIES.BRINDISI]: { x: 795, y: 765, labelPos: 'bottom-left' },
  [CITIES.PALERMO]: { x: 695, y: 925, labelPos: 'bottom' },

  // Nordics
  [CITIES.KOBENHAVN]: { x: 655, y: 175, labelPos: 'top-right' },
  [CITIES.OSLO]: { x: 580, y: 75, labelPos: 'top' },
  [CITIES.STOCKHOLM]: { x: 745, y: 55, labelPos: 'top' },

  // Eastern Europe
  [CITIES.RIGA]: { x: 965, y: 115, labelPos: 'top-right' },
  [CITIES.PETROGRAD]: { x: 1195, y: 85, labelPos: 'top' },
  [CITIES.SMOLENSK]: { x: 1185, y: 295, labelPos: 'top' },
  [CITIES.MOSKVA]: { x: 1315, y: 275, labelPos: 'top' },
  [CITIES.KYIV]: { x: 1145, y: 405, labelPos: 'top' },
  [CITIES.KHARKOV]: { x: 1315, y: 440, labelPos: 'top' },
  [CITIES.ROSTOV]: { x: 1355, y: 540, labelPos: 'top-right' },
  [CITIES.SEVASTOPOL]: { x: 1235, y: 645, labelPos: 'top' },
  [CITIES.SOCHI]: { x: 1335, y: 675, labelPos: 'top-right' },

  // Balkans & Anatolia
  [CITIES.ZAGREB]: { x: 755, y: 630, labelPos: 'bottom-left' },
  [CITIES.BUDAPEST]: { x: 885, y: 525, labelPos: 'top-right' },
  [CITIES.SARAJEVO]: { x: 835, y: 715, labelPos: 'bottom-left' },
  [CITIES.SOFIA]: { x: 975, y: 755, labelPos: 'top-right' },
  [CITIES.BUCURESTI]: { x: 1075, y: 635, labelPos: 'top' },
  [CITIES.ATHINA]: { x: 965, y: 865, labelPos: 'bottom' },
  [CITIES.CONSTANTINOPLE]: { x: 1085, y: 805, labelPos: 'top-left' },
  [CITIES.SMYRNA]: { x: 1070, y: 905, labelPos: 'bottom-left' },
  [CITIES.ANGORA]: { x: 1175, y: 885, labelPos: 'top' },
  [CITIES.ERZURUM]: { x: 1315, y: 855, labelPos: 'top-right' },
};

