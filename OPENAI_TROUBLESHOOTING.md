# 🚨 OpenAI Quota Error Fix Guide

## Error: "429 You exceeded your current quota"

This error means your OpenAI API key has reached its usage limit. Here's how to fix it:

## 🔍 **Step 1: Check Your OpenAI Account**

1. **Login to OpenAI Platform**: [https://platform.openai.com/](https://platform.openai.com/)
2. **Go to Billing**: Click your profile → "Billing"
3. **Check Usage**: View your current usage and limits
4. **Check Credits**: See if you have remaining credits

## 💳 **Step 2: Add Credits (If Needed)**

### **For New Accounts:**

- New accounts get **$5 free credits** that expire after 3 months
- If expired or used up, you need to add payment method

### **Add Payment Method:**

1. Go to **Billing** → **Payment methods**
2. Click **"Add payment method"**
3. Add your credit card details
4. Set up **auto-recharge** (recommended: $20 minimum)

### **Buy Credits:**

1. Go to **Billing** → **Credits**
2. Click **"Add credits"**
3. Purchase credits (minimum $5, recommended $20-50)

## 🔑 **Step 3: Verify API Key**

1. **Check API Key Status**:

   - Go to **API Keys** section
   - Ensure your key is active (not revoked)
   - Check the key permissions

2. **Test API Key**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## ⚙️ **Step 4: Update Environment Variables**

Make sure your API key is correctly set:

```bash
# apps/cv-converter-api/.env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important**: Restart your backend after updating the API key:

```bash
# Stop the backend (Ctrl+C) then restart:
nx serve cv-converter-api
```

## 📊 **Step 5: Monitor Usage**

### **Check Current Usage:**

1. OpenAI Dashboard → **Usage**
2. View daily/monthly consumption
3. Set up usage alerts

### **Typical Costs:**

- **GPT-4 Vision**: ~$0.01-0.03 per CV
- **Monthly estimate**: $5-20 for moderate usage (100-500 CVs)

## 🛠️ **Alternative Solutions**

### **Option 1: Use Mock Data (For Testing)**

Update the OpenAI service to return mock data when no API key:

```typescript
// In apps/cv-converter-api/src/openai/openai.service.ts
async processCV(fileBuffer: Buffer, mimeType: string): Promise<CVOCRResult> {
  if (!this.openai) {
    // Return mock data for testing
    return {
      personalInfo: {
        fullName: "John Doe (Demo)",
        email: "demo@example.com",
        phone: "+1-555-0123"
      },
      professionalSummary: "This is a demo extraction since no OpenAI API key is configured.",
      workExperience: [{
        jobTitle: "Software Engineer",
        company: "Demo Company",
        duration: "2020-2023",
        responsibilities: ["Demo responsibility 1", "Demo responsibility 2"]
      }],
      education: [],
      skills: {
        technical: ["JavaScript", "Python", "React"],
        languages: ["English"],
        soft: ["Communication"],
        tools: ["VS Code", "Git"]
      },
      certifications: [],
      projects: [],
      languages: [],
      extractedText: "This is mock extracted text for demonstration purposes.",
      confidence: 85,
      processingNotes: ["Demo mode - Add OpenAI API key for real OCR processing"]
    };
  }

  // ... rest of the existing code
}
```

### **Option 2: Reduce API Costs**

Modify the service to use GPT-3.5 (cheaper) for text-only processing:

```typescript
// Use gpt-3.5-turbo instead of gpt-4o for text files
const model = mimeType.startsWith('image/') ? 'gpt-4o' : 'gpt-3.5-turbo';
```

### **Option 3: Add Rate Limiting**

Implement rate limiting to prevent excessive API calls:

```typescript
// Add to OpenAI service
private lastRequestTime = 0;
private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

async processCV(fileBuffer: Buffer, mimeType: string): Promise<CVOCRResult> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - this.lastRequestTime;

  if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  this.lastRequestTime = Date.now();

  // ... rest of the processing
}
```

## ✅ **Quick Fix Checklist**

1. ☐ **Check OpenAI billing** - Add payment method if needed
2. ☐ **Buy credits** - Minimum $5, recommended $20+
3. ☐ **Verify API key** - Test with curl command
4. ☐ **Update .env file** - Ensure correct API key
5. ☐ **Restart backend** - Stop and start the API server
6. ☐ **Test upload** - Try uploading a CV again
7. ☐ **Monitor usage** - Set up billing alerts

## 🎯 **Expected Resolution**

After adding credits and updating your API key:

- ✅ CV uploads should process successfully
- ✅ OCR results will display properly
- ✅ No more 429 errors
- ✅ Confidence scoring will work

## 📞 **Still Having Issues?**

If the problem persists:

1. **Check OpenAI Status**: [status.openai.com](https://status.openai.com)
2. **Contact OpenAI Support**: Through the platform dashboard
3. **Use Mock Mode**: Implement the mock data solution above for testing

---

**The most common solution is simply adding credits to your OpenAI account!**
