# CV Converter - Complete Production Deployment
# Customized for your PostgreSQL setup: postgres:admin@localhost:5432

param(
    [string]$FrontendSitePath = "C:\inetpub\wwwroot\cv-converter",
    [string]$BackendSitePath = "C:\inetpub\wwwroot\cv-converter-api",
    [string]$FrontendSiteName = "CVConverter",
    [string]$BackendSiteName = "CVConverterAPI",
    [int]$FrontendPort = 8082,
    [int]$BackendPort = 3000
)

Write-Host "🚀 CV Converter - Complete Production Deployment" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Your specific database configuration
$DatabaseUrl = "postgresql://postgres:admin@localhost:5432/cv_converter_db"

Write-Host "📋 Your Configuration:" -ForegroundColor Yellow
Write-Host "   🗄️ Database: cv_converter_db" -ForegroundColor Cyan
Write-Host "   👤 DB User: postgres" -ForegroundColor Cyan
Write-Host "   🌐 Frontend Port: $FrontendPort" -ForegroundColor Cyan
Write-Host "   🔌 Backend Port: $BackendPort" -ForegroundColor Cyan
Write-Host ""

# Deploy Frontend (Angular)
Write-Host "🎯 Step 1: Deploying Frontend..." -ForegroundColor Green
try {
    & .\deploy-to-iis.ps1 -SiteName $FrontendSiteName -SitePath $FrontendSitePath -Port $FrontendPort
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
} catch {
    Write-Error "❌ Frontend deployment failed"
}

# Deploy Backend (NestJS API)  
Write-Host "🎯 Step 2: Deploying Backend API..." -ForegroundColor Green
try {
    & .\backend-deploy.ps1 -SitePath $BackendSitePath -SiteName $BackendSiteName -Port $BackendPort -DatabaseUrl $DatabaseUrl
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
} catch {
    Write-Error "❌ Backend deployment failed"
}

Write-Host ""
Write-Host "🎉 Complete Deployment Finished!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Your Application URLs:" -ForegroundColor Yellow
Write-Host "   🌐 Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "   🔌 Backend API: http://localhost:$BackendPort/api" -ForegroundColor Cyan
Write-Host "   📚 API Documentation: http://localhost:$BackendPort/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "   2. Test backend: http://localhost:$BackendPort/api" -ForegroundColor White
Write-Host "   3. Create test user and CV" -ForegroundColor White
Write-Host "   4. Configure domain/SSL for production" -ForegroundColor White 