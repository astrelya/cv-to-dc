# CV Converter - IIS Deployment Script
# This script helps deploy the Angular application to IIS

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteName = "CVConverter",
    
    [Parameter(Mandatory=$true)]
    [string]$SitePath = "C:\inetpub\wwwroot\cv-converter",
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 80,
    
    [Parameter(Mandatory=$false)]
    [string]$AppPoolName = "CVConverterAppPool"
)

Write-Host "🚀 Starting IIS Deployment for CV Converter" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "❌ This script must be run as Administrator"
    exit 1
}

# Import IIS Module
try {
    Import-Module WebAdministration
    Write-Host "✅ IIS module loaded successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to load IIS module. Make sure IIS is installed with management tools."
    exit 1
}

# Build the application
Write-Host "🔨 Building application for production..." -ForegroundColor Yellow
try {
    & nx build cv-converter-web --configuration=production
    Write-Host "✅ Application built successfully" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to build application"
    exit 1
}

# Create site directory
if (!(Test-Path $SitePath)) {
    Write-Host "📁 Creating site directory: $SitePath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SitePath -Force
}

# Copy built files to IIS directory
Write-Host "📋 Copying application files to IIS directory..." -ForegroundColor Yellow
$sourceFiles = "dist\apps\cv-converter-web\*"
Copy-Item -Path $sourceFiles -Destination $SitePath -Recurse -Force
Write-Host "✅ Files copied successfully" -ForegroundColor Green

# Create Application Pool
if (Get-IISAppPool -Name $AppPoolName -ErrorAction SilentlyContinue) {
    Write-Host "♻️ Removing existing application pool: $AppPoolName" -ForegroundColor Yellow
    Remove-WebAppPool -Name $AppPoolName
}

Write-Host "🏊 Creating application pool: $AppPoolName" -ForegroundColor Yellow
New-WebAppPool -Name $AppPoolName -Force
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
Write-Host "✅ Application pool created successfully" -ForegroundColor Green

# Remove existing site if it exists
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "♻️ Removing existing website: $SiteName" -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

# Create IIS Website
Write-Host "🌐 Creating IIS website: $SiteName" -ForegroundColor Yellow
New-Website -Name $SiteName -PhysicalPath $SitePath -Port $Port -ApplicationPool $AppPoolName
Write-Host "✅ Website created successfully" -ForegroundColor Green

# Set permissions
Write-Host "🔐 Setting permissions..." -ForegroundColor Yellow
$acl = Get-Acl $SitePath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl -Path $SitePath -AclObject $acl
Write-Host "✅ Permissions set successfully" -ForegroundColor Green

# Start Application Pool and Website
Write-Host "▶️ Starting application pool and website..." -ForegroundColor Yellow
Start-WebAppPool -Name $AppPoolName
Start-Website -Name $SiteName
Write-Host "✅ Application pool and website started" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📍 Website URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "📂 Physical Path: $SitePath" -ForegroundColor Cyan
Write-Host "🏊 Application Pool: $AppPoolName" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test the application by visiting: http://localhost:$Port" -ForegroundColor White
Write-Host "   2. Configure SSL certificate if needed" -ForegroundColor White
Write-Host "   3. Update DNS records if deploying to production" -ForegroundColor White
Write-Host "   4. Configure firewall rules if needed" -ForegroundColor White 