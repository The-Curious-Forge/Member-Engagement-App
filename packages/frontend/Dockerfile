# Multi-stage build for optimized production deployment
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with cache optimizations
RUN npm ci --only=production --omit=dev --cache /tmp/.npm

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --cache /tmp/.npm

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --omit=dev --cache /tmp/.npm && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Change ownership of app directory
RUN chown -R sveltekit:nodejs /app
USER sveltekit

# Expose port
EXPOSE 3000

# Health check removed for now to test Traefik discovery
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#     CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the Node.js server
CMD ["node", "build"]