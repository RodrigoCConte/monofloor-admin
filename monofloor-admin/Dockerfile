# Multi-stage build for Node.js + Python + FFmpeg
FROM node:20-bullseye AS builder

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install Node dependencies
RUN npm ci

# Copy Python requirements
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Production image
FROM node:20-bullseye-slim

# Install Python, FFmpeg, and Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    # Chromium dependencies for Puppeteer
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/public ./public

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Create temp directories
RUN mkdir -p temp/uploads temp/frames

# Railway sets PORT environment variable
# Default to 8080 for Railway compatibility
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["node", "dist/index.js"]
