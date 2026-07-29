# --- Backend: Express + Socket.IO API/WebSocket server ---
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
