#!/bin/bash

# Destiny Analysis Deployment Script
# This script handles the deployment of the Destiny Analysis application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="destiny-analysis"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

# Functions
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

# Check if required files exist
check_requirements() {
    log_info "Checking deployment requirements..."
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Please copy .env.example to .env and configure your settings"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "All requirements satisfied"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/db_backup_$timestamp.sql"
    
    # Check if postgres container is running
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U postgres destiny > "$backup_file"
        log_success "Database backup created: $backup_file"
    else
        log_warning "PostgreSQL container not running, skipping database backup"
    fi
}

# Build and deploy
deploy() {
    log_info "Starting deployment of $APP_NAME..."
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose pull
    
    # Build the application
    log_info "Building application..."
    docker-compose build --no-cache app
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose down
    
    # Start services
    log_info "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose exec app npx prisma migrate deploy
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    docker-compose exec app npx prisma generate
    
    # Check service health
    check_health
    
    log_success "Deployment completed successfully!"
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    # Check if app is responding
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            log_success "Application is healthy"
            break
        else
            log_info "Attempt $attempt/$max_attempts: Waiting for application to be ready..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Application health check failed"
        docker-compose logs app
        exit 1
    fi
    
    # Check database connection
    if docker-compose exec app npx prisma db push --accept-data-loss &> /dev/null; then
        log_success "Database connection is healthy"
    else
        log_error "Database connection failed"
        exit 1
    fi
}

# Rollback to previous version
rollback() {
    log_warning "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose down
    
    # Restore from backup if available
    local latest_backup=$(ls -t $BACKUP_DIR/db_backup_*.sql 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Restoring database from backup: $latest_backup"
        docker-compose up -d postgres
        sleep 10
        docker-compose exec -T postgres psql -U postgres -d destiny < "$latest_backup"
    fi
    
    # Start services with previous image
    docker-compose up -d
    
    log_success "Rollback completed"
}

# Show logs
show_logs() {
    docker-compose logs -f "$1"
}

# Show status
show_status() {
    log_info "Service Status:"
    docker-compose ps
    
    log_info "Resource Usage:"
    docker stats --no-stream
}

# Cleanup old images and containers
cleanup() {
    log_info "Cleaning up old Docker images and containers..."
    
    # Remove stopped containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Main script logic
case "$1" in
    "deploy")
        check_requirements
        create_backup_dir
        backup_database
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "backup")
        create_backup_dir
        backup_database
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|logs [service]|status|cleanup|backup|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application"
        echo "  rollback - Rollback to previous version"
        echo "  logs     - Show logs for a service (optional service name)"
        echo "  status   - Show service status and resource usage"
        echo "  cleanup  - Clean up old Docker images and containers"
        echo "  backup   - Create database backup"
        echo "  health   - Check service health"
        exit 1
        ;;
esac
