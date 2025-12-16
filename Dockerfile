# Multi-stage build for Node.js + Python + FFmpeg
FROM node:20-bullseye AS builder

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files from monofloor-admin folder
COPY monofloor-admin/package*.json ./
COPY monofloor-admin/prisma ./prisma/

# Install Node dependencies
RUN npm ci

# Copy Python requirements
COPY monofloor-admin/requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy source code
COPY monofloor-admin/. .

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-bullseye-slim

# Install Python, FFmpeg and runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data
COPY --from=builder /app/scripts ./scripts

# Copy Python requirements and install
COPY monofloor-admin/requirements.txt ./
RUN pip3 install -r requirements.txt

# Create temp directories
RUN mkdir -p temp/uploads temp/frames

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma db push && echo 'Starting server...' && node dist/index.js 2>&1"]
