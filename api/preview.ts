import type { VercelRequest, VercelResponse } from '@vercel/node';
import { imageProcessor } from '../lib/image-processor';
import type { APIResponse } from '../lib/types';
import busboy from 'busboy';

/**
 * Vercel Serverless Function - HEIC Preview API
 *
 * Endpoint: POST /api/preview
 *
 * This API converts HEIC images to JPEG for preview in browsers that don't support HEIC format.
 * Safari natively supports HEIC, but Chrome, Firefox, and Edge do not.
 *
 * Request body (multipart/form-data):
 * - file: HEIC image file (required)
 * - quality: Preview quality (1-100, default: 75, optimized for fast loading)
 * - maxWidth: Maximum width for preview (default: 1920, to reduce size)
 * - maxHeight: Maximum height for preview (default: 1080, to reduce size)
 * - detectBrowser: Auto-detect browser and skip conversion for Safari (default: false)
 *
 * Response:
 * {
 *   success: boolean,
 *   result?: {
 *     image: string,      // Base64 encoded JPEG
 *     metadata: {
 *       format: string,
 *       width: number,
 *       height: number,
 *       size: number,
 *       originalSize: number,
 *       compressionRatio: number
 *     },
 *     converted: boolean,  // true if converted, false if skipped (Safari)
 *     browser?: string     // Browser name if detectBrowser is enabled
 *   },
 *   error?: string
 * }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    const response: APIResponse = {
      success: false,
      error: 'Method not allowed. Use POST.',
    };
    res.status(405).json(response);
    return;
  }

  try {
    // Parse multipart form data
    const { file, quality, maxWidth, maxHeight, detectBrowser } =
      await parseFormData(req);

    // Validate required fields
    if (!file) {
      const response: APIResponse = {
        success: false,
        error: 'No file provided',
      };
      res.status(400).json(response);
      return;
    }

    // Validate image
    const isValid = await imageProcessor.isValidImage(file);
    if (!isValid) {
      const response: APIResponse = {
        success: false,
        error: 'Invalid image file',
      };
      res.status(400).json(response);
      return;
    }

    // Get original metadata to check format
    const originalMetadata = await imageProcessor.getMetadata(file);
    if (!originalMetadata) {
      const response: APIResponse = {
        success: false,
        error: 'Unable to read image metadata',
      };
      res.status(400).json(response);
      return;
    }

    // Check if browser detection is enabled
    let browserInfo: string | undefined;
    let shouldConvert = true;

    if (detectBrowser) {
      const userAgent = req.headers['user-agent'] || '';
      browserInfo = detectBrowserType(userAgent);

      // Safari supports HEIC natively, so we can skip conversion
      if (browserInfo === 'Safari' && originalMetadata.format === 'heif') {
        shouldConvert = false;
      }
    }

    // If we should skip conversion (Safari + HEIC)
    if (!shouldConvert) {
      const base64 = file.toString('base64');
      const response = {
        success: true,
        result: {
          image: base64,
          metadata: originalMetadata,
          converted: false,
          browser: browserInfo,
        },
      };
      res.status(200).json(response);
      return;
    }

    // Set default values optimized for preview
    const previewQuality = quality || 75;
    const previewMaxWidth = maxWidth || 1920;
    const previewMaxHeight = maxHeight || 1080;

    // Calculate resize dimensions while maintaining aspect ratio
    let targetWidth: number | undefined;
    let targetHeight: number | undefined;

    if (originalMetadata.width > previewMaxWidth || originalMetadata.height > previewMaxHeight) {
      const widthRatio = previewMaxWidth / originalMetadata.width;
      const heightRatio = previewMaxHeight / originalMetadata.height;
      const ratio = Math.min(widthRatio, heightRatio);

      targetWidth = Math.round(originalMetadata.width * ratio);
      targetHeight = Math.round(originalMetadata.height * ratio);
    }

    // Convert to JPEG for preview
    const result = await imageProcessor.convert({
      file,
      format: 'jpeg',
      quality: previewQuality,
      width: targetWidth,
      height: targetHeight,
      optimize: true,
    });

    if (!result.success) {
      const response: APIResponse = {
        success: false,
        error: result.error || 'Conversion failed',
      };
      res.status(500).json(response);
      return;
    }

    // Return success response
    const response = {
      success: true,
      result: {
        image: result.data!,
        metadata: result.metadata!,
        converted: true,
        browser: browserInfo,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', error);
    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    res.status(500).json(response);
  }
}

/**
 * Detect browser type from User-Agent
 */
function detectBrowserType(userAgent: string): string {
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent) && !/Chromium/i.test(userAgent)) {
    return 'Safari';
  }
  if (/Chrome/i.test(userAgent) || /Chromium/i.test(userAgent)) {
    return 'Chrome';
  }
  if (/Firefox/i.test(userAgent)) {
    return 'Firefox';
  }
  if (/Edg/i.test(userAgent)) {
    return 'Edge';
  }
  return 'Unknown';
}

/**
 * Parse multipart form data
 */
function parseFormData(
  req: VercelRequest
): Promise<{
  file?: Buffer;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  detectBrowser?: boolean;
}> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const result: any = {};
    let fileBuffer: Buffer | undefined;

    bb.on('file', (_fieldname, file, _info) => {
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('field', (fieldname, value) => {
      if (fieldname === 'quality' || fieldname === 'maxWidth' || fieldname === 'maxHeight') {
        result[fieldname] = parseInt(value);
      } else if (fieldname === 'detectBrowser') {
        result[fieldname] = value === 'true' || value === '1';
      } else {
        result[fieldname] = value;
      }
    });

    bb.on('close', () => {
      result.file = fileBuffer;
      resolve(result);
    });

    bb.on('error', (error) => {
      reject(error);
    });

    req.pipe(bb);
  });
}
