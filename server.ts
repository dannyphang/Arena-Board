import { createArenaServer } from './server/src/index';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import fs from 'fs';

const { app, server, PORT } = createArenaServer({ isStandalone: false });

async function startServer() {
  // Unified Full-Stack mode (for AI Studio development & previews)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/health') || url.startsWith('/socket.io')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health') || req.originalUrl.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ArenaBoard server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
