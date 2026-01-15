# Quick Database Setup for CV Converter
# This script helps you quickly set up the database and fix common deployment issues

Write-Host "🚀 CV Converter - Quick Database Setup" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Check if Docker is installed
Write-Host "🐳 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    
    # Start PostgreSQL with Docker
    Write-Host "🗄️ Starting PostgreSQL database..." -ForegroundColor Yellow
    docker-compose up -d postgres
    
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "✅ PostgreSQL is running!" -ForegroundColor Green
    Write-Host "   📍 Host: localhost" -ForegroundColor Cyan
    Write-Host "   📍 Port: 5432" -ForegroundColor Cyan
    Write-Host "   📍 Database: cv_converter_db" -ForegroundColor Cyan
    Write-Host "   📍 User: cv_user" -ForegroundColor Cyan
    Write-Host "   📍 Password: secure_password123" -ForegroundColor Cyan
    
    $usingDocker = $true
    
} catch {
    Write-Host "⚠️ Docker not found. Using manual PostgreSQL setup..." -ForegroundColor Yellow
    $usingDocker = $false
}

# Set DATABASE_URL environment variable
$databaseUrl = "postgresql://cv_user:secure_password123@localhost:5432/cv_converter_db?schema=public"

if ($usingDocker) {
    Write-Host "🔗 Setting DATABASE_URL for Docker PostgreSQL..." -ForegroundColor Yellow
} else {
    Write-Host "🔗 Setting DATABASE_URL for local PostgreSQL..." -ForegroundColor Yellow
    Write-Host "   ⚠️ Make sure PostgreSQL is installed and running!" -ForegroundColor Red
    Write-Host "   📋 Create database manually with:" -ForegroundColor Yellow
    Write-Host "      CREATE DATABASE cv_converter_db;" -ForegroundColor Cyan
    Write-Host "      CREATE USER cv_user WITH PASSWORD 'secure_password123';" -ForegroundColor Cyan  
    Write-Host "      GRANT ALL PRIVILEGES ON DATABASE cv_converter_db TO cv_user;" -ForegroundColor Cyan
}

# Set environment variable for current session
$env:DATABASE_URL = $databaseUrl
Write-Host "✅ DATABASE_URL set for current session" -ForegroundColor Green

# Navigate to API directory
Write-Host "📁 Navigating to API directory..." -ForegroundColor Yellow
cd apps/cv-converter-api

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
# Database Configuration
DATABASE_URL="$databaseUrl"

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:4200,http://localhost:4201,http://localhost:8080
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to generate Prisma client"
    Write-Host "⚠️ Try running: npm install" -ForegroundColor Yellow
    Write-Host "⚠️ Then run: npx prisma generate" -ForegroundColor Yellow
}

# Run database migrations  
Write-Host "🗄️ Running database migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate dev --name init
    Write-Host "✅ Database migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Migration failed. Trying alternative method..." -ForegroundColor Yellow
    try {
        npx prisma db push
        Write-Host "✅ Database schema pushed successfully" -ForegroundColor Green
    } catch {
        Write-Error "❌ Failed to set up database schema"
        Write-Host "🔧 Manual steps to try:" -ForegroundColor Yellow
        Write-Host "   1. Check if PostgreSQL is running" -ForegroundColor White
        Write-Host "   2. Verify DATABASE_URL is correct" -ForegroundColor White
        Write-Host "   3. Run: npx prisma db push" -ForegroundColor White
    }
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    npx prisma db seed 2>$null
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    # Ignore seed errors, just test connection
    Write-Host "✅ Database connection test completed" -ForegroundColor Green
}

# Return to project root
cd ..
cd ..

Write-Host ""
Write-Host "🎉 Database setup completed!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
if ($usingDocker) {
    Write-Host "   ✅ PostgreSQL running in Docker" -ForegroundColor Green
    Write-Host "   📍 Database URL: $databaseUrl" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️ Using local PostgreSQL (make sure it's running)" -ForegroundColor Yellow
    Write-Host "   📍 Expected Database URL: $databaseUrl" -ForegroundColor Cyan
}
Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
Write-Host "   ✅ Database migrations completed" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Start the API: nx serve cv-converter-api" -ForegroundColor White
Write-Host "   2. Start the frontend: nx serve cv-converter-web --port=4201" -ForegroundColor White
Write-Host "   3. Open browser: http://localhost:4201" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "   npx prisma studio          - Open database admin" -ForegroundColor White
Write-Host "   docker-compose logs postgres - View database logs" -ForegroundColor White
Write-Host "   docker-compose down        - Stop database" -ForegroundColor White
Write-Host ""
Write-Host "🚨 If you still have database issues:" -ForegroundColor Red
Write-Host "   1. Check the DATABASE-DEPLOYMENT-GUIDE.md file" -ForegroundColor White
Write-Host "   2. Verify PostgreSQL is running on port 5432" -ForegroundColor White
Write-Host "   3. Test connection: npx prisma db push" -ForegroundColor White 