#!/bin/bash
cd src/games/seven-wonders-duel/
npx tsc engine.ts constants.ts types.ts bot.ts --outDir ../../../../dist-test
cd ../../../../dist-test
cat << 'TEST' > test.js
const { createInitialSWDGame, processSWDAction } = require('./engine.js');
const p1 = { id: 'user1', name: 'Danny', avatar: 'x', isBot: false };
const p2 = { id: 'bot1', name: 'Bot', avatar: 'x', isBot: true };
const state = createInitialSWDGame(p1, p2);
const wonderId = state.wonderDraftPool[0];
console.log('Pool:', state.wonderDraftPool);
console.log('Drafting wonder:', wonderId);
const nextState = processSWDAction(state, 'user1', { type: 'draft_wonder', wonderId });
console.log('Success! Active player is now:', nextState.activePlayerId);
TEST
node test.js
