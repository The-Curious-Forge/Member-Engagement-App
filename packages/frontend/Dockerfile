FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with optimizations
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Copy built application and package.json
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json

# Install only production dependencies with optimizations
RUN npm install --only=production --no-audit --no-fund --prefer-offline && npm cache clean --force

# Expose the port
EXPOSE 3000

# Set environment variables for SvelteKit Node server
ENV HOST=0.0.0.0
ENV PORT=3000
ENV ORIGIN=https://signin.thecuriousforge.org

# Start the SvelteKit Node.js server
CMD ["node", "build"]