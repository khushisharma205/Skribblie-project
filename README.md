# 🎨 Skribblie Project – Real-Time Multiplayer Drawing Game

A real-time **Pictionary-style multiplayer game** inspired by **skribbl.io** where players take turns drawing while others guess the word. Earn points, climb the leaderboard, and compete with friends in public or private rooms.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🎮 Frontend | https://skribblie-project-1.onrender.com |
| ⚙️ Backend API/WebSocket | https://skribblie-project.onrender.com |
| 📂 GitHub Repository | https://github.com/khushisharma205/Skribblie-project |

---

# 📸 Preview

> Create a room, invite friends, draw the selected word, and guess before time runs out!

---

# ✨ Features

## 🎮 Multiplayer Gameplay

- Public & Private rooms
- Join using room code
- Configurable number of rounds
- Adjustable drawing timer
- Configurable number of words
- Automatic turn rotation
- Real-time player synchronization

---

## ✏️ Drawing Board

- HTML5 Canvas
- Real-time drawing synchronization
- Multiple colors
- Adjustable brush size
- Eraser
- Undo
- Clear canvas
- Smooth drawing experience

---

## 💬 Guessing & Chat

- Live chat
- Guess directly in chat
- Automatic answer detection
- Near-match hint ("So Close!")
- Hidden word for guessers
- Drawer cannot guess

---

## 💡 Hint System

- Progressive hints
- Letters revealed over time
- Configurable hint timing
- Word remains hidden for drawer only

---

## 🏆 Scoring System

Players earn points based on:

- Correct guesses
- Remaining time
- Guess order
- Drawer bonus
- Guesser ratio

Includes:

- Live leaderboard
- Round rankings
- Final winner screen

---

## 👤 Authentication (Optional)

Supports:

- Guest users
- JWT Authentication
- bcrypt password hashing
- Win/Loss statistics

Guests can play immediately without creating an account.

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React.js + Vite |
| Language | JavaScript |
| Drawing | HTML5 Canvas API |
| Backend | Node.js |
| Framework | Express.js 5 |
| Realtime | Socket.IO |
| Database | MongoDB Atlas (Optional) |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcrypt |
| Deployment | Render |
| Containerization | Docker |

---

# 📁 Project Structure

```text
Skribblie-project/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── game/
│   │   ├── Game.js
│   │   ├── Room.js
│   │   └── Player.js
│   ├── Dockerfile
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   ├── Dockerfile
│   └── ...
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

# 🚀 Local Development

## Prerequisites

- Node.js 18+
- npm
- MongoDB (Optional)

---

## Clone Repository

```bash
git clone https://github.com/khushisharma205/Skribblie-project.git

cd Skribblie-project
```

---

## Install Dependencies

```bash
npm run install:all
```

---

## Configure Environment Variables

Copy the environment templates.

```bash
cp backend/.env.example backend/.env

cp frontend/.env.example frontend/.env
```

### Backend (.env)

```env
PORT=5000

JWT_SECRET=your_secret

CLIENT_URL=http://localhost:5173

MONGODB_URI=
```

> Leave `MONGODB_URI` empty to use the in-memory word list.

---

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api

VITE_SOCKET_URL=http://localhost:5000
```

---

## Run Backend

```bash
npm run dev:backend
```

Runs on:

```
http://localhost:5000
```

---

## Run Frontend

```bash
npm run dev:frontend
```

Runs on:

```
http://localhost:5173
```

Open:

```
http://localhost:5173
```

Create a room and open another browser tab to test multiplayer.

---

## Optional Database Seed

```bash
npm run seed
```

---

# 🐳 Docker Setup

Build and run:

```bash
docker compose up --build
```

Services:

| Service | URL |
|---------|-----|
| Backend | http://localhost:5000 |
| Frontend | http://localhost:8080 |

> **Note:** Frontend environment variables are baked during the Docker build. Rebuild the frontend whenever the backend URL changes.

---

# ☁️ Deployment (Render)

Deploy as two Docker services.

---

## Backend Service

Dockerfile:

```
backend/Dockerfile
```

Environment Variables:

```
MONGODB_URI

JWT_SECRET

CLIENT_URL
```

---

## Frontend Service

Dockerfile:

```
frontend/Dockerfile
```

Build Arguments:

```
VITE_API_URL=https://your-backend/api

VITE_SOCKET_URL=https://your-backend
```

---

## Final Step

After deployment:

1. Copy the frontend URL.
2. Set it as `CLIENT_URL` in the backend.
3. Redeploy the backend.

You're ready to play!

---

# ⚙️ Game Architecture

## Drawing Synchronization

- Normalized coordinates (0–1)
- Consistent rendering across screen sizes
- Real-time Socket.IO broadcasting
- Smooth stroke synchronization

---

## Game Engine

Object-Oriented architecture.

Core classes:

- Player
- Room
- Game

Responsibilities include:

- Turn management
- Round progression
- Timers
- Word selection
- Player synchronization
- Personalized game state

Guessers never receive the secret word.

---

## Word Matching

Supports:

- Case-insensitive matching
- Trimmed comparison
- Exact match scoring
- Near-match detection
- Private "So Close!" feedback

---

## Scoring Logic

Guessers receive:

- Base points
- Time bonus
- Early guess bonus

Drawer receives:

- Points based on number of successful guessers

---

# 📌 Known Limitations

- Game state exists only in memory
- Restarting the server resets active games
- No reconnect/session recovery
- Refreshing the page returns users to Home
- MongoDB stores only persistent user data
- Frontend environment variables require rebuilding after changes

---

# 🔮 Future Improvements

- Voice chat
- Friends system
- Player avatars
- Spectator mode
- Mobile responsive canvas improvements
- Custom word packs
- AI-generated word suggestions
- Drawing replay
- Match history
- Achievements & badges
- Global leaderboard
- Emoji reactions
- Reconnect support
- Persistent game state using Redis

---

# 🤝 Contributing

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is available for educational and personal use.

---

# ❤️ Acknowledgements

Inspired by the popular multiplayer drawing game **skribbl.io** and built using modern web technologies including React, Socket.IO, Express, and Docker.

---

## ⭐ Support

If you enjoyed this project, consider giving it a ⭐ on GitHub!