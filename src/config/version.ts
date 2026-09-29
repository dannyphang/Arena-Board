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
  version: 'v1.5.1',
  releaseDate: '2026-09-29 17:07 UTC',
  buildId: 'bld-20260929170727-v151',
  environment: typeof window !== 'undefined' ? window.location.hostname : 'production',
  latestPrompt: "Add README, package-lock, and auto-version hook",
  promptDescription:
    "Add README, package-lock, and auto-version hook",
  changeLog: [
    {
      version: 'v1.5.1',
      date: '2026-09-29',
      prompt: "feat(ttr): Ticket to Ride - Full drafting, map highlights, player states, and tooltip UI improvements",
      highlights: [
        "feat(ttr): Ticket to Ride - Full drafting, map highlights, player states, and tooltip UI improvements\n\n- Implemented full drafting phase for destination tickets with validation.\n- Added map highlights for destination tickets (hover over ticket to light up route).\n- Fixed bot action handling to act as bots correctly during normal turns.\n- Fixed server room state sticking to 'waiting' for solo games.\n- Added native map tooltips to show how many cards a route requires.\n- Added full Player summary UI to the right panel showing score, remaining cars, and card counts.\n- Updated auto-versioning hook to respect manual version bumps in package.json."
      ],
    },
    {
      version: 'v1.4.5',
      date: '2026-09-29',
      prompt: "Update hook to post-commit",
      highlights: [
        "Update hook to post-commit"
      ],
    },
    {
      version: 'v1.4.4',
      date: '2026-09-29',
      prompt: "Add README, package-lock, and auto-version hook",
      highlights: [
        "Add README, package-lock, and auto-version hook"
      ],
    },
    {
      version: 'v1.4.3',
      date: '2026-09-29',
      prompt: "Add README, package-lock, and auto-version hook",
      highlights: [
        "Add README, package-lock, and auto-version hook"
      ],
    },
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
