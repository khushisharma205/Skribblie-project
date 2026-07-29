# --- Stage 1: build the Vite/React app ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./
RUN npm ci

COPY . .

# Vite inlines VITE_* vars at build time, so they must be passed as build args
# (Render: set these as env vars on the service; Docker build args pick them up).
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# --- Stage 2: serve the built static files with nginx ---
FROM nginx:1.27-alpine

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Render (and most PaaS Docker runtimes) assign the listen port via $PORT at runtime;
# default to 80 for plain `docker run` / local testing.
ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
