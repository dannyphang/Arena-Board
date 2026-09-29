# Deployment Guide: Vercel (Frontend) & Render (Backend + Socket.IO)

This project has been modularized so you can easily deploy:
- **Frontend**: On **Vercel** (Static React Vite SPA with single-page app routing)
- **Backend & WebSockets**: On **Render** (Node.js Express + Socket.IO Web Service)
- **Development & AI Studio**: Continues running full-stack seamlessly on port 3000

---

## Architecture Overview

```
┌─────────────────────────────────┐           WebSocket (Socket.IO) & API Requests
│      Vercel (Frontend)          │  ◄──────────────────────────────────────────────────────►  ┌──────────────────────────────────┐
│  - React 19 + Vite SPA          │                                                            │      Render (Backend)            │
│  - Hosted from /src, /public    │       VITE_BACKEND_URL=https://<app>.onrender.com          │  - Express.js + Socket.IO 4      │
│  - Build: npm run build:frontend│                                                            │  - Hosted from /server           │
│  - Output: dist/                │                                                            │  - Build: npm run build:server   │
│  - Config: vercel.json          │                                                            │  - Start: npm run start:server   │
└─────────────────────────────────┘                                                            │  - Health Check: /health         │
                                                                                               └──────────────────────────────────┘
```

---

## Step 1: Deploy Backend to Render (First)

Because the frontend needs to know your backend's URL, deploy the backend first.

### Option A: Using the Render Web Dashboard (Recommended)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your Git repository.
4. Fill in the service configuration:
   - **Name**: `arenaboard-backend` (or any name you prefer)
   - **Region**: Choose the region closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: Leave blank (repo root) or set to `.`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build:server
     ```
   - **Start Command**:
     ```bash
     npm run start:server
     ```
   - **Instance Type**: `Free` (or Starter for 24/7 persistent connections)
5. Under **Advanced** → **Health Check Path**:
   - Set to `/health`
6. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `CLIENT_ORIGIN` | `*` | Or set to your Vercel URL once created (e.g., `https://your-app.vercel.app`) |
   | `STANDALONE_SERVER` | `true` | Runs server without Vite frontend middleware |
7. Click **Create Web Service**.
8. Once deployed, copy your Render service URL (e.g., `https://arenaboard-backend.onrender.com`).
   - You can test it by opening `https://arenaboard-backend.onrender.com/health` in your browser. It should return `{"status":"healthy",...}`.

### Option B: Using `render.yaml` (Blueprint)
The repository includes `render.yaml`. In Render:
1. Go to **Blueprints** → **New Blueprint Instance**.
2. Select your repository. Render will automatically configure the service using `render.yaml`.

---

## Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your Git repository.
4. In the Project Configuration:
   - **Framework Preset**: `Vite` (Vercel will detect `vercel.json`)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build:frontend` (or default `npm run build`)
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `VITE_BACKEND_URL` | `https://arenaboard-backend.onrender.com` | Your Render backend URL from Step 1 |
6. Click **Deploy**.
7. Vercel will build the frontend and provide you with a production URL (e.g., `https://arenaboard.vercel.app`).

---

## Step 3: Connect Frontend and Backend (CORS Lock Down)

Once your Vercel URL is live:
1. Go back to your Render Dashboard → `arenaboard-backend` → **Environment**.
2. Update `CLIENT_ORIGIN` to your Vercel URL:
   ```env
   CLIENT_ORIGIN=https://arenaboard.vercel.app
   ```
   *(You can also provide a comma-separated list if you have custom domains or preview URLs).*
3. Render will automatically redeploy with the updated CORS policy.

---

## File Structure Reference

```
.
├── DEPLOYMENT.md             # This guide
├── render.yaml               # Render Infrastructure Blueprint
├── vercel.json               # Vercel SPA routing & security headers
├── .env.example              # Environment variables template
├── package.json              # Main project package with separated build/start scripts
│
├── server/                   # BACKEND (For Render)
│   ├── src/
│   │   └── index.ts          # Express + Socket.IO real-time server with CORS
│   ├── package.json          # Standalone backend package definition
│   ├── tsconfig.json         # Backend TypeScript config
│   └── .env.example          # Backend env variables
│
├── src/                      # FRONTEND (For Vercel)
│   ├── components/           # React game UI, tables, modals
│   ├── games/                # Client board visualizers & engines
│   ├── services/
│   │   └── socket.ts         # Socket.io client with dynamic VITE_BACKEND_URL
│   ├── config/               # App configuration & version inspector
│   └── types/                # TypeScript interfaces
│
└── server.ts                 # Unified Entry Point (For AI Studio / Local Dev)
```

---

## Available NPM Scripts

- **`npm run dev`**: Starts unified full-stack dev server on port 3000 (standard in AI Studio).
- **`npm run build:frontend`**: Builds Vite frontend bundle into `dist/` (used by Vercel).
- **`npm run build:server`**: Bundles backend into `dist-server/index.js` (used by Render).
- **`npm run start:server`**: Launches standalone backend server on Render.
- **`npm run dev:frontend`**: Runs only Vite dev server (for frontend-only work).
- **`npm run dev:server`**: Runs only standalone backend on port 3000.
