# Deployment Guide - Vercel Image Converter API

Hướng dẫn deploy API lên Vercel từng bước một.

## 🎯 Tổng Quan

API này chạy trên Vercel Serverless Functions với:
- **Runtime**: Node.js 18.x
- **Region**: San Francisco (sfo1) - có thể thay đổi
- **Memory**: 3GB
- **Timeout**: 30 seconds
- **Cost**: FREE (trong free tier)

## 📋 Prerequisites

1. ✅ Vercel account (free): https://vercel.com/signup
2. ✅ GitHub account (optional, cho auto-deploy)
3. ✅ Vercel CLI (optional): `npm i -g vercel`

## 🚀 Method 1: Deploy qua CLI (Nhanh nhất)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

Chọn method để login (GitHub, GitLab, Bitbucket, Email).

### Step 3: Deploy

```bash
cd vercel-api

# Deploy to production
vercel --prod
```

Vercel sẽ hỏi:
- **Set up and deploy?** → Yes
- **Which scope?** → Chọn account của bạn
- **Link to existing project?** → No (lần đầu)
- **Project name?** → `image-converter-api` (hoặc tên khác)
- **Directory?** → `.` (current directory)

### Step 4: Lấy URL

Sau khi deploy xong, bạn sẽ nhận được URL:

```
✅ Production: https://image-converter-api.vercel.app
```

### Step 5: Test API

```bash
# Test health check
curl https://image-converter-api.vercel.app/api/health

# Test conversion
curl -X POST https://image-converter-api.vercel.app/api/convert \
  -F "file=@test-image.jpg" \
  -F "format=webp" \
  -F "quality=85"
```

## 🔄 Method 2: Deploy qua GitHub (Auto-Deploy)

### Step 1: Push code lên GitHub

```bash
# Initialize git (nếu chưa có)
cd vercel-api
git init
git add .
git commit -m "Initial commit: Image Converter API"

# Create GitHub repository và push
git remote add origin https://github.com/your-username/image-converter-api.git
git push -u origin main
```

### Step 2: Connect với Vercel

1. Vào https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Click **Import** bên cạnh GitHub repository của bạn
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `vercel-api` (nếu API ở subfolder)
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

### Step 3: Deploy

Click **Deploy** và đợi vài phút.

### Step 4: Auto-Deploy Setup

Từ giờ mỗi khi push code mới lên GitHub:
- **main branch** → Auto deploy to Production
- **other branches** → Auto deploy to Preview

## 🌍 Method 3: Deploy từ Local Directory

Nếu không muốn dùng Git:

```bash
cd vercel-api

# Deploy
vercel --prod

# Follow prompts
```

Vercel sẽ upload trực tiếp từ local directory.

## ⚙️ Configuration

### 1. Custom Domain (Optional)

Sau khi deploy, add custom domain:

```bash
# Via CLI
vercel domains add api.yourdomain.com

# Hoặc via Dashboard
# Project → Settings → Domains
```

### 2. Environment Variables

Nếu cần thêm env vars:

```bash
# Via CLI
vercel env add MY_SECRET

# Hoặc via Dashboard
# Project → Settings → Environment Variables
```

### 3. Region Configuration

Thay đổi region trong `vercel.json`:

```json
{
  "regions": ["sfo1"]  // San Francisco
  // Hoặc: ["iad1"]    // Washington DC
  // Hoặc: ["sin1"]    // Singapore
}
```

Regions available:
- `sfo1` - San Francisco
- `iad1` - Washington DC
- `pdx1` - Portland
- `sin1` - Singapore
- `hnd1` - Tokyo

### 4. Function Settings

Điều chỉnh timeout và memory trong `vercel.json`:

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,    // Max: 60s (Hobby), 900s (Pro)
      "memory": 3008        // MB (1024, 1769, 2048, 3008)
    }
  }
}
```

## 📊 Monitoring

### View Logs

```bash
# Via CLI
vercel logs https://image-converter-api.vercel.app

# Hoặc via Dashboard
# Project → Deployments → Click deployment → Runtime Logs
```

### View Analytics

Dashboard → Project → Analytics:
- Function invocations
- Bandwidth usage
- Error rates
- Response times

### View Function Metrics

Dashboard → Project → Functions:
- Execution time
- Memory usage
- Cold starts
- Error logs

## 🔧 Update & Redeploy

### Update Code

```bash
# Make changes to code
# ...

# Redeploy
vercel --prod
```

### Rollback

```bash
# Via CLI - deploy previous version
vercel rollback

# Hoặc via Dashboard
# Project → Deployments → Previous deployment → Promote to Production
```

## 💰 Cost Tracking

### Free Tier Limits

- 100 GB bandwidth/month
- 100 hours function execution/month
- Unlimited deployments
- Unlimited API requests (trong giới hạn execution time)

### Check Usage

Dashboard → Settings → Usage:
- Current bandwidth usage
- Function execution hours
- Estimated cost

### Optimization Tips

1. **Reduce function execution time**:
   ```typescript
   // Resize trước khi convert
   if (width > 1920) width = 1920;
   ```

2. **Cache responses** (nếu cần):
   ```typescript
   res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
   ```

3. **Limit file size**:
   ```typescript
   const MAX_SIZE = 10 * 1024 * 1024; // 10MB
   ```

## 🐛 Troubleshooting

### Deploy Failed

```bash
# Clear cache and redeploy
vercel --prod --force
```

### Function Timeout

Increase timeout in `vercel.json` (max 60s on free tier):

```json
"maxDuration": 60
```

### Memory Issues

Increase memory:

```json
"memory": 3008  // Max on free tier
```

### Module Not Found

```bash
# Ensure dependencies are in package.json
npm install sharp busboy --save

# Redeploy
vercel --prod
```

### CORS Errors

Already configured in API. If issues persist:

```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## 🔐 Security

### API Protection

1. **Add API Key** (optional):

```typescript
// api/convert.ts
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.API_KEY) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

Set API key:
```bash
vercel env add API_KEY
```

2. **Rate Limiting**:

Use Vercel Edge Config or Upstash Redis:

```typescript
// Example with simple in-memory rate limit
const requestCounts = new Map();

function checkRateLimit(ip: string): boolean {
  const count = requestCounts.get(ip) || 0;
  if (count > 100) return false; // 100 requests per period
  requestCounts.set(ip, count + 1);
  return true;
}
```

## 📱 Integration with Main App

### Update Main App to use API

```typescript
// In your main image-converter app
const API_URL = 'https://image-converter-api.vercel.app';

async function convertImage(file: File, format: string, quality: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  formData.append('quality', quality.toString());

  const response = await fetch(`${API_URL}/api/convert`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (data.success) {
    return `data:image/${format};base64,${data.result.image}`;
  }

  throw new Error(data.error);
}
```

### Environment Variable

```typescript
// .env.local (main app)
NEXT_PUBLIC_IMAGE_API_URL=https://image-converter-api.vercel.app

// Use in code
const API_URL = process.env.NEXT_PUBLIC_IMAGE_API_URL;
```

## 🎯 Production Checklist

- [ ] API deployed successfully
- [ ] Health check endpoint working
- [ ] Test image conversion
- [ ] Test metadata endpoint
- [ ] Configure custom domain (optional)
- [ ] Setup monitoring/alerts
- [ ] Add rate limiting (optional)
- [ ] Update main app with API URL
- [ ] Test from main app
- [ ] Monitor usage in first week

## 📞 Support

**Issues?**

1. Check deployment logs: `vercel logs`
2. Check function logs in Dashboard
3. Verify `vercel.json` configuration
4. Test locally: `vercel dev`
5. Check Vercel status: https://vercel-status.com

**Vercel Support:**
- Free tier: Community support (forum)
- Pro tier: Email support
- Enterprise: Priority support

---

🎉 **Congratulations!** API của bạn đã live at:
`https://image-converter-api.vercel.app`

Test ngay:
```bash
curl https://your-api.vercel.app/api/health
```
