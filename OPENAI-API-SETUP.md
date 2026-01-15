# OpenAI API Key Setup Guide

## 🚨 **Current Issue**

Your CV upload is failing with this error:

```
OpenAI API key not configured. Please add your OpenAI API key to the environment variables to enable CV processing.
```

## 🔑 **Solution: Configure OpenAI API Key**

### **Step 1: Get Your OpenAI API Key**

1. **Go to OpenAI Platform:** https://platform.openai.com
2. **Sign in** to your OpenAI account (or create one)
3. **Navigate to API Keys:** https://platform.openai.com/api-keys
4. **Create a new secret key:**
   - Click "Create new secret key"
   - Name it "CV Converter Production"
   - Copy the key (starts with `sk-...`)
   - **⚠️ Important:** Save this key securely - you won't be able to see it again!

### **Step 2: Add API Key to Environment Files**

#### **For Local Development:**

```powershell
# Navigate to API directory
cd apps/cv-converter-api

# Edit .env file
notepad .env
```

**Replace this line:**

```
OPENAI_API_KEY=your-openai-api-key-here
```

**With your actual key:**

```
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

#### **For Production Deployment:**

```powershell
# Update production environment
notepad C:\inetpub\wwwroot\cv-converter-api\.env
```

**Add the same OpenAI API key to the production .env file.**

### **Step 3: Apply Configuration**

#### **Method A: Automated Update (Recommended)**

```powershell
# Run the update script
.\update-openai-config.ps1 -ApiKey "sk-your-actual-key-here"
```

#### **Method B: Manual Update**

```powershell
# 1. Update local environment
cd apps/cv-converter-api
# Edit .env and add your key

# 2. Copy to production
Copy-Item .env C:\inetpub\wwwroot\cv-converter-api\.env -Force

# 3. Restart backend service
pm2 restart cv-converter-api --update-env

# 4. Test the configuration
curl http://localhost:3000/api -H "Origin: http://localhost:8082"
```

---

## 🔧 **Complete Environment Configuration**

Your `.env` file should contain:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:admin@localhost:5432/cv_converter_db"

# Application Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=dev-secret-key-change-in-production-32chars+

# API Keys
OPENAI_API_KEY=sk-your-actual-openai-key-here

# CORS Configuration
CORS_ORIGINS=http://localhost:4200,http://localhost:4201,http://localhost:8080,http://localhost:8082,http://217.154.18.8:8082
```

---

## 🌍 **Environment-Specific Configuration**

### **Local Development (.env)**

```env
NODE_ENV=development
OPENAI_API_KEY=sk-your-openai-key-here
DATABASE_URL="postgresql://postgres:admin@localhost:5432/cv_converter_db"
```

### **Production (.env)**

```env
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key-here
DATABASE_URL="postgresql://postgres:admin@localhost:5432/cv_converter_db"
JWT_SECRET=your-strong-production-jwt-secret-32chars-minimum
```

---

## 💰 **OpenAI API Costs & Limits**

### **Typical Usage for CV Processing:**

- **Per CV upload:** ~$0.01 - $0.05 (depending on CV length)
- **Monthly limit:** Set usage limits in OpenAI dashboard
- **Recommended:** Start with $20-50 monthly limit

### **Cost Optimization:**

1. **Set usage limits** in OpenAI dashboard
2. **Monitor usage** regularly
3. **Consider caching** processed CVs to avoid re-processing

---

## 🧪 **Testing Your Configuration**

### **Test 1: API Endpoint**

```powershell
curl http://217.154.18.8:3000/api
# Should return: {"message":"Hello API"}
```

### **Test 2: CV Upload**

1. Go to: `http://217.154.18.8:8082`
2. Navigate to "My CVs"
3. Click "📎 Importer CV"
4. Upload a test CV file
5. Should work without "OpenAI API key not configured" error

### **Test 3: Check Logs**

```powershell
pm2 logs cv-converter-api --lines 10
# Should not show OpenAI API key errors
```

---

## 🔒 **Security Best Practices**

### **For Production:**

1. **Use a dedicated API key** for production
2. **Set usage limits** to prevent unexpected costs
3. **Monitor API usage** regularly
4. **Rotate keys** periodically (every 3-6 months)
5. **Never commit keys** to version control

### **Environment Variables Security:**

```powershell
# Check file permissions
Get-Acl C:\inetpub\wwwroot\cv-converter-api\.env

# Ensure only necessary users can read the .env file
```

---

## 🚨 **Troubleshooting**

### **Error: "OpenAI API key not configured"**

**Solution:**

1. Verify `.env` file has `OPENAI_API_KEY=sk-...`
2. Restart backend: `pm2 restart cv-converter-api --update-env`
3. Check logs: `pm2 logs cv-converter-api`

### **Error: "Invalid API key"**

**Solution:**

1. Verify key starts with `sk-` and is complete
2. Check key hasn't expired in OpenAI dashboard
3. Regenerate key if necessary

### **Error: "Rate limit exceeded"**

**Solution:**

1. Check usage in OpenAI dashboard
2. Increase rate limits or wait for reset
3. Consider implementing request caching

### **CV Upload Still Fails**

**Diagnostic steps:**

```powershell
# 1. Check environment variables are loaded
pm2 show cv-converter-api

# 2. Check recent logs
pm2 logs cv-converter-api --lines 50

# 3. Test API directly
curl -X POST http://217.154.18.8:3000/api/cv/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test CV"
```

---

## ✅ **Verification Checklist**

- [ ] OpenAI API key obtained from platform.openai.com
- [ ] Key added to local `.env` file
- [ ] Key added to production `.env` file
- [ ] Backend service restarted with `--update-env`
- [ ] API endpoint responding without key errors
- [ ] CV upload works without OpenAI errors
- [ ] Usage limits set in OpenAI dashboard
- [ ] Costs monitored and acceptable

---

## 📞 **Quick Fix Commands**

```powershell
# Update API key in all environments
$apiKey = "sk-your-actual-key-here"

# Local environment
(Get-Content apps/cv-converter-api/.env) -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$apiKey" | Set-Content apps/cv-converter-api/.env

# Production environment
Copy-Item apps/cv-converter-api/.env C:\inetpub\wwwroot\cv-converter-api\.env -Force

# Restart service
pm2 restart cv-converter-api --update-env

# Test
curl http://217.154.18.8:8082
```

---

🎯 **Once configured, your CV upload feature will work perfectly across all environments!**

**Your OpenAI API key will be the same for local, dev, and production** - just make sure it's properly set in all `.env` files.
