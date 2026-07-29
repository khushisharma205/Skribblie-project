const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { connectDB } = require('./src/config/db');
const { initWordBank } = require('./src/utils/wordBank');
const authRoutes = require('./src/routes/auth.routes');
const { registerSocketHandlers } = require('./src/sockets');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Only serve the built frontend if it's present alongside this server (single-service
// deployments). When the frontend is deployed as its own Docker service, this folder
// won't exist and the backend simply runs as an API/WebSocket-only service.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

registerSocketHandlers(io);

async function start() {
  await connectDB();
  await initWordBank();
   server.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });
}

start();
