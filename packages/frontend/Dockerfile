FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage - use simple static server
FROM node:18-alpine as production

WORKDIR /app

# Install serve globally for serving static files
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/.svelte-kit /app/.svelte-kit
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Expose the port
EXPOSE 5174

# Use the SvelteKit preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5174"]