#!/bin/bash
# Build and Package the Electron Application
# Usage: ./build.sh [-t win|mac|linux|all] [-m build|pack|dist]

set -e

TARGET="win"
MODE="dist"

# Parse arguments
while getopts "t:m:h" opt; do
    case $opt in
        t) TARGET="$OPTARG" ;;
        m) MODE="$OPTARG" ;;
        h)
            echo "Usage: ./build.sh [-t target] [-m mode]"
            echo ""
            echo "Options:"
            echo "  -t target    Target platform: win|mac|linux|all (default: win)"
            echo "  -m mode      Build mode: build|pack|dist (default: dist)"
            echo ""
            echo "Modes:"
            echo "  build    Only build the application"
            echo "  pack     Build and pack (unpacked directory)"
            echo "  dist     Build and create installer/package"
            exit 0
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# Color codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

write_step() {
    echo -e "\n${CYAN}=> $1${NC}"
}

write_success() {
    echo -e "\n${GREEN}✓ $1${NC}"
}

write_error() {
    echo -e "\n${RED}✗ $1${NC}"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    write_error "npm is not installed or not in PATH"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    write_step "Installing dependencies..."
    npm install || { write_error "Failed to install dependencies"; exit 1; }
fi

case $MODE in
    build)
        write_step "Building the application..."
        npm run build
        write_success "Build completed successfully"
        ;;
    pack)
        write_step "Building and packing the application (unpacked)..."
        case $TARGET in
            win) npm run pack:win ;;
            mac) npm run pack:mac ;;
            linux) npm run pack:linux ;;
            all) npm run pack ;;
            *) write_error "Unknown target: $TARGET"; exit 1 ;;
        esac
        write_success "Packing completed successfully"
        echo -e "${YELLOW}Output directory: dist/${NC}"
        ;;
    dist)
        write_step "Building and distributing the application (installer)..."
        case $TARGET in
            win) npm run dist:win ;;
            mac) npm run dist:mac ;;
            linux) npm run dist:linux ;;
            all) npm run dist ;;
            *) write_error "Unknown target: $TARGET"; exit 1 ;;
        esac
        write_success "Distribution completed successfully"
        echo -e "${YELLOW}Output directory: dist/${NC}"
        ;;
    *)
        write_error "Unknown mode: $MODE"
        exit 1
        ;;
esac
