# Image Converter API - Vercel Serverless

API proxy chạy trên Vercel (Node.js Runtime) để nhận và convert image sử dụng Sharp.

## 🚀 Tính Năng

- ✅ **Chuyển đổi Format**: JPEG, PNG, WebP, AVIF, GIF
- ✅ **Tối ưu hóa**: Nén và tối ưu file size tự động
- ✅ **Resize**: Điều chỉnh kích thước ảnh
- ✅ **Quality Control**: Điều chỉnh chất lượng 1-100
- ✅ **Serverless**: Deploy trên Vercel miễn phí
- ✅ **Fast**: Xử lý nhanh với Sharp
- ✅ **CORS**: Hỗ trợ cross-origin requests

## 📋 Prerequisites

- Node.js >= 18.x
- Vercel CLI (optional)
- Vercel account (free tier)

## 🛠️ Setup

### 1. Cài đặt Dependencies

```bash
cd vercel-api
npm install
# hoặc
yarn install
```

### 2. Development Local

```bash
# Install Vercel CLI
npm i -g vercel

# Start dev server
vercel dev

# API sẽ chạy tại http://localhost:3000
```

### 3. Deploy lên Vercel

#### Option A: Deploy qua CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Deploy qua GitHub

1. Push code lên GitHub repository
2. Vào [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New** → **Project**
4. Import GitHub repository
5. Set **Root Directory** = `vercel-api`
6. Click **Deploy**

## 📡 API Endpoints

### 1. Health Check

Kiểm tra API đang hoạt động.

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Image Converter API is running",
  "version": "1.0.0",
  "timestamp": "2025-10-23T..."
}
```

**Example:**
```bash
curl https://your-api.vercel.app/api/health
```

### 2. Convert Image

Chuyển đổi ảnh sang format khác.

```bash
POST /api/convert
Content-Type: multipart/form-data
```

**Parameters:**
- `file` (required): Image file
- `format` (required): Target format (`jpeg`, `png`, `webp`, `avif`, `gif`)
- `quality` (optional): Quality 1-100 (default: 85)
- `width` (optional): Target width in pixels
- `height` (optional): Target height in pixels
- `optimize` (optional): Enable optimization (default: true)

**Response:**
```json
{
  "success": true,
  "result": {
    "image": "base64-encoded-image-data",
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

**Example (cURL):**
```bash
curl -X POST https://your-api.vercel.app/api/convert \
  -F "file=@image.jpg" \
  -F "format=webp" \
  -F "quality=85" \
  -F "width=1920"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('format', 'webp');
formData.append('quality', '85');

const response = await fetch('https://your-api.vercel.app/api/convert', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
if (data.success) {
  const base64Image = data.result.image;
  const imageUrl = `data:image/webp;base64,${base64Image}`;
  // Use imageUrl in <img> tag
}
```

### 3. Get Metadata

Lấy thông tin metadata của ảnh không convert.

```bash
POST /api/metadata
Content-Type: multipart/form-data
```

**Parameters:**
- `file` (required): Image file

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

**Example:**
```bash
curl -X POST https://your-api.vercel.app/api/metadata \
  -F "file=@image.jpg"
```

## 🧪 Testing

### Test Local API

```bash
# Create test image (optional)
# Copy any image to test/test-image.jpg

# Run test script
npm test

# Or test specific endpoint
node test/test-api.js
```

### Test Production API

```bash
# Set API URL
export API_URL=https://your-api.vercel.app
export TEST_IMAGE=./test/test-image.jpg

# Run tests
npm test
```

### Manual Testing với cURL

```bash
# 1. Health check
curl https://your-api.vercel.app/api/health

# 2. Get metadata
curl -X POST https://your-api.vercel.app/api/metadata \
  -F "file=@test-image.jpg"

# 3. Convert to WebP
curl -X POST https://your-api.vercel.app/api/convert \
  -F "file=@test-image.jpg" \
  -F "format=webp" \
  -F "quality=85"

# 4. Convert with resize
curl -X POST https://your-api.vercel.app/api/convert \
  -F "file=@test-image.jpg" \
  -F "format=webp" \
  -F "quality=85" \
  -F "width=800" \
  -F "height=600"
```

## 📁 Project Structure

```
vercel-api/
├── api/                    # Vercel serverless functions
│   ├── convert.ts         # Main conversion endpoint
│   ├── metadata.ts        # Metadata endpoint
│   └── health.ts          # Health check endpoint
├── lib/                   # Shared libraries
│   ├── image-processor.ts # Image processing with Sharp
│   └── types.ts           # TypeScript types
├── test/                  # Test scripts
│   └── test-api.js        # API test suite
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vercel.json            # Vercel configuration
└── README.md              # This file
```

## ⚙️ Configuration

### vercel.json

```json
{
  "regions": ["sfo1"],           // Deploy region
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30,         // 30 seconds timeout
      "memory": 3008             // 3GB RAM for image processing
    }
  }
}
```

### Environment Variables

Không cần environment variables cho API này. Tất cả processing diễn ra server-side.

## 🔧 Customization

### Thay đổi Default Quality

Edit `api/convert.ts`:

```typescript
const result = await imageProcessor.convert({
  file,
  format: format as ImageFormat,
  quality: quality || 90,  // Change default from 85 to 90
  // ...
});
```

### Thêm Format Mới

Edit `lib/types.ts`:

```typescript
export type ImageFormat =
  'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';  // Add tiff
```

Edit `lib/image-processor.ts`:

```typescript
case 'tiff':
  pipeline = pipeline.tiff({
    quality,
    compression: 'lzw',
  });
  break;
```

### Giới hạn File Size

Edit `api/convert.ts`:

```typescript
// Add validation after parsing form
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.length > MAX_FILE_SIZE) {
  const response: APIResponse = {
    success: false,
    error: 'File too large. Maximum 10MB.',
  };
  res.status(400).json(response);
  return;
}
```

## 📊 Performance

### Benchmarks

| Image Size | Format | Processing Time | Output Size |
|-----------|--------|-----------------|-------------|
| 2.4 MB JPEG | → WebP | ~1-2s | 1.2 MB |
| 5 MB PNG | → WebP | ~2-3s | 800 KB |
| 1 MB JPEG | → AVIF | ~3-4s | 400 KB |

*Tested on Vercel free tier*

### Optimization Tips

1. **Resize trước khi convert** - Giảm processing time
2. **Dùng WebP thay vì AVIF** - Nhanh hơn, support tốt hơn
3. **Quality 75-85** - Balance tốt giữa size và quality
4. **Enable optimize flag** - Better compression

## 💰 Cost

### Vercel Free Tier

- ✅ 100 GB bandwidth/month
- ✅ 100 hours function execution/month
- ✅ 3GB RAM per function
- ✅ 30s max duration

**Ước tính với Free Tier:**
- ~10,000 image conversions/month
- Average 1s per conversion
- Completely FREE

### Nếu vượt Free Tier

- **Bandwidth**: $0.15/GB
- **Function Execution**: $0.60/million GB-seconds

**Example**: 50,000 conversions/month (~50 hours) = ~$5-10/month

## 🐛 Troubleshooting

### Error: "Cannot find module 'sharp'"

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Error: "Function execution timeout"

Increase timeout in `vercel.json`:

```json
"functions": {
  "api/**/*.ts": {
    "maxDuration": 60  // Increase to 60s
  }
}
```

### Error: "Memory limit exceeded"

Giảm file size hoặc resize trước khi convert:

```typescript
// Resize before conversion
if (width && width > 2000) {
  width = 2000;  // Limit max width
}
```

### CORS Issues

CORS headers đã được enable mặc định. Nếu vẫn có lỗi:

```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

## 🔐 Security

### Rate Limiting

Vercel tự động rate limit. Để custom rate limit:

1. Dùng Vercel Edge Config
2. Hoặc integrate với Redis/Upstash

### File Validation

API đã validate:
- ✅ File phải là image hợp lệ
- ✅ Format phải được support
- ✅ Quality phải từ 1-100

Thêm validation nếu cần:

```typescript
// Validate file type by extension
const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
if (!allowedTypes.includes(path.extname(filename))) {
  throw new Error('Invalid file type');
}
```

## 📚 Resources

- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Image Optimization Best Practices](https://web.dev/fast/)

## 🆘 Support

**Issues?**
1. Check Vercel function logs: Dashboard → Functions → Logs
2. Test locally: `vercel dev`
3. Check Sharp version compatibility
4. Verify Node.js version >= 18.x

## 📝 License

MIT

---

**Made with ❤️ for Image Converter**

Deploy ngay: `vercel --prod` 🚀
