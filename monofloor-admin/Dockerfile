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
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Create temp directories
RUN mkdir -p temp/uploads temp/frames

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]
