#!/bin/bash

# Quick Start Script for Destiny Analysis System
# This script sets up the development environment and runs basic tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18 or later is required. Current version: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js $(node -v) is installed"
}

# Check if required tools are installed
check_tools() {
    log_info "Checking required tools..."
    
    check_node
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_warning "Git is not installed (optional but recommended)"
    fi
    
    log_success "All required tools are available"
}

# Setup environment file
setup_env() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
            log_warning "Please edit .env file with your actual configuration values"
        else
            log_error ".env.example file not found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    
    npm install
    
    log_success "Dependencies installed successfully"
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Run database migrations
    if npx prisma migrate dev --name init 2>/dev/null; then
        log_success "Database migrations completed"
    else
        log_warning "Database migrations failed or already applied"
    fi
    
    # Seed database with initial data
    if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
        npm run db:seed 2>/dev/null || log_warning "Database seeding failed or not configured"
    fi
}

# Build the application
build_app() {
    log_info "Building the application..."
    
    npm run build
    
    log_success "Application built successfully"
}

# Run basic tests
run_tests() {
    log_info "Running basic functionality tests..."
    
    # Check if test script exists
    if [ -f "scripts/test-all.js" ]; then
        node scripts/test-all.js
    else
        log_warning "Test script not found, skipping tests"
    fi
}

# Start development server
start_dev() {
    log_info "Starting development server..."
    
    log_success "Development server will start on http://localhost:3000"
    log_info "Press Ctrl+C to stop the server"
    
    npm run dev
}

# Show next steps
show_next_steps() {
    echo ""
    log_success "🎉 Quick start completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "1. Edit the .env file with your actual configuration values"
    echo "2. Configure your database connection"
    echo "3. Set up your OpenAI API key for AI features"
    echo "4. Configure Stripe for payment processing"
    echo "5. Set up email SMTP settings"
    echo ""
    log_info "To start the development server:"
    echo "  npm run dev"
    echo ""
    log_info "To run tests:"
    echo "  npm test"
    echo ""
    log_info "To deploy with Docker:"
    echo "  ./scripts/deploy.sh deploy"
    echo ""
    log_info "For more information, check the README.md file"
}

# Main execution
main() {
    echo "🚀 Destiny Analysis System - Quick Start"
    echo "========================================"
    echo ""
    
    check_tools
    setup_env
    install_deps
    setup_database
    
    # Ask user if they want to build and test
    read -p "Do you want to build the application and run tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_app
        run_tests
    fi
    
    # Ask user if they want to start dev server
    read -p "Do you want to start the development server now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev
    else
        show_next_steps
    fi
}

# Handle script arguments
case "${1:-}" in
    "setup")
        check_tools
        setup_env
        install_deps
        setup_database
        show_next_steps
        ;;
    "test")
        run_tests
        ;;
    "dev")
        start_dev
        ;;
    *)
        main
        ;;
esac
