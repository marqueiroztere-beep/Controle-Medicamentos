FROM node:22-slim
WORKDIR /app

COPY package.json start.js ./
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

COPY backend/src/ ./backend/src/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

ENV NODE_OPTIONS="--experimental-sqlite"
ENV TZ="America/Sao_Paulo"

# Marker file: exists in the container image but disappears when the volume mounts over /data
RUN mkdir -p /data && echo "not-a-volume" > /data/.container_marker

CMD ["node", "start.js"]
