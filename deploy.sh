#!/bin/bash
set -e

echo "=== Member Engagement App Deployment Script ==="
echo "This script will deploy the application to your server."

# Clone the repository if it doesn't exist
if [ ! -d "Member-Engagement-App" ]; then
  echo "Cloning repository..."
  git clone https://github.com/The-Curious-Forge/Member-Engagement-App.git
  cd Member-Engagement-App
else
  echo "Repository already exists, updating..."
  cd Member-Engagement-App
  git pull
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "Please edit the .env file with your API keys."
  echo "Press any key to continue after editing..."
  read -n 1
fi

# Build and start the containers
echo "Building and starting Docker containers..."
docker compose down
docker compose up -d --build

echo "=== Deployment complete! ==="
echo "Your application should be available at http://$(hostname -I | awk '{print $1}'):5174"
echo "To view logs, run: docker compose logs -f"