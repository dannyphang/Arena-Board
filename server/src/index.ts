import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import { TableRoom, PlayerSlot, ChatMessage, TimeControl, GameType } from '../../src/types/lobby';
import { UserProfile } from '../../src/types/user';
import { rollGeniusSquareDice, solveGeniusSquare } from '../../src/games/genius-square/solver';
import { PlacedPiece } from '../../src/games/genius-square/types';
import { createInitialMrJackGame } from '../../src/games/mr-jack/engine';
import { MrJackGameState } from '../../src/games/mr-jack/types';
import { createInitialCatanGame } from '../../src/games/catan/engine';
import { CatanGameState } from '../../src/games/catan/types';
import { createInitialTTRGame, processTTRAction } from '../../src/games/ticket-to-ride/engine';
import { TTRGameState, TTRAction } from '../../src/games/ticket-to-ride/types';
import { createInitialSWDGame, processSWDAction } from '../../src/games/seven-wonders-duel/engine';
import { SWDGameState, SWDAction } from '../../src/games/seven-wonders-duel/types';

export function createArenaServer(options?: { isStandalone?: boolean }) {
  const app = express();
  const server = http.createServer(app);

  const isStandalone = options?.isStandalone ?? (process.env.STANDALONE_SERVER === 'true');

  // In unified AI Studio / dev mode, the app MUST bind to port 3000 (default app port).
  // On Render, Render sets RENDER=true and assigns its own PORT (e.g. 10000).
  const isRender = process.env.RENDER === 'true' || process.env.IS_RENDER === 'true';
  const PORT =
    isRender && process.env.PORT && process.env.PORT !== '8080'
      ? Number(process.env.PORT)
      : Number(process.env.DEFAULT_APP_PORT) || 3000;
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
  const corsOrigins = CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((s) => s.trim());

  // CORS middleware for Express
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (CLIENT_ORIGIN === '*' || (origin && (Array.isArray(corsOrigins) ? corsOrigins.includes(origin) : corsOrigins === '*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // Socket.IO with CORS
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // Root status endpoint (only in standalone backend mode on Render)
  if (isStandalone) {
    app.get('/', (_req, res) => {
      res.json({
        name: 'ArenaBoard Real-Time Game Server',
        service: 'Backend & WebSocket Service for Render',
        status: 'online',
        version: 'v1.6.3',
        frontendOrigin: CLIENT_ORIGIN,
        timestamp: new Date().toISOString(),
      });
    });
  }

  app.get('/pong', (_req, res) => res.send('pong'));

  // Health check endpoints for Render and uptime monitoring
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'healthy',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      activeTables: tables.size,
      connectedUsers: connectedUsers.size,
    });
  });

  // Version endpoint
  app.get('/api/version', (_req, res) => {
    res.json({
      version: 'v1.6.3',
      buildId: 'bld-20260930154500-v160-swd',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      isStandalone: !!process.env.RENDER || process.env.STANDALONE_SERVER === 'true',
    });
  });

  // In-memory real-time state
  const connectedUsers = new Map<string, UserProfile>(); // socketId -> UserProfile
  const tables = new Map<string, TableRoom>(); // roomId -> TableRoom
  const botTimeouts = new Map<string, NodeJS.Timeout[]>(); // roomId -> pending timeouts

  function sanitizeTable(table: TableRoom) {
    if (table.ttrState?.routes && (table.ttrState.routes as any)['smyrna-erzurum']) {
      delete (table.ttrState.routes as any)['smyrna-erzurum'];
    }
  }

  function getPublicLobbies(): TableRoom[] {
    return Array.from(tables.values()).filter((t) => {
      sanitizeTable(t);
      return !t.isPrivate;
    });
  }

  function broadcastLobbyList() {
    io.emit('lobby:list', getPublicLobbies());
  }

  function clearBotTimers(roomId: string) {
    const timers = botTimeouts.get(roomId);
    if (timers) {
      timers.forEach((t) => clearTimeout(t));
      botTimeouts.delete(roomId);
    }
  }

  function startBotPlayer(room: TableRoom) {
    clearBotTimers(room.id);
    const botPlayer = room.players.find((p) => p.isBot);
    if (!botPlayer) return;

    const solveRes = solveGeniusSquare(room.blockers);
    if (!solveRes.solved || !solveRes.solution || solveRes.solution.length === 0) {
      return;
    }

    const solution = solveRes.solution;
    const timers: NodeJS.Timeout[] = [];

    let targetTotalSec = 45;
    if (room.botDifficulty === 'beginner') targetTotalSec = 75;
    else if (room.botDifficulty === 'intermediate') targetTotalSec = 42;
    else if (room.botDifficulty === 'expert') targetTotalSec = 24;
    else if (room.botDifficulty === 'genius') targetTotalSec = 14;

    const stepDelayMs = (targetTotalSec * 1000) / solution.length;
    const botPlaced: PlacedPiece[] = [];
    let botFilledCells = 0;

    solution.forEach((piece, index) => {
      const delay = (index + 1) * stepDelayMs + (Math.random() * 400 - 200);
      const timer = setTimeout(() => {
        const currentRoom = tables.get(room.id);
        if (!currentRoom || currentRoom.status !== 'in-game') return;

        botPlaced.push(piece);
        botFilledCells += piece.coords.length;
        const isComplete = botPlaced.length === 9 && botFilledCells === 29;

        botPlayer.boardProgress = {
          filledCells: botFilledCells,
          totalPieces: botPlaced.length,
          isComplete,
          timeElapsed: Math.round((Date.now() - (currentRoom.gameStartTime || Date.now())) / 1000),
          placedPieces: [...botPlaced],
        };

        io.to(room.id).emit('table:board_sync', {
          userId: botPlayer.userId,
          progress: botPlayer.boardProgress,
        });

        if (isComplete) {
          clearBotTimers(room.id);
          const timeSec = Math.round(
            (Date.now() - (currentRoom.gameStartTime || Date.now())) / 1000
          );
          currentRoom.status = 'finished';
          currentRoom.winner = {
            id: botPlayer.userId,
            name: botPlayer.username,
            avatar: botPlayer.avatar,
            timeSeconds: timeSec,
          };
          io.to(room.id).emit('table:game_over', {
            table: currentRoom,
            winner: currentRoom.winner,
          });
          broadcastLobbyList();
        }
      }, Math.max(800, delay));

      timers.push(timer);
    });

    botTimeouts.set(room.id, timers);
  }

  // Socket connection handlers
  io.on('connection', (socket: Socket) => {
    socket.on('user:register', (user: UserProfile) => {
      connectedUsers.set(socket.id, user);
      socket.emit('lobby:list', getPublicLobbies());
    });

    socket.on('lobby:get', () => {
      socket.emit('lobby:list', getPublicLobbies());
    });

    socket.on(
      'table:create',
      (data: {
        name: string;
        gameId: GameType;
        isPrivate: boolean;
        roomCode?: string;
        timeControl: TimeControl;
        withBot?: boolean;
        botDifficulty?: 'beginner' | 'intermediate' | 'expert' | 'genius';
        bots?: { name: string; avatar: string; difficulty: 'beginner' | 'intermediate' | 'expert' | 'genius' }[];
        hasHumanSlots?: boolean;
        maxPlayers?: number;
        targetVictoryPoints?: number;
      }) => {
        try {
          const user = connectedUsers.get(socket.id);
          if (!user) return;

          const roomId = 'table_' + Math.random().toString(36).substring(2, 9);
          const players: PlayerSlot[] = [
            {
              userId: user.id,
              socketId: socket.id,
              username: user.username,
              avatar: user.avatar,
              rating: user.rating,
              isReady: true,
              isHost: true,
            },
          ];

          if (data.bots && Array.isArray(data.bots) && data.bots.length > 0) {
            data.bots.forEach((botCfg: any, bIdx: number) => {
              const diff = botCfg.difficulty || 'intermediate';
              const botNames: Record<string, string> = {
                beginner: 'Pawn Bot',
                intermediate: 'Knight Bot',
                expert: 'Rook Bot',
                genius: 'Genius AI',
              };
              const botAvatars = ['🤖', '🧭', '⚔️', '🧠'];
              players.push({
                userId: `bot_${diff}_${bIdx + 1}_${Date.now()}`,
                socketId: 'bot',
                username: botCfg.name || `${botNames[diff] || 'AI Bot'} #${bIdx + 1}`,
                avatar: botCfg.avatar || botAvatars[bIdx % botAvatars.length],
                rating: diff === 'genius' ? 1850 : diff === 'expert' ? 1550 : diff === 'intermediate' ? 1300 : 1050,
                isReady: true,
                isHost: false,
                isBot: true,
              });
            });
          } else if (data.withBot) {
            const diff = data.botDifficulty || 'intermediate';
            const botNames: Record<string, string> = {
              beginner: 'Pawn Bot (AI)',
              intermediate: 'Knight Bot (AI)',
              expert: 'Rook Bot (AI)',
              genius: 'Genius AI (Grandmaster)',
            };
            players.push({
              userId: 'bot_' + diff,
              socketId: 'bot',
              username: botNames[diff] || 'BoardBot (AI)',
              avatar: '🤖',
              rating: diff === 'genius' ? 1850 : diff === 'expert' ? 1550 : diff === 'intermediate' ? 1300 : 1050,
              isReady: true,
              isHost: false,
              isBot: true,
            });
          }

          const maxPlayers = data.maxPlayers || (data.gameId === 'catan' ? 4 : data.gameId === 'ticket-to-ride' ? 5 : 2);
          const isAllBots = players.length >= 2 && !data.hasHumanSlots;
          const initialStatus = isAllBots ? 'in-game' : 'waiting';
          const targetVP = data.targetVictoryPoints || (data.gameId === 'catan' ? 10 : undefined);

          const newTable: TableRoom = {
            id: roomId,
            name: data.name || `${user.username}'s Arena`,
            gameId: data.gameId || 'genius-square',
            hostId: user.id,
            hostName: user.username,
            status: initialStatus,
            isPrivate: !!data.isPrivate,
            roomCode: data.roomCode,
            timeControl: data.timeControl || 'casual',
            botDifficulty: data.botDifficulty,
            players,
            maxPlayers,
            spectators: [],
            blockers: rollGeniusSquareDice(),
            targetVictoryPoints: targetVP,
            messages: [
              {
                id: 'msg_' + Date.now(),
                senderId: 'system',
                senderName: 'Arena System',
                senderAvatar: data.gameId === 'catan' ? '🏝️' : '🎲',
                text: initialStatus === 'in-game'
                  ? `Match started vs AI Bots! First to reach ${targetVP || 10} VP wins.`
                  : `Welcome to the table! ${
                      players.length > 1 ? 'Waiting for players to be ready.' : 'Invite a friend or open the lobby.'
                    }`,
                timestamp: Date.now(),
                isSystem: true,
              },
            ],
            createdAt: Date.now(),
          };

          if (data.gameId === 'catan' && isAllBots) {
            newTable.gameStartTime = Date.now();
            const playerConfigs = players.map((p) => ({
              id: p.userId,
              name: p.username,
              avatar: p.avatar,
              isBot: !!p.isBot,
            }));
            newTable.catanState = createInitialCatanGame(playerConfigs, targetVP || 10);
          } else if (data.gameId === 'ticket-to-ride' && isAllBots) {
            newTable.ttrState = createInitialTTRGame(newTable.players.map((p) => p.userId));
          } else if (data.gameId === 'seven-wonders-duel' && isAllBots) {
            newTable.gameStartTime = Date.now();
            const p1 = {
              id: players[0].userId,
              name: players[0].username,
              avatar: players[0].avatar,
              isBot: !!players[0].isBot,
            };
            const p2 = {
              id: players[1].userId,
              name: players[1].username,
              avatar: players[1].avatar,
              isBot: !!players[1].isBot,
            };
            newTable.sevenWondersState = createInitialSWDGame(p1, p2);
          }

          tables.set(roomId, newTable);
          socket.join(roomId);
          socket.emit('table:created', newTable);
          broadcastLobbyList();
        } catch (err) {
          console.error('Error creating table:', err);
        }
      }
    );

    socket.on(
      'table:join',
      (data: { tableId: string; roomCode?: string }, callback?: (res: any) => void) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);

        if (!table) {
          callback?.({ success: false, error: 'Table not found' });
          return;
        }

        if (table.isPrivate && table.roomCode && table.roomCode !== data.roomCode) {
          callback?.({ success: false, error: 'Incorrect room code' });
          return;
        }

        const existingPlayer = table.players.find((p) => p.userId === user?.id);
        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
          socket.join(table.id);
          callback?.({ success: true, table });
          io.to(table.id).emit('table:updated', table);
          return;
        }

        const maxAllowed = table.maxPlayers || (table.gameId === 'catan' ? 4 : table.gameId === 'ticket-to-ride' ? 5 : 2);
        if (table.players.length < maxAllowed && table.status === 'waiting') {
          const newPlayer: PlayerSlot = {
            userId: user?.id || 'guest_' + socket.id.substring(0, 5),
            socketId: socket.id,
            username: user?.username || 'Guest Player',
            avatar: user?.avatar || '🎲',
            rating: user?.rating || 1200,
            isReady: false,
            isHost: false,
          };
          table.players.push(newPlayer);
          table.messages.push({
            id: 'msg_' + Date.now(),
            senderId: 'system',
            senderName: 'Arena System',
            senderAvatar: '🎲',
            text: `${newPlayer.username} joined the table!`,
            timestamp: Date.now(),
            isSystem: true,
          });

          socket.join(table.id);
          callback?.({ success: true, table });
          io.to(table.id).emit('table:updated', table);
          broadcastLobbyList();
        } else {
          table.spectators.push({
            id: user?.id || socket.id,
            username: user?.username || 'Spectator',
          });
          socket.join(table.id);
          callback?.({ success: true, table, isSpectator: true });
          io.to(table.id).emit('table:updated', table);
        }
      }
    );

    socket.on('table:ready', (data: { tableId: string; isReady: boolean }) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;

      const player = table.players.find((p) => p.userId === user.id);
      if (player) {
        player.isReady = data.isReady;
        io.to(table.id).emit('table:updated', table);
      }
    });

    socket.on('table:start', (data: { tableId: string }) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;

      if (table.hostId !== user.id) return;
      if (table.players.length < 2) return;

      if (table.gameId === 'catan') {
        const playerConfigs = table.players.map((p) => ({
          id: p.userId,
          name: p.username,
          avatar: p.avatar,
          isBot: !!p.isBot,
        }));
        const vpTarget = table.targetVictoryPoints || 10;
        table.catanState = createInitialCatanGame(playerConfigs, vpTarget);
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '🏝️',
          text: `The Settlers of Catan has begun! Explore the hexes and build your colonies to ${vpTarget} VP.`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } else if (table.gameId === 'ticket-to-ride') {
        table.ttrState = createInitialTTRGame(table.players.map((p) => p.userId));
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '🚂',
          text: `Ticket to Ride has started! Claim your routes and build your train empire.`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } else if (table.gameId === 'seven-wonders-duel') {
        const p1 = {
          id: table.players[0].userId,
          name: table.players[0].username,
          avatar: table.players[0].avatar,
          isBot: !!table.players[0].isBot,
        };
        const p2 = {
          id: table.players[1].userId,
          name: table.players[1].username,
          avatar: table.players[1].avatar,
          isBot: !!table.players[1].isBot,
        };
        table.sevenWondersState = createInitialSWDGame(p1, p2);
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '🏛️',
          text: `7 Wonders - Duel has begun! Wonder selection phase is active.`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } else if (table.gameId === 'mr-jack') {
        table.mrJackState = createInitialMrJackGame();
        if (table.players.length >= 2) {
          table.players[0].role = 'detective';
          table.players[1].role = 'jack';
        }
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '🕵️‍♂️',
          text: `Mr. Jack in London has begun! ${table.players[0].username} is the Detective. ${table.players[1].username} is Mr. Jack!`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } else {
        table.blockers = rollGeniusSquareDice();
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '⚔️',
          text: `Game started! The 7 dice have been rolled: ${table.blockers.join(', ')}. Race to complete your square!`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }

      table.status = 'in-game';
      table.gameStartTime = Date.now();
      table.winner = null;

      table.players.forEach((p) => {
        p.boardProgress = {
          filledCells: 0,
          totalPieces: 0,
          isComplete: false,
          timeElapsed: 0,
          placedPieces: [],
        };
      });

      io.to(table.id).emit('table:game_started', table);
      broadcastLobbyList();

      if (table.gameId === 'genius-square' && table.players.some((p) => p.isBot)) {
        startBotPlayer(table);
      }
    });

    socket.on(
      'mrjack:move',
      (data: { tableId: string; gameState: MrJackGameState }) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user) return;
        if (table.status !== 'in-game' && table.status !== 'finished') return;

        if (table.status === 'finished' && !data.gameState.isGameOver) {
          table.status = 'in-game';
          table.winner = null;
          table.gameStartTime = Date.now();
          table.messages.push({
            id: 'msg_' + Date.now(),
            senderId: 'system',
            senderName: 'Arena System',
            senderAvatar: '🕵️‍♂️',
            text: `${user.username} initiated a rematch! A new case begins!`,
            timestamp: Date.now(),
            isSystem: true,
          });
          io.to(table.id).emit('table:updated', table);
          broadcastLobbyList();
        }

        table.mrJackState = data.gameState;

        io.to(table.id).emit('table:mrjack_sync', {
          gameState: data.gameState,
        });

        if (data.gameState.isGameOver && data.gameState.winner) {
          table.status = 'finished';
          const winningPlayer = table.players.find(
            (p) => p.role === data.gameState.winner
          );
          table.winner = {
            id: winningPlayer ? winningPlayer.userId : user.id,
            name: winningPlayer ? winningPlayer.username : user.username,
            avatar: winningPlayer ? winningPlayer.avatar : '🕵️‍♂️',
            timeSeconds: Math.round(
              (Date.now() - (table.gameStartTime || Date.now())) / 1000
            ),
            role: data.gameState.winner,
          };

          table.messages.push({
            id: 'msg_' + Date.now(),
            senderId: 'system',
            senderName: 'Arena System',
            senderAvatar: '🏆',
            text: `Match Ended! Winner: ${data.gameState.winner.toUpperCase()} (${table.winner.name})!`,
            timestamp: Date.now(),
            isSystem: true,
          });

          io.to(table.id).emit('table:game_over', {
            table,
            winner: table.winner,
          });
          broadcastLobbyList();
        }
      }
    );

    socket.on(
      'catan:action',
      (data: { tableId: string; gameState: CatanGameState }) => {
        try {
          if (!data || !data.tableId || !data.gameState) return;
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user) return;
          if (table.status !== 'in-game' && table.status !== 'finished') return;

          if (table.status === 'finished' && !data.gameState.winnerId) {
            table.status = 'in-game';
            table.winner = null;
            table.gameStartTime = Date.now();
            table.messages.push({
              id: 'msg_' + Date.now(),
              senderId: 'system',
              senderName: 'Arena System',
              senderAvatar: '🏝️',
              text: `${user.username} started a new match! The island of Catan awaits!`,
              timestamp: Date.now(),
              isSystem: true,
            });
            io.to(table.id).emit('table:updated', table);
            broadcastLobbyList();
          }

          table.catanState = data.gameState;

          io.to(table.id).emit('table:catan_sync', {
            gameState: data.gameState,
          });

          if (data.gameState.winnerId && table.status !== 'finished') {
            table.status = 'finished';
            const winningPlayer = table.players.find(
              (p) => p.userId === data.gameState.winnerId
            );
            const targetVP = table.targetVictoryPoints || data.gameState.targetVictoryPoints || 10;
            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : '🏝️',
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1000
              ),
              role: 'Lord of Catan',
            };

            table.messages.push({
              id: 'msg_' + Date.now(),
              senderId: 'system',
              senderName: 'Arena System',
              senderAvatar: '🏆',
              text: `Colony Dominated! ${table.winner.name} has triumphed on Catan with ${targetVP} Victory Points!`,
              timestamp: Date.now(),
              isSystem: true,
            });

            io.to(table.id).emit('table:game_over', {
              table,
              winner: table.winner,
            });
            broadcastLobbyList();
          }
        } catch (err) {
          console.error('Error handling catan:action:', err);
        }
      }
    );

    socket.on(
      'ticket-to-ride:action',
      (data: { tableId: string; action: TTRAction; forUserId?: string }) => {
        try {
          console.log('[TTR] Received raw event:', data);
          if (!data || !data.tableId || !data.action) {
            console.log('[TTR] Rejected: missing data fields');
            return;
          }
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user || !table.ttrState) {
            console.log('[TTR] Rejected: missing table, user, or ttrState', { hasTable: !!table, hasUser: !!user, hasTTRState: !!table?.ttrState });
            return;
          }
          const isInitialDraft = table.ttrState.turnState.state === 'initial_draft';
          if (table.status !== 'in-game' && !isInitialDraft) {
            console.log('[TTR] Rejected: table status is', table.status, 'and not initial draft');
            return;
          }

          // Host can submit on behalf of bots using forUserId
          const actingUserId = (data.forUserId && table.hostId === user.id)
            ? data.forUserId
            : user.id;

          console.log('[TTR] Processing action:', data.action.type, 'state:', table.ttrState.turnState.state, 'actingUser:', actingUserId, 'currentPlayer:', table.ttrState.playerOrder[table.ttrState.currentPlayerIndex]);
          // Apply action using the engine
          table.ttrState = processTTRAction(table.ttrState, actingUserId, data.action);
          sanitizeTable(table);

          io.to(table.id).emit('table:ttr_sync', {
            gameState: table.ttrState,
          });

          if (table.ttrState.winner && table.status !== 'finished') {
            table.status = 'finished';
            const winningPlayer = table.players.find(
              (p) => p.userId === table.ttrState!.winner
            );
            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : '🚂',
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1000
              ),
              role: 'Railway Baron',
            };

            table.messages.push({
              id: 'msg_' + Date.now(),
              senderId: 'system',
              senderName: 'Arena System',
              senderAvatar: '🏆',
              text: `Journey Complete! ${table.winner.name} has claimed victory across Europe!`,
              timestamp: Date.now(),
              isSystem: true,
            });

            io.to(table.id).emit('table:game_over', {
              table,
              winner: table.winner,
            });
            broadcastLobbyList();
          }
        } catch (err: any) {
          console.error('Error handling ticket-to-ride:action:', err);
          socket.emit('table:ttr_error', { message: err.message });
        }
      }
    );

    socket.on(
      'seven-wonders-duel:action',
      (data: { tableId: string; action: SWDAction; forUserId?: string }) => {
        try {
          if (!data || !data.tableId || !data.action) return;
          const user = connectedUsers.get(socket.id);
          const table = tables.get(data.tableId);
          if (!table || !user || !table.sevenWondersState) return;

          const actingUserId =
            data.forUserId && table.hostId === user.id ? data.forUserId : user.id;

          table.sevenWondersState = processSWDAction(
            table.sevenWondersState,
            actingUserId,
            data.action
          );

          io.to(table.id).emit('table:swd_sync', {
            gameState: table.sevenWondersState,
          });

          if (table.sevenWondersState.winner && table.status !== 'finished') {
            table.status = 'finished';
            const winnerInfo = table.sevenWondersState.winner;
            const winningPlayer = table.players.find((p) => p.userId === winnerInfo.userId);
            const reason = winnerInfo.reason;
            const reasonDesc =
              reason === 'military'
                ? 'Military Supremacy'
                : reason === 'science'
                ? 'Scientific Supremacy'
                : 'Civilian Victory';

            table.winner = {
              id: winningPlayer ? winningPlayer.userId : user.id,
              name: winningPlayer ? winningPlayer.username : user.username,
              avatar: winningPlayer ? winningPlayer.avatar : '🏛️',
              timeSeconds: Math.round(
                (Date.now() - (table.gameStartTime || Date.now())) / 1000
              ),
              role: `Master Builder (${reasonDesc})`,
            };

            table.messages.push({
              id: 'msg_' + Date.now(),
              senderId: 'system',
              senderName: 'Arena System',
              senderAvatar: '🏆',
              text: `Empire Ascendant! ${table.winner.name} triumphed in 7 Wonders Duel via ${reasonDesc}!`,
              timestamp: Date.now(),
              isSystem: true,
            });

            io.to(table.id).emit('table:game_over', {
              table,
              winner: table.winner,
            });
            broadcastLobbyList();
          }
        } catch (err: any) {
          console.error('Error handling seven-wonders-duel:action:', err);
        }
      }
    );

    socket.on(
      'table:chat',
      (data: { tableId: string; text: string }) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || !data.text?.trim()) return;

        const newMsg: ChatMessage = {
          id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
          senderId: user.id,
          senderName: user.username,
          senderAvatar: user.avatar,
          text: data.text.trim().substring(0, 200),
          timestamp: Date.now(),
        };

        table.messages.push(newMsg);
        if (table.messages.length > 50) table.messages.shift();

        io.to(table.id).emit('table:chat_message', newMsg);
      }
    );

    socket.on(
      'game:move',
      (data: {
        tableId: string;
        placedPieces: PlacedPiece[];
        filledCells: number;
        isComplete: boolean;
        timeElapsed: number;
      }) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || table.status !== 'in-game') return;

        const player = table.players.find((p) => p.userId === user.id);
        if (!player) return;

        player.boardProgress = {
          filledCells: data.filledCells,
          totalPieces: data.placedPieces.length,
          isComplete: data.isComplete,
          timeElapsed: data.timeElapsed,
          placedPieces: data.placedPieces,
        };

        socket.to(table.id).emit('table:board_sync', {
          userId: user.id,
          progress: player.boardProgress,
        });

        if (data.isComplete && data.placedPieces.length === 9 && data.filledCells === 29) {
          clearBotTimers(table.id);
          table.status = 'finished';
          table.winner = {
            id: user.id,
            name: user.username,
            avatar: user.avatar,
            timeSeconds: data.timeElapsed,
          };

          table.messages.push({
            id: 'msg_' + Date.now(),
            senderId: 'system',
            senderName: 'Arena System',
            senderAvatar: '🏆',
            text: `🎉 VICTORY! ${user.username} completed their Genius Square in ${data.timeElapsed}s!`,
            timestamp: Date.now(),
            isSystem: true,
          });

          io.to(table.id).emit('table:game_over', {
            table,
            winner: table.winner,
          });

          broadcastLobbyList();
        }
      }
    );

    socket.on('table:rematch', (data: { tableId: string }) => {
      try {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data?.tableId);
        if (!table || !user) return;

        clearBotTimers(table.id);
        table.status = 'waiting';
        table.winner = null;

        if (table.gameId === 'catan') {
          const vpTarget = table.targetVictoryPoints || 10;
          const playerConfigs = table.players.map((p) => ({
            id: p.userId,
            name: p.username,
            avatar: p.avatar,
            isBot: !!p.isBot,
          }));
          table.catanState = createInitialCatanGame(playerConfigs, vpTarget);
        } else if (table.gameId === 'ticket-to-ride') {
          table.ttrState = createInitialTTRGame(table.players.map((p) => p.userId));
        } else if (table.gameId === 'mr-jack') {
          table.mrJackState = createInitialMrJackGame();
        } else {
          table.blockers = rollGeniusSquareDice();
        }

        table.players.forEach((p) => {
          p.isReady = true;
          p.boardProgress = undefined;
        });

        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '⚔️',
          text: `${user.username} initiated a rematch! Ready for another round!`,
          timestamp: Date.now(),
          isSystem: true,
        });

        io.to(table.id).emit('table:updated', table);
        broadcastLobbyList();
      } catch (err) {
        console.error('Error in table:rematch:', err);
      }
    });

    socket.on('table:remove_player', (data: { tableId: string; userId: string }) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user || table.hostId !== user.id) return;

      const removedPlayer = table.players.find((p) => p.userId === data.userId);
      table.players = table.players.filter((p) => p.userId !== data.userId);

      if (removedPlayer && !removedPlayer.isBot && removedPlayer.socketId && removedPlayer.socketId !== 'bot') {
        io.to(removedPlayer.socketId).emit('table:kicked', { tableId: table.id });
      }

      table.messages.push({
        id: 'msg_' + Date.now(),
        senderId: 'system',
        senderName: 'Arena System',
        senderAvatar: '🛡️',
        text: `${removedPlayer ? removedPlayer.username : 'A player/bot'} was removed from the table.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      io.to(table.id).emit('table:updated', table);
      broadcastLobbyList();
    });

    socket.on(
      'table:add_bot',
      (data: {
        tableId: string;
        difficulty?: 'beginner' | 'intermediate' | 'expert' | 'genius';
        name?: string;
        avatar?: string;
      }) => {
        const user = connectedUsers.get(socket.id);
        const table = tables.get(data.tableId);
        if (!table || !user || table.hostId !== user.id) return;
        const maxPlayers = table.maxPlayers || (table.gameId === 'catan' ? 4 : table.gameId === 'ticket-to-ride' ? 5 : 2);
        if (table.players.length >= maxPlayers) return;

        const diff = data.difficulty || 'intermediate';
        const botNames: Record<string, string> = {
          beginner: 'Pawn Bot (AI)',
          intermediate: 'Knight Bot (AI)',
          expert: 'Merchant Bot (AI)',
          genius: 'Explorer Bot (AI)',
        };
        const botAvatars = ['🤖', '🧭', '⚔️', '🧠'];
        const botIdx = table.players.filter((p) => p.isBot).length;

        const newBot: PlayerSlot = {
          userId: `bot_${diff}_${Date.now()}_${table.players.length + 1}`,
          socketId: 'bot',
          username: data.name || botNames[diff] || 'AI Bot',
          avatar: data.avatar || botAvatars[botIdx % botAvatars.length],
          rating: diff === 'genius' ? 1850 : diff === 'expert' ? 1550 : diff === 'intermediate' ? 1300 : 1050,
          isReady: true,
          isHost: false,
          isBot: true,
        };

        table.players.push(newBot);
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '🤖',
          text: `${newBot.username} was added to the table.`,
          timestamp: Date.now(),
          isSystem: true,
        });

        io.to(table.id).emit('table:updated', table);
        broadcastLobbyList();
      }
    );

    socket.on('table:leave', (data: { tableId: string }) => {
      const user = connectedUsers.get(socket.id);
      const table = tables.get(data.tableId);
      if (!table || !user) return;

      table.players = table.players.filter((p) => p.userId !== user.id);
      socket.leave(table.id);

      if (table.players.length === 0 || (table.players.length === 1 && table.players[0].isBot)) {
        clearBotTimers(table.id);
        tables.delete(table.id);
      } else {
        if (table.hostId === user.id && table.players.length > 0) {
          table.hostId = table.players[0].userId;
          table.hostName = table.players[0].username;
          table.players[0].isHost = true;
        }
        table.messages.push({
          id: 'msg_' + Date.now(),
          senderId: 'system',
          senderName: 'Arena System',
          senderAvatar: '👋',
          text: `${user.username} left the table.`,
          timestamp: Date.now(),
          isSystem: true,
        });
        io.to(table.id).emit('table:updated', table);
      }

      broadcastLobbyList();
    });

    socket.on('disconnect', () => {
      try {
        const user = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);

        tables.forEach((table, tableId) => {
          const idx = table.players.findIndex((p) => p.socketId === socket.id);
          if (idx !== -1) {
            const leavingPlayer = table.players[idx];
            table.players.splice(idx, 1);

            const remainingHumans = table.players.filter((p) => !p.isBot);

            if (table.players.length === 0 || remainingHumans.length === 0) {
              clearBotTimers(tableId);
              tables.delete(tableId);
            } else {
              if (table.hostId === leavingPlayer.userId && table.players.length > 0) {
                const newHost = remainingHumans[0] || table.players[0];
                table.hostId = newHost.userId;
                table.hostName = newHost.username;
                newHost.isHost = true;
              }
              if (table.status === 'in-game') {
                if (table.gameId !== 'catan' && table.players.length === 1) {
                  clearBotTimers(tableId);
                  table.status = 'finished';
                  const remaining = table.players[0];
                  table.winner = {
                    id: remaining.userId,
                    name: remaining.username,
                    avatar: remaining.avatar,
                    timeSeconds: 0,
                  };
                  io.to(tableId).emit('table:game_over', {
                    table,
                    winner: table.winner,
                    forfeit: true,
                  });
                } else {
                  table.messages.push({
                    id: 'msg_' + Date.now(),
                    senderId: 'system',
                    senderName: 'Arena System',
                    senderAvatar: 'ℹ️',
                    text: `${leavingPlayer.username} disconnected. Match continues with remaining players.`,
                    timestamp: Date.now(),
                    isSystem: true,
                  });
                  io.to(tableId).emit('table:updated', table);
                }
              } else {
                io.to(tableId).emit('table:updated', table);
              }
            }
          }
        });

        broadcastLobbyList();
      } catch (err) {
        console.error('Error during disconnect cleanup:', err);
      }
    });
  });

  return { app, server, io, PORT };
}

// Standalone start helper for Render or node execution
export async function startStandaloneServer(port?: number) {
  const { server, PORT } = createArenaServer({ isStandalone: true });
  const listenPort = port || PORT;
  server.listen(listenPort, '0.0.0.0', () => {
    console.log(`[ArenaBoard Backend] Running standalone at http://0.0.0.0:${listenPort}`);
  });
  return server;
}
