#!/bin/bash
# scripts/setup.sh
# Shout Aloud Platform - Automated Setup Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (optional for development)
    if ! command_exists node; then
        print_warning "Node.js not found. This is optional but recommended for development."
    fi
    
    # Check available disk space (need at least 10GB)
    available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 10485760 ]; then  # 10GB in KB
        print_error "Insufficient disk space. At least 10GB is required."
        exit 1
    fi
    
    # Check available memory (need at least 4GB)
    available_memory=$(free -m | awk 'NR==2{print $7}')
    if [ "$available_memory" -lt 4096 ]; then
        print_warning "Less than 4GB RAM available. Performance may be affected."
    fi
    
    print_success "System requirements check passed!"
}

# Create directory structure
create_directories() {
    print_status "Creating directory structure..."
    
    # Main data directories
    mkdir -p data/{models,cache,scraped,blockchain}
    mkdir -p logs
    mkdir -p config/{nginx,prometheus,grafana/{dashboards,datasources}}
    mkdir -p database
    mkdir -p backend/{ai,tests}
    mkdir -p frontend-mobile/{src,public}
    mkdir -p scraping/{scrapers,tests}
    mkdir -p blockchain/{contracts,scripts,test}
    mkdir -p governance/ratings
    mkdir -p infrastructure/decentralized
    
    # Set permissions
    chmod -R 755 data/ logs/ 2>/dev/null || true
    
    print_success "Directory structure created!"
}

# Create configuration files
create_config_files() {
    print_status "Creating configuration files..."
    
    # Environment file
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# Database
POSTGRES_DB=shoutaloud
POSTGRES_USER=shoutaloud
POSTGRES_PASSWORD=password123

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# AI Services (replace with your keys)
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
MODEL_CACHE_DIR=./data/cache

# IPFS
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080

# Monitoring
GRAFANA_ADMIN_PASSWORD=admin123

# Development
NODE_ENV=development
DEBUG=true
LOG_LEVEL=info
EOF
        print_success "Created .env file"
    else
        print_status ".env file already exists, skipping..."
    fi
    
    # Backend requirements
    if [ ! -f backend/requirements.txt ]; then
        cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
web3==6.12.0
ipfshttpclient==0.8.0
requests==2.31.0
python-multipart==0.0.6
pydantic==2.5.0
transformers==4.35.2
torch==2.1.1
numpy==1.24.3
pandas==2.1.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
prometheus-client==0.19.0
python-dotenv==1.0.0
EOF
        print_success "Created backend/requirements.txt"
    fi
    
    # AI service requirements
    if [ ! -f backend/ai/requirements.txt ]; then
        cat > backend/ai/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
transformers==4.35.2
torch==2.1.1
tokenizers==0.15.0
accelerate==0.24.1
bitsandbytes==0.41.3
scipy==1.11.4
numpy==1.24.3
sentencepiece==0.1.99
protobuf==4.25.1
huggingface-hub==0.19.4
datasets==2.14.7
python-dotenv==1.0.0
EOF
        print_success "Created backend/ai/requirements.txt"
    fi
    
    # Scraper requirements
    if [ ! -f scraping/requirements.txt ]; then
        cat > scraping/requirements.txt << 'EOF'
requests==2.31.0
beautifulsoup4==4.12.2
selenium==4.15.2
playwright==1.40.0
scrapy==2.11.0
redis==5.0.1
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
schedule==1.2.0
python-dateutil==2.8.2
lxml==4.9.3
PyPDF2==3.0.1
python-dotenv==1.0.0
EOF
        print_success "Created scraping/requirements.txt"
    fi
    
    # Blockchain package.json
    if [ ! -f blockchain/package.json ]; then
        cat > blockchain/package.json << 'EOF'
{
  "name": "shout-aloud-blockchain",
  "version": "1.0.0",
  "description": "Shout Aloud Smart Contracts",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy": "hardhat run scripts/deploy.js",
    "node": "hardhat node"
  },
  "dependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "^5.0.0",
    "hardhat": "^2.19.0",
    "ethers": "^6.8.0"
  }
}
EOF
        print_success "Created blockchain/package.json"
    fi
    
    # Frontend package.json
    if [ ! -f frontend-mobile/package.json ]; then
        cat > frontend-mobile/package.json << 'EOF'
{
  "name": "shout-aloud-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build:web"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "expo-camera": "~13.6.0",
    "expo-local-authentication": "~13.8.0",
    "ethers": "^6.8.0",
    "react-native-reanimated": "~3.3.0",
    "react-native-vector-icons": "^10.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  }
}
EOF
        print_success "Created frontend-mobile/package.json"
    fi
    
    # Simple main.py for backend
    if [ ! -f backend/main.py ]; then
        cat > backend/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Shout Aloud API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Shout Aloud API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
        print_success "Created backend/main.py"
    fi
    
    # Simple AI API
    if [ ! -f backend/ai/api.py ]; then
        cat > backend/ai/api.py << 'EOF'
from fastapi import FastAPI
from pydantic import BaseModel
import os

app = FastAPI(title="Shout Aloud AI Service", version="1.0.0")

class AnalysisRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Shout Aloud AI Service is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai"}

@app.post("/analyze")
def analyze_text(request: AnalysisRequest):
    # Simple mock analysis for now
    return {
        "personal_impact": "Este texto podría afectarte de manera moderada.",
        "beneficiaries": ["ciudadanos", "gobierno"],
        "fairness_score": 0.7,
        "recommendation": "abstain",
        "confidence": 0.8
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
EOF
        print_success "Created backend/ai/api.py"
    fi
    
    # Simple scraper scheduler
    if [ ! -f scraping/scheduler.py ]; then
        cat > scraping/scheduler.py << 'EOF'
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Shout Aloud Scraper started")
    
    while True:
        logger.info(f"Running scraping cycle at {datetime.now()}")
        # Add actual scraping logic here
        time.sleep(3600)  # Wait 1 hour

if __name__ == "__main__":
    main()
EOF
        print_success "Created scraping/scheduler.py"
    fi
    
    # Hardhat config
    if [ ! -f blockchain/hardhat.config.js ]; then
        cat > blockchain/hardhat.config.js << 'EOF'
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
EOF
        print_success "Created blockchain/hardhat.config.js"
    fi
}

# Check Docker daemon
check_docker() {
    print_status "Checking Docker daemon..."
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker daemon is running!"
}

# Download Docker images
download_images() {
    print_status "Downloading Docker images (this may take a while)..."
    
    # Pre-pull common images to speed up first start
    images=(
        "postgres:15-alpine"
        "redis:7-alpine"
        "ipfs/go-ipfs:latest"
        "node:18-alpine"
        "python:3.11-slim"
        "nginx:alpine"
        "prom/prometheus:latest"
        "grafana/grafana:latest"
    )
    
    for image in "${images[@]}"; do
        print_status "Pulling $image..."
        docker pull "$image" || print_warning "Failed to pull $image"
    done
    
    print_success "Docker images downloaded!"
}

# Build services
build_services() {
    print_status "Building custom Docker images..."
    
    # Build only if docker-compose.yml exists
    if [ -f docker-compose.yml ]; then
        docker-compose build --parallel || {
            print_error "Failed to build services"
            exit 1
        }
        print_success "Services built successfully!"
    else
        print_warning "docker-compose.yml not found, skipping build"
    fi
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    
    # Start only postgres to initialize
    docker-compose up -d postgres
    
    # Wait for postgres to be ready
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U shoutaloud >/dev/null 2>&1; then
            break
        fi
        print_status "Waiting for database... ($i/30)"
        sleep 2
    done
    
    print_success "Database initialized!"
}

# Create helper scripts
create_helper_scripts() {
    print_status "Creating helper scripts..."
    
    # Start script
    cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Shout Aloud Platform..."
docker-compose up -d
echo "✅ Platform started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:8000"
echo "🤖 AI: http://localhost:8001"
echo "⛓️ Blockchain: http://localhost:8545"
echo "📊 Monitoring: http://localhost:3001"
EOF
    
    # Stop script
    cat > scripts/stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Shout Aloud Platform..."
docker-compose down
echo "✅ Platform stopped!"
EOF
    
    # Status script
    cat > scripts/status.sh << 'EOF'
#!/bin/bash
echo "📊 Shout Aloud Platform Status:"
docker-compose ps
echo ""
echo "🔗 Service URLs:"
echo "  Frontend:   http://localhost:3000"
echo "  API:        http://localhost:8000"
echo "  AI:         http://localhost:8001"
echo "  Blockchain: http://localhost:8545"
echo "  IPFS:       http://localhost:8080"
echo "  Database:   localhost:5432"
echo "  Monitoring: http://localhost:3001"
EOF
    
    # Logs script
    cat > scripts/logs.sh << 'EOF'
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: ./logs.sh <service_name>"
    echo "Available services: backend, ai-service, scraper, blockchain, frontend, postgres, redis, ipfs"
    exit 1
fi
docker-compose logs -f "$1"
EOF
    
    # Reset script
    cat > scripts/reset.sh << 'EOF'
#!/bin/bash
echo "⚠️ This will reset all data. Are you sure? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🗑️ Resetting platform..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Platform reset complete!"
else
    echo "❌ Reset cancelled"
fi
EOF
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    print_success "Helper scripts created!"
}

# Test services
test_services() {
    print_status "Testing services..."
    
    # Start all services
    docker-compose up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Test each service
    services=(
        "http://localhost:8000/health:Backend API"
        "http://localhost:8001/health:AI Service"
        "http://localhost:8080/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn:IPFS Gateway"
    )
    
    for service in "${services[@]}"; do
        url="${service%:*}"
        name="${service#*:}"
        
        if curl -f -s "$url" >/dev/null 2>&1; then
            print_success "$name is responding"
        else
            print_warning "$name is not responding (may still be starting)"
        fi
    done
    
    # Test database connection
    if docker-compose exec -T postgres pg_isready -U shoutaloud >/dev/null 2>&1; then
        print_success "Database is ready"
    else
        print_warning "Database is not ready"
    fi
    
    print_success "Service tests completed!"
}

# Show completion message
show_completion() {
    echo ""
    echo "🎉 Shout Aloud Platform Setup Complete!"
    echo "========================================"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "  ./scripts/start.sh     - Start all services"
    echo "  ./scripts/stop.sh      - Stop all services"
    echo "  ./scripts/status.sh    - Check service status"
    echo "  ./scripts/logs.sh <service> - View service logs"
    echo ""
    echo "🔗 Service URLs:"
    echo "  Frontend:   http://localhost:3000"
    echo "  API Docs:   http://localhost:8000/docs"
    echo "  AI Service: http://localhost:8001/docs"
    echo "  Blockchain: http://localhost:8545"
    echo "  IPFS:       http://localhost:8080"
    echo "  Monitoring: http://localhost:3001 (admin/admin123)"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Edit .env file with your API keys"
    echo "  2. Run: ./scripts/start.sh"
    echo "  3. Open http://localhost:3000 in your browser"
    echo "  4. Check the documentation in docs/"
    echo ""
    echo "🆘 Need help? Check the troubleshooting guide or create an issue."
    echo ""
}

# Main setup function
main() {
    echo "🏛️ Shout Aloud Platform Setup"
    echo "============================="
    echo ""
    
    # Run setup steps
    check_requirements
    check_docker
    create_directories
    create_config_files
    create_helper_scripts
    
    # Ask if user wants to download images and build
    echo ""
    read -p "Do you want to download Docker images and build services now? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        download_images
        build_services
        
        echo ""
        read -p "Do you want to start services and run tests? (y/N): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            init_database
            test_services
        fi
    fi
    
    show_completion
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Shout Aloud Platform Setup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick, -q    Quick setup (no prompts)"
        echo "  --minimal, -m  Minimal setup (no downloads)"
        echo ""
        exit 0
        ;;
    --quick|-q)
        echo "🚀 Quick setup mode..."
        check_requirements
        check_docker
        create_directories
        create_config_files
        create_helper_scripts
        download_images
        build_services
        init_database
        test_services
        show_completion
        ;;
    --minimal|-m)
        echo "📦 Minimal setup mode..."
        check_requirements
        create_directories
        create_config_files
        create_helper_scripts
        show_completion
        ;;
    *)
        main
        ;;
esac