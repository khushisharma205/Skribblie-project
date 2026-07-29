# skribbl.io Clone

A real-time multiplayer drawing & guessing game (Pictionary-style), built with the MERN stack
and Socket.IO. Create or join a room, take turns drawing a chosen word while everyone else
guesses in chat, earn points for correct guesses, and see who wins at the end.

**Live URL:** _add your deployed Render URL here after deploying, e.g. `https://skribbl-frontend.onrender.com` (backend: `https://skribbl-backend.onrender.com`)_

## Features

- Public/private rooms with host-configurable settings (max players, rounds, draw time, word
  count, hints)
- Turn-based drawing: every player gets a turn to draw once per round
- Real-time canvas sync (brush color/size, eraser, undo, clear) via Socket.IO
- Word selection (1-5 choices) for the drawer; masked word + progressive letter hints for guessers
- Guess-to-chat with correct-guess scoring, live leaderboard, and a game-over winner screen
- Optional guest-friendly accounts (JWT) that persist win/loss stats across sessions
- OOP backend: `Player`, `Room`, `Game`, `RoomManager` classes encapsulate all game logic

## Tech stack

| Layer      | Technology                              |
| ---------- | ---------------------------------------- |
| Frontend   | React (JS, no TypeScript) + Vite         |
| Canvas     | HTML5 Canvas API (custom drawing logic)  |
| Backend    | Node.js + Express 5                      |
| Realtime   | Socket.IO                                |
| Database   | MongoDB Atlas + Mongoose (optional)      |
| Auth       | JWT + bcrypt (optional, guest play works without it) |

## Project structure

```
mern/
  backend/
    server.js              Express + Socket.IO entry point
    src/
      classes/             Player, Room, Game, RoomManager (OOP game engine)
      config/db.js         Mongoose connection
      controllers/         Auth REST controller
      middleware/          JWT auth middleware
      models/              User, Room, Word, GameResult (Mongoose schemas)
      routes/               Auth REST routes
      sockets/index.js      All Socket.IO event handlers (MessageHandler)
      utils/                wordBank, wordMatch, scoring, jwt helpers
      data/words.json       Local word list fallback / seed source
      seed.js                One-off script to seed words into MongoDB
    Dockerfile              Backend container image (Node + Express + Socket.IO)
  frontend/
    src/
      pages/               Home, Lobby, GameRoom
      components/          DrawingCanvas, Toolbar, WordChoiceModal, Chat, ScoreBoard, GameOverScreen
      context/             AuthContext, GameContext (socket + game state)
      services/            api.js (axios), socket.js (socket.io-client singleton)
    Dockerfile              Frontend container image (multi-stage: Vite build -> nginx)
    nginx/default.conf.template   nginx config (SPA fallback, listens on $PORT)
  docker-compose.yml       Run both containers together for local testing
  render.yaml              Render Blueprint - deploys backend + frontend as two Docker services
```

## Local setup

Prerequisites: Node.js 18+, npm. MongoDB is optional locally (the app runs with an in-memory
word list and no persistence if `MONGODB_URI` is unset).

```bash
# from the repo root
npm run install:all

# copy env templates and fill in values
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Run backend and frontend in two terminals:

```bash
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

Open `http://localhost:5173`, create a room in one tab, and join it from another tab (or an
incognito window) with the room code to test multiplayer locally.

To seed the word list into MongoDB (optional, only needed if you want DB-backed words):

```bash
npm run seed
```

## Environment variables

**backend/.env**
| Variable       | Description                                                             |
| -------------- | ------------------------------------------------------------------------ |
| `PORT`         | Port the Express server listens on (default 5000)                       |
| `MONGODB_URI`  | MongoDB Atlas connection string. Leave empty to run without persistence |
| `JWT_SECRET`   | Secret used to sign auth tokens                                          |
| `CLIENT_URL`   | Origin allowed for CORS/Socket.IO (the frontend's URL)                  |

**frontend/.env**
| Variable            | Description                                  |
| ------------------- | --------------------------------------------- |
| `VITE_API_URL`      | Base URL for REST auth calls (`/api`)         |
| `VITE_SOCKET_URL`   | Base URL the Socket.IO client connects to     |

## Running with Docker locally

Both apps are dockerized **separately** (one image for the API/WebSocket backend, one image
for the static frontend behind nginx), matching how they deploy to Render as two independent
services.

```bash
docker compose up --build
```

- Backend: `http://localhost:5000` (container listens on `PORT=5000`)
- Frontend: `http://localhost:8080` (nginx container, listens on `PORT=80` by default)

The frontend image bakes `VITE_API_URL`/`VITE_SOCKET_URL` in at **build time** (Vite inlines
`import.meta.env.VITE_*` into the bundle), so `docker-compose.yml` passes them as build args
pointing at `http://localhost:5000`. If you change the backend port/URL, rebuild the frontend
image (`docker compose up --build frontend`) — changing the env var alone at container
*runtime* has no effect since the value is already compiled into the JS bundle.

You can also build/run each image individually:

```bash
docker build -t skribbl-backend ./backend
docker run -p 5000:5000 -e CLIENT_URL=http://localhost:8080 skribbl-backend

docker build -t skribbl-frontend ./frontend \
  --build-arg VITE_API_URL=http://localhost:5000/api \
  --build-arg VITE_SOCKET_URL=http://localhost:5000
docker run -p 8080:80 skribbl-frontend
```

## Deployment (Render, two Docker services)

The backend and frontend deploy as **two separate Render Web Services**, each built from its
own Dockerfile. This means they get two different `onrender.com` URLs, so the backend needs
CORS/Socket.IO configured for the frontend's origin (`CLIENT_URL`), and the frontend needs to
know the backend's URL at build time (`VITE_API_URL` / `VITE_SOCKET_URL`).

The included [render.yaml](render.yaml) Blueprint defines both services; or configure them by
hand:

### 1. Backend service

- New **Web Service** → **Docker** runtime, pointed at this repo
- **Dockerfile path:** `backend/Dockerfile` · **Docker build context:** `backend`
- Environment variables:
  - `MONGODB_URI` — connection string from a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (optional but recommended for persistence)
  - `JWT_SECRET` — any long random string
  - `CLIENT_URL` — the frontend service's URL (set this after step 2, then redeploy)
- Deploy and note its URL, e.g. `https://skribbl-backend.onrender.com`

### 2. Frontend service

- New **Web Service** → **Docker** runtime, pointed at this repo
- **Dockerfile path:** `frontend/Dockerfile` · **Docker build context:** `frontend`
- Environment variables (these become Docker build args and are baked into the JS bundle,
  so the frontend must be **rebuilt** if either one changes):
  - `VITE_API_URL` = `https://skribbl-backend.onrender.com/api`
  - `VITE_SOCKET_URL` = `https://skribbl-backend.onrender.com`
- Deploy and note its URL, e.g. `https://skribbl-frontend.onrender.com`

### 3. Close the loop

- Go back to the backend service and set `CLIENT_URL` to the frontend's URL from step 2, then
  trigger a redeploy so CORS/Socket.IO accept requests from it.
- Open the frontend's URL, create a room, and share the invite link to test the full flow
  (create → join → draw → guess → score → game over) in production.

> MongoDB Atlas account creation and the Render service/account setup are manual steps that
> must be done by you — an agent cannot create third-party accounts on your behalf.

## Architecture overview

**Drawing sync:** The drawer's canvas emits `draw_start` / `draw_move` / `draw_end` over
Socket.IO using coordinates normalized to `0-1` (fractions of canvas width/height) so strokes
render correctly regardless of each client's canvas pixel size. The server validates the sender
is the current drawer, then rebroadcasts every stroke as `draw_data` to **all** clients in the
room, including the drawer — so every client (drawer included) renders strokes from the same
authoritative event stream, keeping everyone visually in sync. `canvas_clear` and `draw_undo`
are relayed the same way; each client keeps a local list of completed strokes (rebuilt purely
from the `draw_data` stream) so `draw_undo` can pop the last stroke and redraw everything else.

**Game state / turn order:** Each room owns a `Game` instance (see
[backend/src/classes/Game.js](backend/src/classes/Game.js)) that tracks the draw order, current
round/drawer, current word, revealed-hint mask, and per-round timers. `nextTurn()` cycles through
every connected player once per round before incrementing the round counter, and calls
`endGame()` once all rounds are complete. Game state changes are pushed to clients via a
personalized `game_state` event — the current drawer receives the real word, everyone else
receives the masked version, so the answer is never leaked to guessers over the wire.

**WebSockets:** All real-time features (room/lobby membership, drawing, chat, guesses, scoring,
round/game transitions) flow through a single Socket.IO connection per client, registered in
[backend/src/sockets/index.js](backend/src/sockets/index.js) (the `MessageHandler`), which
delegates to the `RoomManager` → `Room` → `Game` class chain rather than embedding logic in the
socket handlers themselves.

**Word-matching logic:** See
[backend/src/utils/wordMatch.js](backend/src/utils/wordMatch.js). Guesses and the target word are
both trimmed, lowercased, and whitespace-collapsed before comparison. An exact match scores
points. A near-miss (Levenshtein edit distance ≤ 1-2, scaled to word length) sends a private
"so close!" hint back to only that guesser without scoring or revealing the word to others.
Anything else is broadcast as a normal chat message, exactly like real guesses in skribbl.io.

**Scoring:** See [backend/src/utils/scoring.js](backend/src/utils/scoring.js). Correct guessers
earn a base score plus a time-remaining bonus, minus a small penalty per guess order (first
correct guesser earns the most). The drawer earns points proportional to the fraction of
eligible players who guessed correctly that round.

## Known limitations

- Live game/round state lives in server memory (see the OOP classes) for real-time performance;
  it is **not** persisted, so an in-progress game is lost if the server restarts. MongoDB is
  used for durable data only: the word list, room metadata, finished game results, and optional
  user accounts/stats.
- No reconnect-to-same-session support: a page refresh mid-game currently returns you to Home.
- Auth is optional and additive — guest play (name only) is the primary flow, matching the real
  skribbl.io experience; logging in only adds persisted win/loss stats.
- Frontend and backend are separate Docker services with different origins in production, so
  the frontend's `VITE_API_URL`/`VITE_SOCKET_URL` are compiled into the JS bundle at Docker
  **build** time — updating them later requires rebuilding/redeploying the frontend image, not
  just editing an env var.
#   S k r i b b l i e - p r o j e c t  
 