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
  version: 'v1.6.1',
  releaseDate: '2026-09-30 17:01 UTC',
  buildId: 'bld-20260930170148-v161',
  environment: typeof window !== 'undefined' ? window.location.hostname : 'production',
  latestPrompt: "Add 7 Wonders - Duel with official spritesheets, draft pyramid, military track, and solo/multiplayer arena",
  promptDescription:
    "Added 7 Wonders - Duel with official spritesheets, draft pyramid, military track, and solo/multiplayer arena",
  changeLog: [
    {
      version: 'v1.6.1',
      date: '2026-09-30',
      prompt: "Add initial tests and update SWDCard component with detailed tooltips",
      highlights: [
        "Add initial tests and update SWDCard component with detailed tooltips\n\n- Created test.js for Seven Wonders Duel game logic to validate initial game state and action processing.\n- Added types.js to define module exports for the Seven Wonders Duel game.\n- Implemented test-swd.js and test-swd.ts for testing game functionality in JavaScript and TypeScript.\n- Enhanced SWDCard component with a detailed tooltip that displays card costs, rewards, and resources on hover."
      ],
    },
    {
      version: 'v1.6.0',
      date: '2026-09-30',
      prompt: "feat(swd): Add 7 Wonders - Duel with authentic sprites, draft pyramid, military & science supremacy",
      highlights: [
        "Integrated 7 Wonders - Duel using authentic spritesheets (cards, wonders, tokens, board, conflict pawn).",
        "Interactive 1-2-1 Wonder Drafting phase with all 12 base wonders and individual effects.",
        "Age I, II, and III draft pyramids with accurate uncovering and automatic card reveal mechanics.",
        "Comprehensive resource production, bank trade calculations with Yellow reserve cards, and linking chain icons.",
        "Vertical Conflict Board with moving conflict pawn, plunder loss tokens (-2, -5 coins), and 5 Progress Tokens.",
        "Three distinct victory paths: Military Supremacy, Scientific Supremacy (6 symbols), and Civilian Victory point calculations.",
        "Smart AI bot for solo practice and full real-time multiplayer support via WebSockets."
      ],
    },
    {
      version: 'v1.5.2',
      date: '2026-09-29',
      prompt: "fix(ui): Make Escape key listeners OS-resilient",
      highlights: [
        "fix(ui): Make Escape key listeners OS-resilient\n\n- Switched all global modal and arena 'Escape' keyboard shortcuts from 'keydown' to 'keyup' to prevent the OS or browser from swallowing the event.\n- Upgraded the key check to catch 'Esc' and keyCode 27 fallbacks for non-standard keyboards.\n- Rewrote the global modal closer in App.tsx to unconditionally clear all modal states, preventing hidden stuck states from trapping the event."
      ],
    },
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
