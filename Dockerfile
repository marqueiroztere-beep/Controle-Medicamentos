FROM node:22-slim

WORKDIR /app

# Copy root files
COPY package.json start.js ./

# Copy backend package files and install dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

# Copy backend source and build
COPY backend/src/ ./backend/src/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

EXPOSE 3001

CMD ["node", "--experimental-sqlite", "start.js"]
