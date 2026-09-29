import { Route, DestinationTicket } from './types';

export const CITIES = {
  AMSTERDAM: 'Amsterdam', ANGORA: 'Angora', ATHINA: 'Athina', BARCELONA: 'Barcelona',
  BERLIN: 'Berlin', BREST: 'Brest', BRINDISI: 'Brindisi', BRUXELLES: 'Bruxelles',
  BUCURESTI: 'Bucuresti', BUDAPEST: 'Budapest', CADIZ: 'Cadiz', CONSTANTINOPLE: 'Constantinople',
  DANZIG: 'Danzig', DIEPPE: 'Dieppe', EDINBURGH: 'Edinburgh', ERZURUM: 'Erzurum',
  ESSEN: 'Essen', FIRENZE: 'Firenze', FRANKFURT: 'Frankfurt', KHARKOV: 'Kharkov',
  KOBENHAVN: 'Kobenhavn', KYIV: 'Kyiv', LEIPZIG: 'Leipzig', LISBOA: 'Lisboa',
  LONDON: 'London', MADRID: 'Madrid', MARSEILLE: 'Marseille', MOSKVA: 'Moskva',
  MUNCHEN: 'München', NAPOLI: 'Napoli', OSLO: 'Oslo', PALERMO: 'Palermo',
  PAMPLONA: 'Pamplona', PARIS: 'Paris', PETROGRAD: 'Petrograd', RIGA: 'Riga',
  ROMA: 'Roma', ROSTOV: 'Rostov', SARAJEVO: 'Sarajevo', SEVASTOPOL: 'Sevastopol',
  SMOLENSK: 'Smolensk', SMYRNA: 'Smyrna', SOCHI: 'Sochi', SOFIA: 'Sofia',
  STOCKHOLM: 'Stockholm', VENEZIA: 'Venezia', WARSZAWA: 'Warszawa', WIEN: 'Wien', ZAGREB: 'Zagreb',
  ZURICH: 'Zürich'
};

export const INITIAL_ROUTES: Record<string, Route> = {
  // Great Britain & Ireland
  'edinburgh-london-1': { id: 'edinburgh-london-1', city1: CITIES.EDINBURGH, city2: CITIES.LONDON, length: 4, color: 'black' },
  'edinburgh-london-2': { id: 'edinburgh-london-2', city1: CITIES.EDINBURGH, city2: CITIES.LONDON, length: 4, color: 'orange' },
  
  // Cross-Channel Ferries
  'london-dieppe-1': { id: 'london-dieppe-1', city1: CITIES.LONDON, city2: CITIES.DIEPPE, length: 2, color: 'any', locomotivesRequired: 1 },
  'london-dieppe-2': { id: 'london-dieppe-2', city1: CITIES.LONDON, city2: CITIES.DIEPPE, length: 2, color: 'any', locomotivesRequired: 1 },
  'london-amsterdam': { id: 'london-amsterdam', city1: CITIES.LONDON, city2: CITIES.AMSTERDAM, length: 2, color: 'any', locomotivesRequired: 2 },
  
  // France & Spain
  'dieppe-paris': { id: 'dieppe-paris', city1: CITIES.DIEPPE, city2: CITIES.PARIS, length: 1, color: 'purple' },
  'dieppe-bruxelles': { id: 'dieppe-bruxelles', city1: CITIES.DIEPPE, city2: CITIES.BRUXELLES, length: 2, color: 'green' },
  'brest-dieppe': { id: 'brest-dieppe', city1: CITIES.BREST, city2: CITIES.DIEPPE, length: 2, color: 'orange' },
  'brest-paris': { id: 'brest-paris', city1: CITIES.BREST, city2: CITIES.PARIS, length: 3, color: 'black' },
  'brest-pamplona': { id: 'brest-pamplona', city1: CITIES.BREST, city2: CITIES.PAMPLONA, length: 4, color: 'purple' },
  'paris-pamplona': { id: 'paris-pamplona', city1: CITIES.PARIS, city2: CITIES.PAMPLONA, length: 4, color: 'blue' },
  'paris-marseille': { id: 'paris-marseille', city1: CITIES.PARIS, city2: CITIES.MARSEILLE, length: 4, color: 'any' },
  'paris-zurich': { id: 'paris-zurich', city1: CITIES.PARIS, city2: CITIES.ZURICH, length: 3, color: 'any', isTunnel: true },
  'paris-frankfurt-1': { id: 'paris-frankfurt-1', city1: CITIES.PARIS, city2: CITIES.FRANKFURT, length: 3, color: 'blue' },
  'paris-frankfurt-2': { id: 'paris-frankfurt-2', city1: CITIES.PARIS, city2: CITIES.FRANKFURT, length: 3, color: 'orange' },
  'paris-bruxelles-1': { id: 'paris-bruxelles-1', city1: CITIES.PARIS, city2: CITIES.BRUXELLES, length: 2, color: 'yellow' },
  'paris-bruxelles-2': { id: 'paris-bruxelles-2', city1: CITIES.PARIS, city2: CITIES.BRUXELLES, length: 2, color: 'red' },
  'pamplona-madrid-1': { id: 'pamplona-madrid-1', city1: CITIES.PAMPLONA, city2: CITIES.MADRID, length: 3, color: 'white' },
  'pamplona-madrid-2': { id: 'pamplona-madrid-2', city1: CITIES.PAMPLONA, city2: CITIES.MADRID, length: 3, color: 'black' },
  'pamplona-barcelona': { id: 'pamplona-barcelona', city1: CITIES.PAMPLONA, city2: CITIES.BARCELONA, length: 2, color: 'any', isTunnel: true },
  'pamplona-marseille': { id: 'pamplona-marseille', city1: CITIES.PAMPLONA, city2: CITIES.MARSEILLE, length: 4, color: 'red' },
  'madrid-lisboa': { id: 'madrid-lisboa', city1: CITIES.MADRID, city2: CITIES.LISBOA, length: 3, color: 'any' },
  'madrid-cadiz': { id: 'madrid-cadiz', city1: CITIES.MADRID, city2: CITIES.CADIZ, length: 3, color: 'orange' },
  'madrid-barcelona': { id: 'madrid-barcelona', city1: CITIES.MADRID, city2: CITIES.BARCELONA, length: 2, color: 'yellow' },
  'lisboa-cadiz': { id: 'lisboa-cadiz', city1: CITIES.LISBOA, city2: CITIES.CADIZ, length: 2, color: 'blue' },
  'barcelona-marseille': { id: 'barcelona-marseille', city1: CITIES.BARCELONA, city2: CITIES.MARSEILLE, length: 4, color: 'any' },
  
  // Germany & Central Europe
  'amsterdam-bruxelles': { id: 'amsterdam-bruxelles', city1: CITIES.AMSTERDAM, city2: CITIES.BRUXELLES, length: 1, color: 'black' },
  'amsterdam-essen': { id: 'amsterdam-essen', city1: CITIES.AMSTERDAM, city2: CITIES.ESSEN, length: 3, color: 'yellow' },
  'amsterdam-frankfurt': { id: 'amsterdam-frankfurt', city1: CITIES.AMSTERDAM, city2: CITIES.FRANKFURT, length: 2, color: 'white' },
  'bruxelles-frankfurt': { id: 'bruxelles-frankfurt', city1: CITIES.BRUXELLES, city2: CITIES.FRANKFURT, length: 2, color: 'blue' },
  'essen-frankfurt': { id: 'essen-frankfurt', city1: CITIES.ESSEN, city2: CITIES.FRANKFURT, length: 2, color: 'green' },
  'essen-bremen': { id: 'essen-kobenhavn', city1: CITIES.ESSEN, city2: CITIES.KOBENHAVN, length: 3, color: 'any', locomotivesRequired: 1 }, // Ferry
  'essen-berlin': { id: 'essen-berlin', city1: CITIES.ESSEN, city2: CITIES.BERLIN, length: 2, color: 'blue' },
  'frankfurt-berlin': { id: 'frankfurt-berlin', city1: CITIES.FRANKFURT, city2: CITIES.BERLIN, length: 3, color: 'black' },
  'frankfurt-leipzig': { id: 'frankfurt-leipzig', city1: CITIES.FRANKFURT, city2: CITIES.LEIPZIG, length: 1, color: 'any' },
  'frankfurt-munchen': { id: 'frankfurt-munchen', city1: CITIES.FRANKFURT, city2: CITIES.MUNCHEN, length: 2, color: 'purple' },
  'berlin-leipzig': { id: 'berlin-leipzig', city1: CITIES.BERLIN, city2: CITIES.LEIPZIG, length: 2, color: 'yellow' },
  'berlin-danzig': { id: 'berlin-danzig', city1: CITIES.BERLIN, city2: CITIES.DANZIG, length: 4, color: 'any' },
  'berlin-warszawa': { id: 'berlin-warszawa', city1: CITIES.BERLIN, city2: CITIES.WARSZAWA, length: 4, color: 'purple' },
  'berlin-wien': { id: 'berlin-wien', city1: CITIES.BERLIN, city2: CITIES.WIEN, length: 3, color: 'green' },
  'leipzig-munchen': { id: 'leipzig-munchen', city1: CITIES.LEIPZIG, city2: CITIES.MUNCHEN, length: 2, color: 'blue' },
  'leipzig-wien': { id: 'leipzig-wien', city1: CITIES.LEIPZIG, city2: CITIES.WIEN, length: 3, color: 'any' },
  'munchen-wien': { id: 'munchen-wien', city1: CITIES.MUNCHEN, city2: CITIES.WIEN, length: 3, color: 'orange' },
  'munchen-zurich': { id: 'munchen-zurich', city1: CITIES.MUNCHEN, city2: CITIES.ZURICH, length: 2, color: 'yellow', isTunnel: true },
  'munchen-venezia': { id: 'munchen-venezia', city1: CITIES.MUNCHEN, city2: CITIES.VENEZIA, length: 2, color: 'blue', isTunnel: true },
  
  // Southern Europe
  'zurich-venezia': { id: 'zurich-venezia', city1: CITIES.ZURICH, city2: CITIES.VENEZIA, length: 2, color: 'green', isTunnel: true },
  'marseille-zurich': { id: 'marseille-zurich', city1: CITIES.MARSEILLE, city2: CITIES.ZURICH, length: 2, color: 'purple', isTunnel: true },
  'marseille-roma': { id: 'marseille-roma', city1: CITIES.MARSEILLE, city2: CITIES.ROMA, length: 4, color: 'any', isTunnel: true },
  'venezia-roma': { id: 'venezia-roma', city1: CITIES.VENEZIA, city2: CITIES.ROMA, length: 2, color: 'black' },
  'venezia-zagreb': { id: 'venezia-zagreb', city1: CITIES.VENEZIA, city2: CITIES.ZAGREB, length: 2, color: 'any' },
  'roma-napoli': { id: 'roma-napoli', city1: CITIES.ROMA, city2: CITIES.NAPOLI, length: 2, color: 'white' },
  'roma-palermo': { id: 'roma-palermo', city1: CITIES.ROMA, city2: CITIES.PALERMO, length: 4, color: 'any', locomotivesRequired: 1 }, // Ferry
  'roma-brindisi': { id: 'roma-brindisi', city1: CITIES.ROMA, city2: CITIES.BRINDISI, length: 2, color: 'any' },
  'napoli-palermo': { id: 'napoli-palermo', city1: CITIES.NAPOLI, city2: CITIES.PALERMO, length: 3, color: 'any', locomotivesRequired: 1 }, // Ferry
  'napoli-brindisi': { id: 'napoli-brindisi', city1: CITIES.NAPOLI, city2: CITIES.BRINDISI, length: 2, color: 'any', isTunnel: true },
  'palermo-smyrna': { id: 'palermo-smyrna', city1: CITIES.PALERMO, city2: CITIES.SMYRNA, length: 6, color: 'any', locomotivesRequired: 2 }, // Ferry
  'brindisi-athina': { id: 'brindisi-athina', city1: CITIES.BRINDISI, city2: CITIES.ATHINA, length: 4, color: 'any', locomotivesRequired: 1 }, // Ferry
  'zagreb-wien': { id: 'zagreb-wien', city1: CITIES.ZAGREB, city2: CITIES.WIEN, length: 2, color: 'any' },
  'zagreb-budapest': { id: 'zagreb-budapest', city1: CITIES.ZAGREB, city2: CITIES.BUDAPEST, length: 2, color: 'orange' },
  'zagreb-sarajevo': { id: 'zagreb-sarajevo', city1: CITIES.ZAGREB, city2: CITIES.SARAJEVO, length: 3, color: 'red' },
  'sarajevo-budapest': { id: 'sarajevo-budapest', city1: CITIES.SARAJEVO, city2: CITIES.BUDAPEST, length: 3, color: 'any' },
  'sarajevo-athina': { id: 'sarajevo-athina', city1: CITIES.SARAJEVO, city2: CITIES.ATHINA, length: 4, color: 'green' },
  'sarajevo-sofia': { id: 'sarajevo-sofia', city1: CITIES.SARAJEVO, city2: CITIES.SOFIA, length: 2, color: 'any' },
  'athina-sofia': { id: 'athina-sofia', city1: CITIES.ATHINA, city2: CITIES.SOFIA, length: 3, color: 'purple' },
  'athina-smyrna': { id: 'athina-smyrna', city1: CITIES.ATHINA, city2: CITIES.SMYRNA, length: 2, color: 'any', locomotivesRequired: 1 }, // Ferry
  
  // Eastern Europe
  'wien-budapest-1': { id: 'wien-budapest-1', city1: CITIES.WIEN, city2: CITIES.BUDAPEST, length: 1, color: 'white' },
  'wien-budapest-2': { id: 'wien-budapest-2', city1: CITIES.WIEN, city2: CITIES.BUDAPEST, length: 1, color: 'red' },
  'wien-warszawa': { id: 'wien-warszawa', city1: CITIES.WIEN, city2: CITIES.WARSZAWA, length: 4, color: 'blue' },
  'budapest-bucuresti': { id: 'budapest-bucuresti', city1: CITIES.BUDAPEST, city2: CITIES.BUCURESTI, length: 4, color: 'any', isTunnel: true },
  'budapest-kyiv': { id: 'budapest-kyiv', city1: CITIES.BUDAPEST, city2: CITIES.KYIV, length: 6, color: 'any', isTunnel: true },
  'sofia-bucuresti': { id: 'sofia-bucuresti', city1: CITIES.SOFIA, city2: CITIES.BUCURESTI, length: 2, color: 'any', isTunnel: true },
  'sofia-constantinople': { id: 'sofia-constantinople', city1: CITIES.SOFIA, city2: CITIES.CONSTANTINOPLE, length: 3, color: 'blue' },
  'bucuresti-constantinople': { id: 'bucuresti-constantinople', city1: CITIES.BUCURESTI, city2: CITIES.CONSTANTINOPLE, length: 3, color: 'yellow' },
  'bucuresti-sevastopol': { id: 'bucuresti-sevastopol', city1: CITIES.BUCURESTI, city2: CITIES.SEVASTOPOL, length: 4, color: 'white' },
  'bucuresti-kyiv': { id: 'bucuresti-kyiv', city1: CITIES.BUCURESTI, city2: CITIES.KYIV, length: 4, color: 'any' },
  'constantinople-smyrna': { id: 'constantinople-smyrna', city1: CITIES.CONSTANTINOPLE, city2: CITIES.SMYRNA, length: 2, color: 'any', isTunnel: true },
  'constantinople-angora': { id: 'constantinople-angora', city1: CITIES.CONSTANTINOPLE, city2: CITIES.ANGORA, length: 2, color: 'any', isTunnel: true },
  'constantinople-sevastopol': { id: 'constantinople-sevastopol', city1: CITIES.CONSTANTINOPLE, city2: CITIES.SEVASTOPOL, length: 4, color: 'any', locomotivesRequired: 2 }, // Ferry
  'smyrna-angora': { id: 'smyrna-angora', city1: CITIES.SMYRNA, city2: CITIES.ANGORA, length: 3, color: 'orange', isTunnel: true },
  'smyrna-erzurum': { id: 'smyrna-erzurum', city1: CITIES.SMYRNA, city2: CITIES.ERZURUM, length: 5, color: 'any', isTunnel: true },
  'angora-erzurum': { id: 'angora-erzurum', city1: CITIES.ANGORA, city2: CITIES.ERZURUM, length: 3, color: 'black' },
  'erzurum-sevastopol': { id: 'erzurum-sevastopol', city1: CITIES.ERZURUM, city2: CITIES.SEVASTOPOL, length: 4, color: 'any', locomotivesRequired: 2 }, // Ferry
  'erzurum-sochi': { id: 'erzurum-sochi', city1: CITIES.ERZURUM, city2: CITIES.SOCHI, length: 3, color: 'red', isTunnel: true },
  'sevastopol-sochi': { id: 'sevastopol-sochi', city1: CITIES.SEVASTOPOL, city2: CITIES.SOCHI, length: 2, color: 'any', locomotivesRequired: 1 }, // Ferry
  'sevastopol-rostov': { id: 'sevastopol-rostov', city1: CITIES.SEVASTOPOL, city2: CITIES.ROSTOV, length: 4, color: 'any' },
  'sochi-rostov': { id: 'sochi-rostov', city1: CITIES.SOCHI, city2: CITIES.ROSTOV, length: 2, color: 'any' },
  'rostov-kharkov': { id: 'rostov-kharkov', city1: CITIES.ROSTOV, city2: CITIES.KHARKOV, length: 2, color: 'green' },
  'kharkov-kyiv': { id: 'kharkov-kyiv', city1: CITIES.KHARKOV, city2: CITIES.KYIV, length: 4, color: 'any' },
  'kharkov-moskva': { id: 'kharkov-moskva', city1: CITIES.KHARKOV, city2: CITIES.MOSKVA, length: 4, color: 'any' },
  'kyiv-warszawa': { id: 'kyiv-warszawa', city1: CITIES.KYIV, city2: CITIES.WARSZAWA, length: 4, color: 'any' },
  'kyiv-smolensk': { id: 'kyiv-smolensk', city1: CITIES.KYIV, city2: CITIES.SMOLENSK, length: 3, color: 'red' },
  'warszawa-danzig': { id: 'warszawa-danzig', city1: CITIES.WARSZAWA, city2: CITIES.DANZIG, length: 2, color: 'any' },
  'warszawa-riga': { id: 'warszawa-riga', city1: CITIES.WARSZAWA, city2: CITIES.RIGA, length: 3, color: 'any' },
  'danzig-riga': { id: 'danzig-riga', city1: CITIES.DANZIG, city2: CITIES.RIGA, length: 3, color: 'black' },
  'riga-petrograd': { id: 'riga-petrograd', city1: CITIES.RIGA, city2: CITIES.PETROGRAD, length: 4, color: 'any' },
  'riga-moskva': { id: 'riga-moskva', city1: CITIES.RIGA, city2: CITIES.MOSKVA, length: 6, color: 'any' },
  'smolensk-moskva': { id: 'smolensk-moskva', city1: CITIES.SMOLENSK, city2: CITIES.MOSKVA, length: 2, color: 'orange' },
  'smolensk-petrograd': { id: 'smolensk-petrograd', city1: CITIES.SMOLENSK, city2: CITIES.PETROGRAD, length: 4, color: 'any' },
  'moskva-petrograd': { id: 'moskva-petrograd', city1: CITIES.MOSKVA, city2: CITIES.PETROGRAD, length: 4, color: 'white' },
  
  // Nordics
  'kobenhavn-stockholm': { id: 'kobenhavn-stockholm', city1: CITIES.KOBENHAVN, city2: CITIES.STOCKHOLM, length: 3, color: 'yellow' },
  'kobenhavn-oslo': { id: 'kobenhavn-oslo', city1: CITIES.KOBENHAVN, city2: CITIES.OSLO, length: 3, color: 'orange', locomotivesRequired: 1 }, // Ferry
  'oslo-stockholm': { id: 'oslo-stockholm', city1: CITIES.OSLO, city2: CITIES.STOCKHOLM, length: 3, color: 'any', isTunnel: true },
  'stockholm-petrograd': { id: 'stockholm-petrograd', city1: CITIES.STOCKHOLM, city2: CITIES.PETROGRAD, length: 8, color: 'any', isTunnel: true } // The famous 8-length tunnel
};

export const INITIAL_DESTINATIONS: DestinationTicket[] = [
  // Long Routes (drawn at start, one dealt to each player, they can choose to keep)
  { id: 'cadiz-stockholm', city1: CITIES.CADIZ, city2: CITIES.STOCKHOLM, points: 21 },
  { id: 'lisboa-danzig', city1: CITIES.LISBOA, city2: CITIES.DANZIG, points: 20 },
  { id: 'edinburgh-athina', city1: CITIES.EDINBURGH, city2: CITIES.ATHINA, points: 21 },
  { id: 'kobenhavn-erzurum', city1: CITIES.KOBENHAVN, city2: CITIES.ERZURUM, points: 21 },
  { id: 'brest-petrograd', city1: CITIES.BREST, city2: CITIES.PETROGRAD, points: 20 },
  { id: 'palermo-moskva', city1: CITIES.PALERMO, city2: CITIES.MOSKVA, points: 20 },

  // Regular Routes
  { id: 'athens-ankara', city1: CITIES.ATHINA, city2: CITIES.ANGORA, points: 5 },
  { id: 'budapest-sofia', city1: CITIES.BUDAPEST, city2: CITIES.SOFIA, points: 5 },
  { id: 'frankfurt-kobenhavn', city1: CITIES.FRANKFURT, city2: CITIES.KOBENHAVN, points: 5 },
  { id: 'rostov-erzurum', city1: CITIES.ROSTOV, city2: CITIES.ERZURUM, points: 5 },
  { id: 'sofia-smyrna', city1: CITIES.SOFIA, city2: CITIES.SMYRNA, points: 5 },
  { id: 'kyiv-petrograd', city1: CITIES.KYIV, city2: CITIES.PETROGRAD, points: 6 },
  { id: 'zurich-brindisi', city1: CITIES.ZURICH, city2: CITIES.BRINDISI, points: 6 },
  { id: 'zurich-budapest', city1: CITIES.ZURICH, city2: CITIES.BUDAPEST, points: 6 },
  { id: 'warszawa-smolensk', city1: CITIES.WARSZAWA, city2: CITIES.SMOLENSK, points: 6 },
  { id: 'zagreb-brindisi', city1: CITIES.ZAGREB, city2: CITIES.BRINDISI, points: 6 },
  { id: 'paris-zurich-ticket', city1: CITIES.PARIS, city2: CITIES.ZURICH, points: 6 }, // Distinguish ID
  { id: 'paris-zagreb', city1: CITIES.PARIS, city2: CITIES.ZAGREB, points: 7 },
  { id: 'brest-marseille', city1: CITIES.BREST, city2: CITIES.MARSEILLE, points: 7 },
  { id: 'london-berlin', city1: CITIES.LONDON, city2: CITIES.BERLIN, points: 7 },
  { id: 'edinburgh-paris', city1: CITIES.EDINBURGH, city2: CITIES.PARIS, points: 7 },
  { id: 'amsterdam-pamplona', city1: CITIES.AMSTERDAM, city2: CITIES.PAMPLONA, points: 7 },
  { id: 'roma-smyrna', city1: CITIES.ROMA, city2: CITIES.SMYRNA, points: 8 },
  { id: 'palermo-constantinople', city1: CITIES.PALERMO, city2: CITIES.CONSTANTINOPLE, points: 8 },
  { id: 'sarajevo-sevastopol', city1: CITIES.SARAJEVO, city2: CITIES.SEVASTOPOL, points: 8 },
  { id: 'madrid-dieppe', city1: CITIES.MADRID, city2: CITIES.DIEPPE, points: 8 },
  { id: 'barcelona-bruxelles', city1: CITIES.BARCELONA, city2: CITIES.BRUXELLES, points: 8 },
  { id: 'paris-wien', city1: CITIES.PARIS, city2: CITIES.WIEN, points: 8 },
  { id: 'barcelona-munchen', city1: CITIES.BARCELONA, city2: CITIES.MUNCHEN, points: 8 },
  { id: 'venezia-constantinople', city1: CITIES.VENEZIA, city2: CITIES.CONSTANTINOPLE, points: 10 },
  { id: 'london-wien', city1: CITIES.LONDON, city2: CITIES.WIEN, points: 10 },
  { id: 'madrid-roma', city1: CITIES.MADRID, city2: CITIES.ROMA, points: 10 },
  { id: 'lisboa-zurich', city1: CITIES.LISBOA, city2: CITIES.ZURICH, points: 10 },
  { id: 'kyiv-sochi', city1: CITIES.KYIV, city2: CITIES.SOCHI, points: 8 },
  { id: 'riga-bucuresti', city1: CITIES.RIGA, city2: CITIES.BUCURESTI, points: 10 },
  { id: 'essen-kyiv', city1: CITIES.ESSEN, city2: CITIES.KYIV, points: 10 },
  { id: 'venezia-moskva', city1: CITIES.VENEZIA, city2: CITIES.MOSKVA, points: 11 },
  { id: 'frankfurt-smolensk', city1: CITIES.FRANKFURT, city2: CITIES.SMOLENSK, points: 11 },
  { id: 'amsterdam-wien', city1: CITIES.AMSTERDAM, city2: CITIES.WIEN, points: 11 },
  { id: 'madrid-zurich', city1: CITIES.MADRID, city2: CITIES.ZURICH, points: 11 },
  { id: 'berlin-roma', city1: CITIES.BERLIN, city2: CITIES.ROMA, points: 11 },
  { id: 'berlin-bucuresti', city1: CITIES.BERLIN, city2: CITIES.BUCURESTI, points: 11 },
  { id: 'berlin-moskva', city1: CITIES.BERLIN, city2: CITIES.MOSKVA, points: 12 },
  { id: 'paris-frankfurt-ticket', city1: CITIES.PARIS, city2: CITIES.FRANKFURT, points: 12 },
  { id: 'lisboa-marseille', city1: CITIES.LISBOA, city2: CITIES.MARSEILLE, points: 12 },
];
