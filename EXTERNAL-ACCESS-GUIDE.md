# CV Converter - External Access Setup Guide

## 🎉 **External Access Successfully Configured!**

Your CV Converter application is now configured for external access from other computers.

---

## 📍 **Your Access URLs**

### **Local Access (Same Computer):**

- 🌐 **Frontend:** `http://localhost:8082`
- 🔌 **Backend API:** `http://localhost:3000/api`
- 📚 **API Documentation:** `http://localhost:3000/api/docs`

### **External Access (Other Computers):**

- 🌐 **Frontend:** `http://217.154.18.8:8082`
- 🔌 **Backend API:** `http://217.154.18.8:3000/api`
- 📚 **API Documentation:** `http://217.154.18.8:3000/api/docs`

---

## ✅ **What Was Configured**

### 1. **Backend API Changes**

- ✅ **Bind to all interfaces:** Server now listens on `0.0.0.0:3000` instead of `localhost:3000`
- ✅ **CORS configuration:** Allows requests from external IP addresses
- ✅ **Environment variables:** Added `HOST=0.0.0.0` for external binding
- ✅ **Flexible CORS origins:** Supports both localhost and IP-based access

### 2. **Frontend Configuration**

- ✅ **Environment files:** Created `environment.ts` and `environment.prod.ts`
- ✅ **API URL configuration:** Points to your server IP `217.154.18.8:3000`
- ✅ **Service updates:** All Angular services use environment configuration
- ✅ **Component updates:** Hardcoded URLs replaced with environment variables

### 3. **Network & Security**

- ✅ **Windows Firewall:** Added rules for ports 3000 and 8082
- ✅ **PM2 restart:** Backend service restarted with new configuration
- ✅ **IIS deployment:** Both frontend and backend deployed with new settings

---

## 🚀 **How to Test External Access**

### **Step 1: Test Local Access First**

1. Open browser on the **server computer**
2. Navigate to: `http://localhost:8082`
3. Try logging in to verify everything works locally

### **Step 2: Test External Access**

1. On **another computer** on the same network
2. Navigate to: `http://217.154.18.8:8082`
3. Try logging in to verify external access works

### **Step 3: Share with Other Users**

- Give other users the external URL: `http://217.154.18.8:8082`
- They can access the application from anywhere on your network

---

## 🔧 **Troubleshooting External Access Issues**

### **Issue 1: "ERR_CONNECTION_REFUSED" from External Computer**

**Possible Causes:**

- Server not listening on external interfaces
- Windows Firewall blocking connections
- Router/network firewall blocking ports
- Incorrect IP address

**Solutions:**

```powershell
# Check if backend is listening on all interfaces
netstat -an | findstr :3000

# Test backend API directly
curl http://217.154.18.8:3000/api

# Check Windows Firewall rules
Get-NetFirewallRule -DisplayName "*CV Converter*"

# Restart backend service
pm2 restart cv-converter-api --update-env
```

### **Issue 2: CORS Errors from External Computer**

**Cause:** CORS not configured for external IP
**Solution:** The configuration script already handled this, but if issues persist:

```powershell
# Check backend logs
pm2 logs cv-converter-api

# Update CORS origins manually if needed
# Edit apps\cv-converter-api\.env and add your IP to CORS_ORIGINS
```

### **Issue 3: Can't Access from Specific Computer**

**Possible Causes:**

- Corporate firewall blocking the ports
- Different network subnet
- Antivirus software blocking connections

**Solutions:**

- Try from a different device on the same network
- Temporarily disable Windows Firewall for testing
- Check if both computers are on the same network subnet

### **Issue 4: Router/Network Configuration**

If external access works within your local network but not from the internet:

**For Local Network Access Only (Recommended):**

- No additional configuration needed
- Users must be on the same local network (WiFi/Ethernet)

**For Internet Access (Advanced):**

```
1. Configure router port forwarding:
   - Forward external port 8082 → 217.154.18.8:8082
   - Forward external port 3000 → 217.154.18.8:3000

2. Update CORS configuration to include your public IP

3. Consider security implications (authentication, SSL, etc.)
```

---

## 🔒 **Security Considerations**

### **Current Security Status:**

- ✅ **Local network access:** Secure for internal use
- ⚠️ **Internet access:** Not recommended without additional security
- ✅ **JWT authentication:** Users must log in
- ✅ **CORS protection:** Only allowed origins can access API

### **For Production Internet Access:**

1. **Set up SSL/HTTPS** with valid certificates
2. **Configure proper domain names** instead of IP addresses
3. **Implement rate limiting** to prevent abuse
4. **Set up proper logging and monitoring**
5. **Review and strengthen authentication**

---

## 📊 **Network Information**

### **Your Server Configuration:**

- **Server IP:** `217.154.18.8`
- **Frontend Port:** `8082`
- **Backend Port:** `3000`
- **Firewall:** Configured for both ports
- **Binding:** All network interfaces (`0.0.0.0`)

### **Service Status:**

```powershell
# Check backend service
pm2 status

# Check frontend in IIS
Get-Website -Name "CVConverter"

# Check firewall rules
Get-NetFirewallRule -DisplayName "*CV Converter*"
```

---

## 🛠️ **Maintenance Commands**

### **Restart Services:**

```powershell
# Restart backend API
pm2 restart cv-converter-api --update-env

# Restart IIS website
Restart-Website -Name "CVConverter"
```

### **Update Configuration:**

```powershell
# Re-run configuration for different IP
.\configure-external-access.ps1 -ServerIP "YOUR_NEW_IP"

# Manual environment update
# Edit: apps\cv-converter-api\.env
# Edit: apps\cv-converter-web\src\environments\environment.ts
```

### **Check Connectivity:**

```powershell
# Test backend API
curl http://217.154.18.8:3000/api

# Test with CORS headers
curl http://217.154.18.8:3000/api -H "Origin: http://217.154.18.8:8082"

# Check listening ports
netstat -an | findstr ":3000\|:8082"
```

---

## 📞 **Getting Help**

If you encounter issues:

1. **Check the logs:**

   ```powershell
   pm2 logs cv-converter-api
   ```

2. **Verify network connectivity:**

   ```powershell
   ping 217.154.18.8
   telnet 217.154.18.8 3000
   ```

3. **Test step by step:**

   - Local access first
   - API endpoints directly
   - External access from another device

4. **Common solutions:**
   - Restart services
   - Check firewall settings
   - Verify both computers are on same network
   - Try different browsers/devices

---

🎯 **Your CV Converter application is now accessible from other computers on your network!**

**Share this URL with your users:** `http://217.154.18.8:8082`
