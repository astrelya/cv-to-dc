# Configure CV Converter for External Access
# This script configures the application to be accessible from other computers

param(
    [int]$BackendPort = 3000,
    [int]$FrontendPort = 8082,
    [string]$ServerIP = ""
)

Write-Host "🌐 Configuring CV Converter for External Access" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Get server IP address automatically if not provided
if ([string]::IsNullOrEmpty($ServerIP)) {
    Write-Host "🔍 Detecting server IP address..." -ForegroundColor Yellow
    
    # Get primary network adapter IP
    $networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.*" -and
        $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
    }
    
    if ($networkAdapters.Count -gt 0) {
        $ServerIP = $networkAdapters[0].IPAddress
        Write-Host "✅ Detected server IP: $ServerIP" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Could not detect IP automatically. Using localhost." -ForegroundColor Yellow
        $ServerIP = "localhost"
    }
} else {
    Write-Host "📍 Using provided server IP: $ServerIP" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   🖥️ Server IP: $ServerIP" -ForegroundColor Cyan
Write-Host "   🔌 Backend Port: $BackendPort" -ForegroundColor Cyan
Write-Host "   🌐 Frontend Port: $FrontendPort" -ForegroundColor Cyan
Write-Host ""

# Update backend environment for external access
Write-Host "⚙️ Configuring backend for external access..." -ForegroundColor Yellow
$backendEnvPath = "apps\cv-converter-api\.env"

# Read current .env content
$envContent = Get-Content $backendEnvPath -Raw

# Update or add HOST configuration
if ($envContent -match "HOST=") {
    $envContent = $envContent -replace "HOST=.*", "HOST=0.0.0.0"
} else {
    $envContent += "`nHOST=0.0.0.0"
}

# Update CORS origins to include the server IP
$corsOrigins = "http://localhost:4200,http://localhost:4201,http://localhost:8080,http://localhost:8082,http://${ServerIP}:${FrontendPort}"
if ($envContent -match "CORS_ORIGINS=") {
    $envContent = $envContent -replace "CORS_ORIGINS=.*", "CORS_ORIGINS=$corsOrigins"
} else {
    $envContent += "`nCORS_ORIGINS=$corsOrigins"
}

# Write updated content back
$envContent | Out-File -FilePath $backendEnvPath -Encoding UTF8 -NoNewline
Write-Host "✅ Backend environment updated" -ForegroundColor Green

# Create frontend environment configuration
Write-Host "⚙️ Creating frontend environment configuration..." -ForegroundColor Yellow

# Check if environment files exist
$frontendEnvDir = "apps\cv-converter-web\src\environments"
if (!(Test-Path $frontendEnvDir)) {
    New-Item -ItemType Directory -Path $frontendEnvDir -Force
}

# Create environment.ts for development
$envDevContent = @"
export const environment = {
  production: false,
  apiUrl: 'http://${ServerIP}:${BackendPort}/api',
  apiBaseUrl: 'http://${ServerIP}:${BackendPort}'
};
"@
$envDevContent | Out-File -FilePath "$frontendEnvDir\environment.ts" -Encoding UTF8

# Create environment.prod.ts for production
$envProdContent = @"
export const environment = {
  production: true,
  apiUrl: 'http://${ServerIP}:${BackendPort}/api',
  apiBaseUrl: 'http://${ServerIP}:${BackendPort}'
};
"@
$envProdContent | Out-File -FilePath "$frontendEnvDir\environment.prod.ts" -Encoding UTF8

Write-Host "✅ Frontend environment files created" -ForegroundColor Green

# Update Angular services to use environment configuration
Write-Host "⚙️ Updating Angular services..." -ForegroundColor Yellow

# Update auth.service.ts
$authServicePath = "apps\cv-converter-web\src\app\services\auth.service.ts"
if (Test-Path $authServicePath) {
    $authContent = Get-Content $authServicePath -Raw
    
    # Add environment import if not present
    if ($authContent -notmatch "import.*environment") {
        $authContent = $authContent -replace "(import.*@angular/common/http';)", "`$1`nimport { environment } from '../../environments/environment';"
    }
    
    # Replace hardcoded API URL
    $authContent = $authContent -replace "private apiUrl = 'http://localhost:3000/api';", "private apiUrl = environment.apiUrl;"
    
    $authContent | Out-File -FilePath $authServicePath -Encoding UTF8 -NoNewline
    Write-Host "✅ Auth service updated" -ForegroundColor Green
}

# Update cv.service.ts
$cvServicePath = "apps\cv-converter-web\src\app\services\cv.service.ts"
if (Test-Path $cvServicePath) {
    $cvContent = Get-Content $cvServicePath -Raw
    
    # Add environment import if not present
    if ($cvContent -notmatch "import.*environment") {
        $cvContent = $cvContent -replace "(import.*@angular/common/http';)", "`$1`nimport { environment } from '../../environments/environment';"
    }
    
    # Replace hardcoded API URL
    $cvContent = $cvContent -replace "private apiUrl = 'http://localhost:3000/api/cv';", "private apiUrl = environment.apiUrl + '/cv';"
    
    $cvContent | Out-File -FilePath $cvServicePath -Encoding UTF8 -NoNewline
    Write-Host "✅ CV service updated" -ForegroundColor Green
}

# Update components with hardcoded fetch URLs
$componentsToUpdate = @(
    "apps\cv-converter-web\src\app\components\cv-upload\cv-upload.component.ts",
    "apps\cv-converter-web\src\app\components\my-cvs\my-cvs.component.ts"
)

foreach ($componentPath in $componentsToUpdate) {
    if (Test-Path $componentPath) {
        $componentContent = Get-Content $componentPath -Raw
        
        # Add environment import if not present
        if ($componentContent -notmatch "import.*environment") {
            $componentContent = $componentContent -replace "(import.*@angular/core';)", "`$1`nimport { environment } from '../../../environments/environment';"
        }
        
        # Replace hardcoded localhost URLs
        $componentContent = $componentContent -replace "http://localhost:3000/api", "environment.apiUrl"
        
        $componentContent | Out-File -FilePath $componentPath -Encoding UTF8 -NoNewline
    }
}
Write-Host "✅ Components updated" -ForegroundColor Green

# Build applications
Write-Host "🔨 Building applications..." -ForegroundColor Yellow
& nx build cv-converter-api --configuration=production
& nx build cv-converter-web --configuration=production

# Deploy updated files
Write-Host "📦 Deploying updated files..." -ForegroundColor Yellow

# Deploy backend
if (Test-Path "C:\inetpub\wwwroot\cv-converter-api") {
    Copy-Item "dist\apps\cv-converter-api\*" "C:\inetpub\wwwroot\cv-converter-api" -Recurse -Force
    Copy-Item "apps\cv-converter-api\.env" "C:\inetpub\wwwroot\cv-converter-api\.env" -Force
    Copy-Item "apps\cv-converter-api\prisma" "C:\inetpub\wwwroot\cv-converter-api\prisma" -Recurse -Force
    Copy-Item "apps\cv-converter-api\generated" "C:\inetpub\wwwroot\cv-converter-api\generated" -Recurse -Force
    Write-Host "✅ Backend deployed" -ForegroundColor Green
}

# Deploy frontend
if (Test-Path "C:\inetpub\wwwroot\cv-converter") {
    Copy-Item "dist\apps\cv-converter-web\*" "C:\inetpub\wwwroot\cv-converter" -Recurse -Force
    Write-Host "✅ Frontend deployed" -ForegroundColor Green
}

# Restart PM2 process
try {
    pm2 restart cv-converter-api --update-env
    Write-Host "✅ Backend service restarted" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not restart PM2 process. You may need to restart manually." -ForegroundColor Yellow
}

# Check Windows Firewall
Write-Host "🔥 Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRules = @()

try {
    $backendRule = Get-NetFirewallRule -DisplayName "*$BackendPort*" -ErrorAction SilentlyContinue
    if (!$backendRule) {
        Write-Host "⚠️ Creating firewall rule for backend port $BackendPort..." -ForegroundColor Yellow
        New-NetFirewallRule -DisplayName "CV Converter API" -Direction Inbound -Protocol TCP -LocalPort $BackendPort -Action Allow
        $firewallRules += "Backend ($BackendPort)"
    }
    
    $frontendRule = Get-NetFirewallRule -DisplayName "*$FrontendPort*" -ErrorAction SilentlyContinue
    if (!$frontendRule) {
        Write-Host "⚠️ Creating firewall rule for frontend port $FrontendPort..." -ForegroundColor Yellow
        New-NetFirewallRule -DisplayName "CV Converter Frontend" -Direction Inbound -Protocol TCP -LocalPort $FrontendPort -Action Allow
        $firewallRules += "Frontend ($FrontendPort)"
    }
    
    if ($firewallRules.Count -gt 0) {
        Write-Host "✅ Firewall rules created for: $($firewallRules -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "✅ Firewall rules already exist" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not configure firewall automatically. You may need to configure manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 External Access Configuration Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access URLs:" -ForegroundColor Yellow
Write-Host "   🌐 Frontend (Local): http://localhost:${FrontendPort}" -ForegroundColor Cyan
Write-Host "   🌐 Frontend (External): http://${ServerIP}:${FrontendPort}" -ForegroundColor Cyan
Write-Host "   🔌 Backend API (Local): http://localhost:${BackendPort}/api" -ForegroundColor Cyan
Write-Host "   🔌 Backend API (External): http://${ServerIP}:${BackendPort}/api" -ForegroundColor Cyan
Write-Host "   📚 API Documentation: http://${ServerIP}:${BackendPort}/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test local access first" -ForegroundColor White
Write-Host "   2. Test external access from another computer" -ForegroundColor White
Write-Host "   3. Share the external URLs with other users" -ForegroundColor White
Write-Host "   4. Consider setting up domain names for production" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   • If external access fails, check your router/network configuration" -ForegroundColor White
Write-Host "   • Ensure both computers are on the same network" -ForegroundColor White
Write-Host "   • Check if corporate firewall is blocking the ports" -ForegroundColor White
Write-Host "   • Try disabling Windows Firewall temporarily for testing" -ForegroundColor White 