# Multi-stage build for optimized production deployment
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better caching
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

# Create non-root user for security first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production --omit=dev --cache /tmp/.npm && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/build ./build

# Change ownership of app directory to sveltekit user
RUN chown -R sveltekit:nodejs /app

# Switch to non-root user
USER sveltekit

# Expose port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "build"]