#!/bin/bash

# JogGPS AI Coaching Backend - Coolify Deployment Script
# Usage: ./scripts/deploy-coolify.sh

set -e  # Exit on any error

COOLIFY_SERVER="192.168.0.224:8000"
PROJECT_NAME="joggps-ai-coaching-backend"

echo "JogGPS AI Coaching Backend - Coolify Deployment"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env_vars() {
    echo -e "${BLUE}Checking environment variables...${NC}"
    
    if [ -z "$OPENROUTER_API_KEY" ]; then
        echo -e "${RED}Error: OPENROUTER_API_KEY environment variable is required${NC}"
        echo "Please set your OpenRouter API key:"
        echo "export OPENROUTER_API_KEY=your_api_key_here"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Environment variables OK${NC}"
}

# Build the Docker image locally for testing
build_local() {
    echo -e "${BLUE}Building Docker image locally...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is required but not installed${NC}"
        exit 1
    fi
    
    # Build the image
    docker build -t $PROJECT_NAME:latest .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Docker image built successfully${NC}"
    else
        echo -e "${RED}✗ Docker build failed${NC}"
        exit 1
    fi
}

# Test the image locally
test_local() {
    echo -e "${BLUE}Testing Docker image locally...${NC}"
    
    # Start Redis for testing
    docker run -d --name test-redis -p 16379:6379 redis:7-alpine redis-server --appendonly yes
    
    # Start the application
    docker run -d --name test-backend \
        -p 13000:3000 \
        -e NODE_ENV=production \
        -e REDIS_URL=redis://host.docker.internal:16379 \
        -e REDIS_HOST=host.docker.internal \
        -e REDIS_PORT=16379 \
        -e OPENROUTER_API_KEY=$OPENROUTER_API_KEY \
        $PROJECT_NAME:latest
    
    # Wait for services to start
    echo "Waiting for services to start..."
    sleep 10
    
    # Test health endpoint
    response=$(curl -s -w "%{http_code}" http://localhost:13000/api/health)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Local test passed${NC}"
    else
        echo -e "${RED}✗ Local test failed (HTTP $http_code)${NC}"
        echo "Response: $(echo "$response" | head -n -1)"
    fi
    
    # Cleanup test containers
    docker stop test-backend test-redis 2>/dev/null || true
    docker rm test-backend test-redis 2>/dev/null || true
    
    if [ "$http_code" != "200" ]; then
        exit 1
    fi
}

# Create Coolify environment file
create_env_file() {
    echo -e "${BLUE}Creating Coolify environment file...${NC}"
    
    cat > coolify.env << EOF
# JogGPS AI Coaching Backend - Coolify Environment
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
REDIS_URL=redis://joggps-redis:6379
REDIS_HOST=joggps-redis
REDIS_PORT=6379
EOF
    
    echo -e "${GREEN}✓ Environment file created: coolify.env${NC}"
    echo -e "${YELLOW}Note: Upload this file to your Coolify environment variables${NC}"
}

# Display deployment instructions
show_instructions() {
    echo -e "\n${BLUE}Coolify Deployment Instructions:${NC}"
    echo "=================================="
    
    echo -e "\n${YELLOW}1. Create Redis Database:${NC}"
    echo "   - Go to http://$COOLIFY_SERVER"
    echo "   - Navigate to Databases → Create Database → Redis"
    echo "   - Name: joggps-redis"
    echo "   - Image: redis:7-alpine"
    echo "   - Memory: 256MB"
    echo "   - Enable persistent storage"
    
    echo -e "\n${YELLOW}2. Deploy Application:${NC}"
    echo "   - Navigate to Applications → Create Application → Docker Compose"
    echo "   - Name: $PROJECT_NAME"
    echo "   - Upload docker-compose.yml from this directory"
    echo "   - Set environment variables from coolify.env file"
    
    echo -e "\n${YELLOW}3. Configure Domain & SSL:${NC}"
    echo "   - Add your domain in application settings"
    echo "   - Enable SSL certificate (Let's Encrypt)"
    echo "   - Enable HTTP to HTTPS redirect"
    
    echo -e "\n${YELLOW}4. Test Deployment:${NC}"
    echo "   - Wait for deployment to complete"
    echo "   - Test health endpoint: https://your-domain.com/api/health"
    echo "   - Run API tests: ./scripts/test-api.sh https://your-domain.com"
    
    echo -e "\n${GREEN}Files ready for deployment:${NC}"
    echo "   ✓ docker-compose.yml"
    echo "   ✓ Dockerfile"
    echo "   ✓ coolify.env"
    echo "   ✓ COOLIFY_DEPLOYMENT.md (detailed instructions)"
}

# Main execution
main() {
    echo "Starting deployment preparation..."
    
    check_env_vars
    build_local
    test_local
    create_env_file
    show_instructions
    
    echo -e "\n${GREEN}Deployment preparation completed successfully!${NC}"
    echo -e "${BLUE}Next: Upload the files to your Coolify instance and follow the instructions above.${NC}"
}

# Handle script arguments
case "$1" in
    "build")
        build_local
        ;;
    "test")
        test_local
        ;;
    "env")
        check_env_vars
        create_env_file
        ;;
    *)
        main
        ;;
esac