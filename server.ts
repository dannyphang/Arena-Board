import { createArenaServer } from './server/src/index';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';

const { app, server, PORT } = createArenaServer();

async function startServer() {
  // If running on Render or standalone backend mode, skip frontend mounting
  if (process.env.RENDER === 'true' || process.env.STANDALONE_SERVER === 'true') {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[ArenaBoard Backend] Running standalone on Render at http://0.0.0.0:${PORT}`);
    });
    return;
  }

  // Unified Full-Stack mode (for AI Studio development & previews)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ArenaBoard server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
