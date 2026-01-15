# CV Converter API - Production Deployment Script
param(
    [string]$SitePath = "C:\inetpub\wwwroot\cv-converter-api",
    [string]$SiteName = "CVConverterAPI", 
    [int]$Port = 3000,
    [string]$DatabaseUrl = "postgresql://cv_user:secure_password@localhost:5432/cv_converter_db?schema=public"
)

Write-Host "🚀 Deploying CV Converter API" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "❌ This script must be run as Administrator"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Node.js is not installed. Please install Node.js first."
    exit 1
}

# Build the API
Write-Host "🔨 Building API for production..." -ForegroundColor Yellow
try {
    & nx build cv-converter-api --configuration=production
    Write-Host "✅ API built successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to build API"
    exit 1
}

# Create API directory
if (!(Test-Path $SitePath)) {
    Write-Host "📁 Creating API directory: $SitePath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SitePath -Force
}

# Copy API build files
Write-Host "📋 Copying API files..." -ForegroundColor Yellow
Copy-Item -Path "dist\apps\cv-converter-api\*" -Destination $SitePath -Recurse -Force

# Create .env file
Write-Host "⚙️ Creating production environment file..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
DATABASE_URL="$DatabaseUrl"

# Application Configuration
NODE_ENV=production
PORT=$Port

# JWT Configuration (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=super-secret-jwt-key-change-this-in-production-32chars

# CORS Configuration  
CORS_ORIGINS=http://localhost,http://localhost:8080
"@

$envContent | Out-File -FilePath "$SitePath\.env" -Encoding UTF8
Write-Host "✅ Environment file created" -ForegroundColor Green

# Copy necessary files
Write-Host "📋 Copying Prisma files..." -ForegroundColor Yellow
if (Test-Path "apps\cv-converter-api\prisma") {
    Copy-Item -Path "apps\cv-converter-api\prisma" -Destination $SitePath -Recurse -Force
}
if (Test-Path "apps\cv-converter-api\generated") {
    Copy-Item -Path "apps\cv-converter-api\generated" -Destination $SitePath -Recurse -Force
}

# Copy templates directory if it exists
if (Test-Path "apps\cv-converter-api\templates") {
    Copy-Item -Path "apps\cv-converter-api\templates" -Destination $SitePath -Recurse -Force
}

# Navigate to deployment directory
Set-Location $SitePath

# Install production dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
try {
    & npm install --omit=dev
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to install dependencies"
    exit 1
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
try {
    & npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to generate Prisma client"
    Write-Host "⚠️ Make sure PostgreSQL is running and DATABASE_URL is correct" -ForegroundColor Yellow
}

# Run database migrations
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
try {
    & npx prisma migrate deploy
    Write-Host "✅ Database migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to run database migrations"
    Write-Host "⚠️ Database might not be accessible. Check DATABASE_URL and ensure PostgreSQL is running" -ForegroundColor Yellow
}

# Install PM2 if not installed
try {
    $pm2Version = pm2 --version
    Write-Host "✅ PM2 version: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing PM2 process manager..." -ForegroundColor Yellow
    & npm install -g pm2
}

# Stop existing PM2 process if running
try {
    & pm2 delete cv-converter-api
    Write-Host "🔄 Stopped existing API process" -ForegroundColor Yellow
} catch {
    # Process didn't exist, continue
}

# Start API with PM2
Write-Host "🚀 Starting API with PM2..." -ForegroundColor Yellow
try {
    & pm2 start main.js --name "cv-converter-api" --env production
    Write-Host "✅ API started successfully with PM2" -ForegroundColor Green
    
    # Save PM2 configuration
    & pm2 save
    Write-Host "✅ PM2 configuration saved" -ForegroundColor Green
    
    # Set up PM2 to start on boot
    $startupCommand = pm2 startup --no-colors | Select-String "sudo" | ForEach-Object { $_.ToString().Replace("sudo", "") }
    if ($startupCommand) {
        Write-Host "📌 To make PM2 start on boot, run this command as Administrator:" -ForegroundColor Yellow
        Write-Host $startupCommand -ForegroundColor Cyan
    }
} catch {
    Write-Error "❌ Failed to start API with PM2"
    Write-Host "⚠️ Trying to start manually..." -ForegroundColor Yellow
    
    # Try starting manually
    Start-Job -ScriptBlock { 
        Set-Location $using:SitePath
        node main.js 
    }
    Write-Host "✅ API started manually" -ForegroundColor Green
}

# Test API endpoint
Write-Host "🔍 Testing API endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api" -UseBasicParsing
    Write-Host "✅ API is responding: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API might still be starting up. Check http://localhost:$Port/api in a few moments" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 API Deployment completed!" -ForegroundColor Green
Write-Host "📍 API URL: http://localhost:$Port/api" -ForegroundColor Cyan
Write-Host "📚 API Documentation: http://localhost:$Port/api/docs" -ForegroundColor Cyan
Write-Host "📂 API Path: $SitePath" -ForegroundColor Cyan
Write-Host "🗄️ Database: $DatabaseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the API: http://localhost:$Port/api" -ForegroundColor White
Write-Host "   2. Check Swagger docs: http://localhost:$Port/api/docs" -ForegroundColor White  
Write-Host "   3. Update frontend to point to: http://localhost:$Port/api" -ForegroundColor White
Write-Host "   4. Configure firewall to allow port $Port" -ForegroundColor White
Write-Host "   5. Set up SSL certificate for production" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "   pm2 status                 - Check API status" -ForegroundColor White
Write-Host "   pm2 logs cv-converter-api  - View API logs" -ForegroundColor White
Write-Host "   pm2 restart cv-converter-api - Restart API" -ForegroundColor White

# Return to original directory
Set-Location "C:\Source\cv-converter" 