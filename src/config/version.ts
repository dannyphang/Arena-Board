export interface AppVersionInfo {
  version: string;
  releaseDate: string;
  buildId: string;
  environment: string;
  latestPrompt: string;
  promptDescription: string;
  changeLog: {
    version: string;
    date: string;
    prompt: string;
    highlights: string[];
  }[];
}

export const APP_VERSION_INFO: AppVersionInfo = {
  version: 'v1.4.2',
  releaseDate: '2026-09-29 08:20 UTC',
  buildId: 'bld-20260929-catan-res-colors-v142',
  environment: typeof window !== 'undefined' ? window.location.hostname : 'production',
  latestPrompt: '1. App version info under footer with interactive version & prompt inspector dialog.\n2. In "Your Resource Cards", card backgrounds styled with their represented colors. Same for Catan Trading Center dialog.',
  promptDescription:
    'Version v1.4.2 introduces authentic thematic background colors for all Catan resource cards (Wood = Forest Green, Brick = Terracotta Red, Sheep = Pasture Lime, Wheat = Goldenrod, Ore = Mountain Slate) in both the player hand tray and the Catan Trading Center dialog. Also adds a clickable App Version badge under the footer that reveals the active version, full prompt specification, and server health check to verify the latest deployment in any environment.',
  changeLog: [
    {
      version: 'v1.4.2',
      date: '2026-09-29',
      prompt: 'Catan resource card thematic background colors & interactive footer App Version inspector.',
      highlights: [
        'App Version badge under footer opening prompt description and environment freshness inspector',
        '"Your Resource Cards" styled with represented colors for wood, brick, sheep, wheat, and ore',
        'Catan Trading Center dialog cards (Offer, Request, Harbor) updated with matching thematic colors',
      ],
    },
    {
      version: 'v1.4.1',
      date: '2026-09-29',
      prompt: 'Mr. Jack token hover glow, move & ability dossier, John Smith gaslight fix, Catan board shuffle, Esc shortcuts, icon-only table actions.',
      highlights: [
        'Mr. Jack token hover outline glow without bouncy scaling',
        'Right sidebar Character Dossier with full movement allowance and ability details',
        'John Smith ability fixed with unlit lamp post targets (hexes 26 & 58) and board clickability',
        'Shuffle Board button in Catan toolbar to re-generate randomized terrains and numbers',
        'Esc keyboard shortcut across modals, moves, and build mode',
        'Icon-only remove button, icon-only type badges, and difficulty-only dropdown text',
      ],
    },
    {
      version: 'v1.4.0',
      date: '2026-09-29',
      prompt: 'Mr. Jack in London authentic Whitechapel map, 8 character abilities, and Catan AI bot solo practice.',
      highlights: [
        'Victorian Whitechapel 86-hex board with authentic character sprites and alibi cards',
        'Witness call report and suspect clearance system',
        'Settlers of Catan multiplayer arena with trade, ports, robber, and victory condition tracking',
      ],
    },
  ],
};
