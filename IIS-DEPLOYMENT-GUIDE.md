# CV Converter - IIS Deployment Guide

## 🚀 Quick Deployment (Automated)

### Using the PowerShell Script

1. **Run as Administrator**: Open PowerShell as Administrator
2. **Execute the deployment script**:
   ```powershell
   .\deploy-to-iis.ps1 -SiteName "CVConverter" -SitePath "C:\inetpub\wwwroot\cv-converter" -Port 8080
   ```

This will automatically:

- Build the application for production
- Create IIS site and application pool
- Copy files to IIS directory
- Configure proper permissions
- Start the website

---

## 🔧 Manual Deployment Steps

### Prerequisites

1. **Windows Server/Windows 10/11** with IIS installed
2. **IIS features required**:
   - Static Content
   - Default Document
   - HTTP Redirection
   - URL Rewrite Module (download from Microsoft)

### Step 1: Build the Application

```bash
# Navigate to your project directory
cd C:\Source\cv-converter

# Build for production
nx build cv-converter-web --configuration=production
```

### Step 2: Prepare IIS Directory

1. Create directory: `C:\inetpub\wwwroot\cv-converter`
2. Copy all files from `dist\apps\cv-converter-web\*` to the IIS directory
3. Ensure the `web.config` file is included

### Step 3: Create Application Pool

1. Open **IIS Manager**
2. Right-click **Application Pools** → **Add Application Pool**
3. **Name**: `CVConverterAppPool`
4. **.NET CLR Version**: `No Managed Code` (for static content)
5. **Managed Pipeline Mode**: `Integrated`
6. Click **OK**

### Step 4: Create Website

1. In IIS Manager, right-click **Sites** → **Add Website**
2. **Site Name**: `CV Converter`
3. **Application Pool**: `CVConverterAppPool`
4. **Physical Path**: `C:\inetpub\wwwroot\cv-converter`
5. **Port**: `80` (or your preferred port like `8080`)
6. Click **OK**

### Step 5: Configure Permissions

1. Right-click on `C:\inetpub\wwwroot\cv-converter`
2. **Properties** → **Security** → **Edit**
3. Add permissions for:
   - `IIS_IUSRS`: Read & Execute
   - `IUSR`: Read & Execute

### Step 6: Install URL Rewrite Module (if not installed)

1. Download from: [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Install the module
3. Restart IIS: `iisreset` in Command Prompt (as Administrator)

---

## 🔍 Verification Steps

### Test the Deployment

1. **Open browser** and navigate to: `http://localhost` (or your configured port)
2. **Test routes**:
   - `http://localhost/dashboard/my-cvs`
   - `http://localhost/login`
   - `http://localhost/register`
3. **Verify functionality**:
   - CV creation works
   - Template selection works
   - File upload works
   - Word export works

### Common Issues and Solutions

#### Issue 1: 404 Error on Routes

**Cause**: URL Rewrite not working
**Solution**:

- Ensure URL Rewrite Module is installed
- Check `web.config` is present and correct
- Verify rewrite rules in IIS Manager

#### Issue 2: Static Files Not Loading

**Cause**: MIME types not configured
**Solution**:

- The `web.config` includes MIME type configurations
- Alternatively, add in IIS Manager → MIME Types

#### Issue 3: Permission Denied

**Cause**: Insufficient permissions
**Solution**:

- Check folder permissions for IIS_IUSRS and IUSR
- Ensure Application Pool identity has access

---

## 🛡️ Security Configuration (Production)

### SSL/HTTPS Setup

1. **Obtain SSL Certificate** (Let's Encrypt, commercial, or self-signed for testing)
2. **Bind certificate** in IIS:
   - Right-click website → **Edit Bindings**
   - **Add** → **Type**: `https`, **Port**: `443`
   - Select your SSL certificate
3. **Redirect HTTP to HTTPS**:
   ```xml
   <!-- Add to web.config in <rewrite><rules> -->
   <rule name="Redirect to HTTPS" stopProcessing="true">
     <match url="(.*)" />
     <conditions>
       <add input="{HTTPS}" pattern="off" />
     </conditions>
     <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
   </rule>
   ```

### Additional Security Headers

The provided `web.config` includes security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 🔄 Updating the Application

### For Updates:

1. **Build new version**:

   ```bash
   nx build cv-converter-web --configuration=production
   ```

2. **Stop the website** (optional, for zero-downtime):

   ```powershell
   Stop-Website -Name "CV Converter"
   ```

3. **Copy new files**:

   ```powershell
   Copy-Item "dist\apps\cv-converter-web\*" "C:\inetpub\wwwroot\cv-converter" -Recurse -Force
   ```

4. **Start the website**:
   ```powershell
   Start-Website -Name "CV Converter"
   ```

---

## 📊 Monitoring and Logs

### IIS Logs Location:

```
C:\inetpub\logs\LogFiles\W3SVC[SiteID]\
```

### Application Logs:

- Check **Event Viewer** → **Windows Logs** → **Application**
- Look for IIS-related errors

### Performance Monitoring:

- Use **IIS Manager** → **Worker Processes** to monitor
- Check **Application Pool** health

---

## 🌐 Domain Configuration (Production)

### DNS Setup:

1. Point your domain to the server IP
2. Update **Site Bindings** in IIS to include your domain
3. Configure SSL certificate for your domain

### Firewall:

- Ensure ports 80 and 443 are open
- Configure Windows Firewall or server firewall rules

---

## 📞 Backend API Configuration

**Note**: This deployment only covers the frontend Angular application. You'll need to separately deploy the NestJS backend API to handle:

- CV upload and analysis
- Document generation
- Authentication

Make sure to update the API URLs in your Angular application to point to your production API server.

---

## ✅ Deployment Checklist

- [ ] IIS installed with required features
- [ ] URL Rewrite Module installed
- [ ] Application built for production
- [ ] Files copied to IIS directory
- [ ] Application Pool created
- [ ] Website created and configured
- [ ] Permissions set correctly
- [ ] web.config file in place
- [ ] Website started and accessible
- [ ] All routes working correctly
- [ ] SSL configured (for production)
- [ ] DNS configured (for production)
- [ ] Backend API deployed separately

---

🎉 **Congratulations!** Your CV Converter application is now deployed to IIS!
