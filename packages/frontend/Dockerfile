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
COPY --from=build /app/build /app/build

# Expose the port
EXPOSE 5174

# Serve the static files with SPA support
CMD ["serve", "-s", "build", "-l", "5174", "--host", "0.0.0.0"]