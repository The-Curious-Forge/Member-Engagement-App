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

# Copy built application, package.json, and node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Expose the port
EXPOSE 3000

# Set environment variables for SvelteKit Node server
ENV HOST=0.0.0.0
ENV PORT=3000
ENV ORIGIN=https://signin.thecuriousforge.org

# Start the SvelteKit Node.js server
CMD ["node", "build"]