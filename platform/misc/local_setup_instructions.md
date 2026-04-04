# 🚀 Shout Aloud - Local Development Setup

## 📋 Prerequisites

### Required Software

1. **Docker & Docker Compose**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # macOS
   brew install docker docker-compose
   
   # Windows
   # Download Docker Desktop from https://docker.com
   ```

2. **Git**
   ```bash
   # Ubuntu/Debian
   sudo apt install git
   
   # macOS
   brew install git
   
   # Windows
   # Download from https://git-scm.com
   ```

3. **Node.js 18+ (for development)**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   
   # Or direct install
   # Ubuntu/Debian: sudo apt install nodejs npm
   # macOS: brew install node
   ```

4. **NVIDIA Docker Support (for AI service)**
   ```bash
   # Ubuntu/Debian only (for GPU acceleration)
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-docker2
   sudo systemctl restart docker
   ```

### System Requirements

- **Minimum**: 8GB RAM, 50GB disk space
- **Recommended**: 16GB RAM, 100GB disk space, NVIDIA GPU
- **OS**: Linux, macOS, Windows 10/11 with WSL2

## 🏗️ Project Structure Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/shout-aloud/platform.git
   