# Database Deployment Fix Guide

## 🚨 **Common Database Deployment Issues**

Your CV Converter application uses **PostgreSQL** with **Prisma ORM**. Here are the most common deployment issues and their solutions:

---

## 🔧 **Step 1: Environment Configuration**

### Create Production Environment File

Create `apps/cv-converter-api/.env` with your production values:

```env
# Database Configuration (CRITICAL - Update with your production database)
DATABASE_URL="postgresql://username:password@your-db-server:5432/cv_converter_db?schema=public"

# Application Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration (Generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars+

# CORS Origins (Update with your domain)
CORS_ORIGINS=http://your-domain.com,https://your-domain.com
```

### Example Production Database URLs:

**Local PostgreSQL:**

```env
DATABASE_URL="postgresql://cv_user:secure_password@localhost:5432/cv_converter_prod?schema=public"
```

**Cloud PostgreSQL (Azure, AWS, etc.):**

```env
DATABASE_URL="postgresql://username:password@your-db-server.postgres.database.azure.com:5432/cv_converter_db?schema=public&sslmode=require"
```

**Docker PostgreSQL:**

```env
DATABASE_URL="postgresql://cv_user:password@postgres-container:5432/cv_converter_db?schema=public"
```

---

## 🗄️ **Step 2: Database Setup**

### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL** on your server:

   ```bash
   # Windows (using Chocolatey)
   choco install postgresql

   # Or download from: https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User:**

   ```sql
   -- Connect to PostgreSQL as admin
   psql -U postgres

   -- Create database
   CREATE DATABASE cv_converter_db;

   -- Create user
   CREATE USER cv_user WITH PASSWORD 'your_secure_password';

   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE cv_converter_db TO cv_user;
   GRANT ALL ON SCHEMA public TO cv_user;

   -- Exit
   \q
   ```

### Option B: Docker PostgreSQL (Recommended)

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: cv-converter-postgres
    environment:
      POSTGRES_DB: cv_converter_db
      POSTGRES_USER: cv_user
      POSTGRES_PASSWORD: secure_password123
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Start the database:

```bash
docker-compose up -d
```

---

## 🔄 **Step 3: Database Migration & Setup**

### Run Database Migrations

```bash
# Navigate to the API directory
cd apps/cv-converter-api

# Generate Prisma client
npx prisma generate

# Run database migrations (creates tables)
npx prisma migrate deploy

# Verify database connection
npx prisma db push
```

### Alternative: Reset and Fresh Migration

```bash
# If you need a clean start
npx prisma migrate reset --force
npx prisma migrate dev --name init
```

---

## 🚀 **Step 4: Backend API Deployment**

### Option A: IIS with Node.js

1. **Install Node.js** on your IIS server
2. **Install IISNode** module for IIS
3. **Create Backend Deployment Script:**

```powershell
# backend-deploy.ps1
param(
    [string]$SitePath = "C:\inetpub\wwwroot\cv-converter-api",
    [string]$SiteName = "CVConverterAPI",
    [int]$Port = 3000
)

Write-Host "🚀 Deploying CV Converter API to IIS" -ForegroundColor Green

# Build the API
Write-Host "🔨 Building API..." -ForegroundColor Yellow
nx build cv-converter-api --configuration=production

# Create API directory
if (!(Test-Path $SitePath)) {
    New-Item -ItemType Directory -Path $SitePath -Force
}

# Copy API files
Copy-Item -Path "dist\apps\cv-converter-api\*" -Destination $SitePath -Recurse -Force
Copy-Item -Path "apps\cv-converter-api\.env" -Destination $SitePath -Force
Copy-Item -Path "apps\cv-converter-api\prisma" -Destination $SitePath -Recurse -Force
Copy-Item -Path "apps\cv-converter-api\generated" -Destination $SitePath -Recurse -Force

# Install dependencies
Set-Location $SitePath
npm install --production

# Run database migrations
npx prisma migrate deploy
npx prisma generate

Write-Host "✅ API deployed successfully!" -ForegroundColor Green
```

### Option B: PM2 Process Manager (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build the API
nx build cv-converter-api --configuration=production

# Copy necessary files
cp -r apps/cv-converter-api/.env dist/apps/cv-converter-api/
cp -r apps/cv-converter-api/prisma dist/apps/cv-converter-api/
cp -r apps/cv-converter-api/generated dist/apps/cv-converter-api/

# Navigate to build directory
cd dist/apps/cv-converter-api

# Install production dependencies
npm install --production

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start with PM2
pm2 start main.js --name "cv-converter-api" --env production

# Make PM2 startup on boot
pm2 startup
pm2 save
```

---

## 🔧 **Step 5: Update Frontend API Configuration**

Update your Angular application to point to the production API:

1. **Update `apps/cv-converter-web/src/environments/environment.prod.ts`:**

```typescript
export const environment = {
  production: true,
  apiUrl: 'http://your-domain.com:3000/api', // Update with your API URL
  apiBaseUrl: 'http://your-domain.com:3000',
};
```

2. **Or create environment-specific builds:**

```bash
# Build with production API URL
ng build --configuration=production --base-href="/"
```

---

## 🔍 **Step 6: Testing & Verification**

### Test Database Connection

```bash
# Test connection
npx prisma db push

# View data
npx prisma studio
```

### Test API Endpoints

1. **Health Check:**

   ```
   GET http://your-api-server:3000/api
   ```

2. **Swagger Documentation:**

   ```
   GET http://your-api-server:3000/api/docs
   ```

3. **Test User Creation:**
   ```bash
   curl -X POST http://your-api-server:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "name": "Test User", "password": "password123"}'
   ```

---

## 🚨 **Common Issues & Solutions**

### Issue 1: "Database connection failed"

**Cause:** Wrong DATABASE_URL or database not accessible
**Solution:**

- Verify DATABASE_URL format
- Check database server is running
- Test connection: `npx prisma db push`

### Issue 2: "Table doesn't exist"

**Cause:** Migrations not run
**Solution:**

```bash
npx prisma migrate deploy
npx prisma db push
```

### Issue 3: "Permission denied"

**Cause:** Database user lacks permissions
**Solution:**

```sql
GRANT ALL PRIVILEGES ON DATABASE cv_converter_db TO cv_user;
GRANT ALL ON SCHEMA public TO cv_user;
```

### Issue 4: "SSL connection error"

**Cause:** Cloud database requires SSL
**Solution:** Add `?sslmode=require` to DATABASE_URL

### Issue 5: "Port already in use"

**Cause:** Another service using port 3000
**Solution:** Change PORT in .env file

---

## 📋 **Deployment Checklist**

- [ ] PostgreSQL database installed and running
- [ ] Database and user created
- [ ] `.env` file configured with production values
- [ ] Database migrations run successfully
- [ ] Prisma client generated
- [ ] Backend API deployed and running
- [ ] Frontend updated with production API URL
- [ ] API endpoints accessible
- [ ] Database connection working
- [ ] CORS configured correctly

---

## 🔒 **Security Recommendations**

1. **Use strong passwords** for database users
2. **Generate secure JWT_SECRET** (32+ characters)
3. **Enable SSL** for database connections in production
4. **Restrict database access** to specific IPs
5. **Use environment variables** for all sensitive data
6. **Enable database backups**
7. **Monitor database logs**

---

## 📞 **Quick Fix Commands**

If you're still having issues, run these commands in order:

```bash
# 1. Set environment variable (Windows)
set DATABASE_URL=postgresql://username:password@localhost:5432/cv_converter_db?schema=public

# 2. Navigate to API directory
cd apps/cv-converter-api

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Test connection
npx prisma db push

# 6. Build and start API
nx build cv-converter-api
node dist/apps/cv-converter-api/main.js
```

Let me know if you need help with any specific step! 🚀
