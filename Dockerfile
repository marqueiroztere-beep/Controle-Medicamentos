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

CMD ["node", "start.js"]
