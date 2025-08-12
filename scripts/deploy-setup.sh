#!/bin/bash

# Member Engagement App - Production Setup Script
# This script automates the initial server setup for deployment

set -e

echo "🚀 Member Engagement App - Production Setup"
echo "==========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "Docker installed"
else
    print_status "Docker already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed"
else
    print_status "Docker Compose already installed"
fi

# Create application directory
APP_DIR="/opt/member-engagement-app"
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    print_status "Application directory created at $APP_DIR"
else
    print_status "Application directory already exists"
fi

# Navigate to app directory
cd $APP_DIR

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚙️ Creating environment file..."
        cp .env.example .env
        print_warning "Please edit .env file with your production values"
        print_warning "Required: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, GOOGLE_API_KEY, GOOGLE_CALENDAR_ID"
    else
        print_error ".env.example not found. Please ensure you're in the correct directory."
        exit 1
    fi
else
    print_status "Environment file already exists"
fi

# Setup firewall
echo "🛡️ Configuring firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
print_status "Firewall configured"

# Check if user is in docker group
if groups $USER | grep &>/dev/null '\bdocker\b'; then
    print_status "User is in docker group"
else
    print_warning "You need to logout and login again for docker group changes to take effect"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit $APP_DIR/.env with your production values"
echo "2. Configure DNS records for your domains"
echo "3. Set up GitHub repository secrets"
echo "4. Push to 'live' branch to trigger deployment"
echo ""
echo "For detailed instructions, see docs/DEPLOYMENT.md"