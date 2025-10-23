# Quick Start - 5 phút Deploy API

## 🚀 Deploy Nhanh

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo%2Fimage-converter-api)

### Option 2: CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to folder
cd vercel-api

# 3. Login
vercel login

# 4. Deploy
vercel --prod

# ✅ Done! API is live at https://your-api.vercel.app
```

## 🧪 Test API

```bash
# Replace with your API URL
API_URL="https://your-api.vercel.app"

# 1. Health check
curl $API_URL/api/health

# 2. Convert image
curl -X POST $API_URL/api/convert \
  -F "file=@image.jpg" \
  -F "format=webp" \
  -F "quality=85"
```

## 💻 Sử Dụng trong Code

### JavaScript/TypeScript

```javascript
async function convertImage(file, format = 'webp', quality = 85) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format);
  formData.append('quality', quality);

  const response = await fetch('https://your-api.vercel.app/api/convert', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (data.success) {
    const imageUrl = `data:image/${format};base64,${data.result.image}`;
    return imageUrl;
  }

  throw new Error(data.error);
}

// Usage
const convertedImage = await convertImage(fileInput.files[0], 'webp', 85);
document.getElementById('preview').src = convertedImage;
```

### React Hook

```typescript
import { useState } from 'react';

function useImageConverter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async (file: File, format: string, quality: number = 85) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('quality', quality.toString());

      const response = await fetch('https://your-api.vercel.app/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return `data:image/${format};base64,${data.result.image}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { convert, loading, error };
}

// Usage in component
function ImageConverter() {
  const { convert, loading, error } = useImageConverter();
  const [result, setResult] = useState<string | null>(null);

  const handleConvert = async (file: File) => {
    const imageUrl = await convert(file, 'webp', 85);
    setResult(imageUrl);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleConvert(e.target.files![0])} />
      {loading && <p>Converting...</p>}
      {error && <p>Error: {error}</p>}
      {result && <img src={result} alt="Converted" />}
    </div>
  );
}
```

### Python

```python
import requests

def convert_image(file_path, format='webp', quality=85):
    url = 'https://your-api.vercel.app/api/convert'

    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'format': format,
            'quality': quality
        }

        response = requests.post(url, files=files, data=data)
        result = response.json()

        if result['success']:
            return result['result']['image']  # Base64
        else:
            raise Exception(result['error'])

# Usage
base64_image = convert_image('image.jpg', 'webp', 85)
```

## 📚 API Endpoints

### POST /api/convert

Convert image sang format khác.

**Body (multipart/form-data):**
- `file` - Image file (required)
- `format` - jpeg, png, webp, avif, gif (required)
- `quality` - 1-100 (optional, default: 85)
- `width` - Target width (optional)
- `height` - Target height (optional)

**Response:**
```json
{
  "success": true,
  "result": {
    "image": "base64...",
    "metadata": {
      "format": "webp",
      "width": 1920,
      "height": 1080,
      "size": 245678,
      "originalSize": 1234567,
      "compressionRatio": 80.1
    }
  }
}
```

### POST /api/metadata

Lấy metadata của ảnh.

**Body (multipart/form-data):**
- `file` - Image file (required)

**Response:**
```json
{
  "success": true,
  "metadata": {
    "format": "jpeg",
    "width": 3024,
    "height": 4032,
    "size": 2456789
  }
}
```

### GET /api/health

Health check.

**Response:**
```json
{
  "status": "ok",
  "message": "Image Converter API is running",
  "version": "1.0.0",
  "timestamp": "2025-10-23T..."
}
```

## 🎯 Common Use Cases

### 1. Convert to WebP

```javascript
const webpImage = await convertImage(file, 'webp', 85);
```

### 2. Resize and Convert

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('format', 'webp');
formData.append('width', '800');
formData.append('height', '600');

const response = await fetch(`${API_URL}/api/convert`, {
  method: 'POST',
  body: formData,
});
```

### 3. Compress Image

```javascript
// High quality (minimal compression)
await convertImage(file, 'jpeg', 95);

// Balanced
await convertImage(file, 'jpeg', 85);

// High compression (smaller file)
await convertImage(file, 'jpeg', 60);
```

### 4. Create Thumbnail

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('format', 'webp');
formData.append('width', '200');
formData.append('height', '200');
formData.append('quality', '85');
```

## 💰 Cost

**Free Tier (Vercel Hobby):**
- ✅ 100 GB bandwidth/month
- ✅ 100 hours function execution/month
- ✅ ~10,000 conversions/month
- ✅ Completely FREE

## 🔧 Customize

### Change Default Quality

Edit `api/convert.ts`:
```typescript
quality: quality || 90  // Change from 85 to 90
```

### Add File Size Limit

Edit `api/convert.ts`:
```typescript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.length > MAX_SIZE) {
  return res.status(400).json({
    success: false,
    error: 'File too large. Max 10MB.'
  });
}
```

### Change Region

Edit `vercel.json`:
```json
{
  "regions": ["sin1"]  // Singapore for Asia
}
```

## 🐛 Troubleshooting

### "Cannot find module 'sharp'"

```bash
rm -rf node_modules
npm install
vercel --prod --force
```

### CORS Error

Already enabled. If issues, check request origin.

### Slow Processing

- Resize image trước khi convert
- Giảm quality
- Dùng WebP thay vì AVIF

## 📞 Need Help?

1. Check [README.md](./README.md) - Full documentation
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy guide
3. Check Vercel logs: `vercel logs`

---

## 🎉 Next Steps

1. ✅ Deploy API
2. ✅ Test với curl
3. ✅ Integrate vào app
4. ✅ Monitor usage
5. ✅ Enjoy! 🚀

**API URL**: https://your-api.vercel.app

Happy coding! 💻✨
