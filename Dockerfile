FROM node:22-slim

WORKDIR /app

# Copy root files
COPY package.json start.js ./

# Copy backend package files and install ALL dependencies (need typescript for build)
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci

# Copy backend source and build
COPY backend/src/ ./backend/src/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm run build

# Remove devDependencies after build
RUN cd backend && npm prune --omit=dev

# Debug: verify files exist and node:sqlite works
RUN echo "=== Build check ===" && \
    ls -la /app/backend/dist/ && \
    node --experimental-sqlite -e "console.log('node:sqlite OK', process.version)"

EXPOSE 3001

CMD ["node", "--experimental-sqlite", "start.js"]
