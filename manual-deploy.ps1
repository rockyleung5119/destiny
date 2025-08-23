# Manual Deployment Script - Simple Version
param(
    [string]$Target = "both"
)

Write-Host "🚀 Starting Manual Deployment" -ForegroundColor Green
Write-Host "Target: $Target" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

try {
    $wranglerVersion = wrangler --version
    Write-Host "✅ wrangler: $wranglerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ wrangler not found, installing..." -ForegroundColor Yellow
    npm install -g wrangler@latest
}

# Deploy Frontend
if ($Target -eq "frontend" -or $Target -eq "both") {
    Write-Host "`n🎨 Deploying Frontend..." -ForegroundColor Blue
    
    try {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm ci --prefer-offline --no-audit
        
        Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
        npm run build
        
        if (Test-Path "dist") {
            Write-Host "✅ Build successful" -ForegroundColor Green
            Get-ChildItem dist | Select-Object Name, Length | Format-Table
        } else {
            Write-Host "❌ Build failed - no dist directory" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "🚀 Deploying to Cloudflare Pages..." -ForegroundColor Yellow
        wrangler pages deploy dist --project-name=destiny-frontend --compatibility-date=2024-08-01
        
        Write-Host "🧪 Verifying frontend deployment..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        try {
            $response = Invoke-WebRequest -Uri "https://indicate.top" -Method GET -TimeoutSec 30
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend deployment successful" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Frontend deployed but response code: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Frontend deployed but verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Deploy Backend
if ($Target -eq "backend" -or $Target -eq "both") {
    Write-Host "`n⚙️ Deploying Backend..." -ForegroundColor Blue
    
    try {
        Push-Location backend
        
        Write-Host "📋 Checking backend files..." -ForegroundColor Yellow
        if (-not (Test-Path "worker.ts")) {
            Write-Host "❌ worker.ts not found" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        
        if (-not (Test-Path "wrangler.toml")) {
            Write-Host "❌ wrangler.toml not found" -ForegroundColor Red
            Pop-Location
            exit 1
        }
        
        if (-not (Test-Path "package.json")) {
            if (Test-Path "workers-package.json") {
                Write-Host "📦 Using workers-package.json as package.json" -ForegroundColor Yellow
                Copy-Item "workers-package.json" "package.json"
            } else {
                Write-Host "❌ No package.json found" -ForegroundColor Red
                Pop-Location
                exit 1
            }
        }
        
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
        Remove-Item -Path "node_modules", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue
        npm install
        
        Write-Host "🔍 Validating backend configuration..." -ForegroundColor Yellow
        $workerContent = Get-Content "worker.ts" -Raw
        if ($workerContent -match "StripeAPIClient") {
            Write-Host "✅ Stripe API client found" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Stripe API client not found" -ForegroundColor Yellow
        }
        
        Write-Host "🚀 Deploying to Cloudflare Workers..." -ForegroundColor Yellow
        wrangler deploy --compatibility-date=2024-08-01 --minify=false --keep-vars
        
        Write-Host "🧪 Verifying backend deployment..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        try {
            $healthResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/health" -Method GET -TimeoutSec 30
            if ($healthResponse.StatusCode -eq 200) {
                Write-Host "✅ Backend health check passed" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Backend health check response code: $($healthResponse.StatusCode)" -ForegroundColor Yellow
            }
            
            $stripeResponse = Invoke-WebRequest -Uri "https://api.indicate.top/api/stripe/health" -Method GET -TimeoutSec 30
            if ($stripeResponse.StatusCode -eq 200) {
                Write-Host "✅ Stripe health check passed" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Stripe health check response code: $($stripeResponse.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Backend deployed but verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        Pop-Location
        
    } catch {
        Write-Host "❌ Backend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green
Write-Host "🔗 Frontend: https://indicate.top" -ForegroundColor Cyan
Write-Host "🔗 Backend: https://api.indicate.top" -ForegroundColor Cyan
Write-Host "🔗 Health Check: https://api.indicate.top/api/health" -ForegroundColor Cyan
Write-Host "🔗 Stripe Check: https://api.indicate.top/api/stripe/health" -ForegroundColor Cyan
