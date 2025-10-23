# HEIC Preview API Documentation

## Overview

API endpoint để xử lý preview ảnh HEIC cho các trình duyệt không hỗ trợ định dạng HEIC (Chrome, Firefox, Edge). Safari hỗ trợ HEIC natively nên có thể bỏ qua conversion.

**Endpoint:** `POST /api/preview`

**Use Case:** Khi người dùng upload ảnh HEIC và muốn preview trong browser không phải Safari, API sẽ tự động convert sang JPEG với quality và size tối ưu cho preview nhanh.

---

## Request

### HTTP Method
```
POST /api/preview
```

### Headers
```
Content-Type: multipart/form-data
User-Agent: <browser-user-agent> (optional, dùng cho browser detection)
```

### Request Body (multipart/form-data)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `file` | File | **Yes** | - | File ảnh HEIC cần preview |
| `quality` | Number | No | `75` | Chất lượng JPEG output (1-100). Giá trị 75 tối ưu cho preview nhanh |
| `maxWidth` | Number | No | `1920` | Chiều rộng tối đa của ảnh preview (px) |
| `maxHeight` | Number | No | `1080` | Chiều cao tối đa của ảnh preview (px) |
| `detectBrowser` | Boolean | No | `false` | Tự động detect browser và skip conversion nếu là Safari |

### Example Request (JavaScript/Fetch)

```javascript
const formData = new FormData();
formData.append('file', heicFile); // File object từ input
formData.append('quality', '75');
formData.append('maxWidth', '1920');
formData.append('maxHeight', '1080');
formData.append('detectBrowser', 'true');

const response = await fetch('https://your-domain.vercel.app/api/preview', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### Example Request (cURL)

```bash
curl -X POST https://your-domain.vercel.app/api/preview \
  -F "file=@/path/to/image.heic" \
  -F "quality=75" \
  -F "maxWidth=1920" \
  -F "maxHeight=1080" \
  -F "detectBrowser=true"
```

---

## Response

### Success Response (Converted)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "result": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "metadata": {
      "format": "jpeg",
      "width": 1920,
      "height": 1280,
      "size": 245678,
      "originalSize": 3456789,
      "compressionRatio": 92.89
    },
    "converted": true,
    "browser": "Chrome"
  }
}
```

### Success Response (Not Converted - Safari)

Khi `detectBrowser=true` và browser là Safari với file HEIC:

**Status Code:** `200 OK`

```json
{
  "success": true,
  "result": {
    "image": "data:image/heic;base64,ZnR5cGhlaWM...",
    "metadata": {
      "format": "heif",
      "width": 4032,
      "height": 3024,
      "size": 3456789
    },
    "converted": false,
    "browser": "Safari"
  }
}
```

### Response Fields

#### `success` (boolean)
- `true`: Xử lý thành công
- `false`: Có lỗi xảy ra

#### `result` (object, khi success = true)

| Field | Type | Description |
|-------|------|-------------|
| `image` | String | Base64 encoded image (JPEG hoặc HEIC tùy theo `converted`) |
| `metadata` | Object | Thông tin metadata của ảnh |
| `converted` | Boolean | `true` nếu đã convert, `false` nếu bỏ qua (Safari) |
| `browser` | String | Tên browser (chỉ có khi `detectBrowser=true`) |

#### `metadata` (object)

| Field | Type | Description |
|-------|------|-------------|
| `format` | String | Định dạng ảnh output (`jpeg` hoặc `heif`) |
| `width` | Number | Chiều rộng ảnh (pixels) |
| `height` | Number | Chiều cao ảnh (pixels) |
| `size` | Number | Kích thước file output (bytes) |
| `originalSize` | Number | Kích thước file gốc (bytes) - chỉ có khi converted |
| `compressionRatio` | Number | Tỷ lệ nén (%) - chỉ có khi converted |

---

## Error Response

**Status Code:** `400 Bad Request` hoặc `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `"No file provided"` | Request không có file | Đảm bảo field `file` được gửi trong form-data |
| `"Invalid image file"` | File không phải là ảnh hợp lệ | Kiểm tra file có đúng định dạng ảnh không |
| `"Unable to read image metadata"` | Không đọc được metadata | File ảnh có thể bị corrupt |
| `"Method not allowed. Use POST."` | Dùng HTTP method khác POST | Chỉ sử dụng POST method |
| `"Conversion failed"` | Lỗi trong quá trình convert | Kiểm tra file và thử lại |

---

## Usage Examples

### Example 1: Basic Preview (Auto-convert)

```javascript
// Upload và preview HEIC cho mọi browser
const file = document.getElementById('fileInput').files[0];
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/preview', {
  method: 'POST',
  body: formData
});

const data = await response.json();

if (data.success) {
  // Hiển thị ảnh preview
  const img = document.createElement('img');
  img.src = `data:image/jpeg;base64,${data.result.image}`;
  document.body.appendChild(img);

  console.log('Image size:', data.result.metadata.size, 'bytes');
  console.log('Dimensions:', data.result.metadata.width, 'x', data.result.metadata.height);
}
```

### Example 2: With Browser Detection

```javascript
// Tự động detect browser và skip conversion cho Safari
const file = document.getElementById('fileInput').files[0];
const formData = new FormData();
formData.append('file', file);
formData.append('detectBrowser', 'true');

const response = await fetch('/api/preview', {
  method: 'POST',
  body: formData
});

const data = await response.json();

if (data.success) {
  if (data.result.converted) {
    console.log('Image converted for', data.result.browser);
  } else {
    console.log('Native HEIC support in', data.result.browser);
  }

  // Hiển thị ảnh
  const img = document.createElement('img');
  const format = data.result.metadata.format;
  img.src = `data:image/${format};base64,${data.result.image}`;
  document.body.appendChild(img);
}
```

### Example 3: Custom Quality and Size

```javascript
// Custom quality và size cho preview thumbnail nhỏ
const file = document.getElementById('fileInput').files[0];
const formData = new FormData();
formData.append('file', file);
formData.append('quality', '60'); // Lower quality cho file nhỏ hơn
formData.append('maxWidth', '800'); // Thumbnail size
formData.append('maxHeight', '600');

const response = await fetch('/api/preview', {
  method: 'POST',
  body: formData
});

const data = await response.json();

if (data.success) {
  console.log('Thumbnail created!');
  console.log('Original:', data.result.metadata.originalSize, 'bytes');
  console.log('Preview:', data.result.metadata.size, 'bytes');
  console.log('Saved:', data.result.metadata.compressionRatio.toFixed(2), '%');
}
```

### Example 4: React Component

```jsx
import React, { useState } from 'react';

function HEICPreview() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', '75');
    formData.append('detectBrowser', 'true');

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const format = data.result.metadata.format;
        setPreviewUrl(`data:image/${format};base64,${data.result.image}`);
        setMetadata(data.result.metadata);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/heic,image/heif"
        onChange={handleFileChange}
        disabled={loading}
      />

      {loading && <p>Converting...</p>}

      {previewUrl && (
        <div>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%' }} />
          {metadata && (
            <div>
              <p>Format: {metadata.format}</p>
              <p>Size: {metadata.width} x {metadata.height}</p>
              <p>File size: {(metadata.size / 1024).toFixed(2)} KB</p>
              {metadata.compressionRatio && (
                <p>Compression: {metadata.compressionRatio.toFixed(2)}%</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HEICPreview;
```

---

## Browser Support & Behavior

| Browser | Native HEIC Support | API Behavior |
|---------|-------------------|--------------|
| Safari (iOS/macOS) | ✅ Yes | Skip conversion nếu `detectBrowser=true`, trả về HEIC gốc |
| Chrome | ❌ No | Convert sang JPEG |
| Firefox | ❌ No | Convert sang JPEG |
| Edge | ❌ No | Convert sang JPEG |

---

## Performance Notes

1. **Default Quality (75):** Cân bằng tốt giữa chất lượng và kích thước file cho preview
2. **Max Dimensions (1920x1080):** Đủ lớn cho màn hình Full HD, nhỏ hơn đáng kể so với ảnh gốc 4K
3. **Compression Ratio:** Thường đạt 85-95% reduction với settings mặc định
4. **Processing Time:** ~200-500ms tùy kích thước ảnh gốc
5. **Memory:** API sử dụng 3008MB memory limit trên Vercel (cấu hình trong `vercel.json`)

---

## Best Practices

1. **Hiển thị Loading State:** Conversion có thể mất vài giây với ảnh lớn
2. **Cache Result:** Cache base64 string để tránh convert lại khi re-render
3. **Progressive Enhancement:** Dùng `detectBrowser` để tối ưu cho Safari users
4. **Error Handling:** Luôn handle error case và show message thân thiện
5. **File Size Limit:** Vercel có limit 4.5MB cho request body (hobby plan), cân nhắc resize client-side trước khi upload file quá lớn

---

## Related APIs

- **`/api/convert`** - Full conversion API với nhiều format options
- **`/api/metadata`** - Get image metadata without conversion
- **`/api/health`** - Health check endpoint

---

## Troubleshooting

### Issue: "No file provided"
**Solution:** Đảm bảo form field name là `file` và content-type là `multipart/form-data`

### Issue: Request timeout
**Solution:** File quá lớn. Resize ảnh client-side trước khi upload hoặc tăng timeout trong `vercel.json`

### Issue: "Invalid image file"
**Solution:** File không phải HEIC hoặc bị corrupt. Validate file trước khi upload

### Issue: Poor quality output
**Solution:** Tăng `quality` parameter (80-90 cho quality tốt hơn)

---

## API Limits (Vercel)

- **Max Request Size:** 4.5MB (Hobby), 4.5MB (Pro)
- **Max Duration:** 30 seconds (configured in `vercel.json`)
- **Memory:** 3008MB (configured in `vercel.json`)
- **Rate Limiting:** Theo Vercel Fair Use Policy

---

## Support

Nếu gặp vấn đề hoặc cần hỗ trợ, vui lòng tạo issue trên repository hoặc liên hệ team.
