import type { VercelRequest, VercelResponse } from '@vercel/node';
import { imageProcessor } from '../lib/image-processor';
import type { ImageFormat, APIResponse } from '../lib/types';
import busboy from 'busboy';

/**
 * Vercel Serverless Function - Image Conversion API
 *
 * Endpoint: POST /api/convert
 *
 * Request body (multipart/form-data):
 * - file: Image file
 * - format: Target format (jpeg, png, webp, avif, gif)
 * - quality: Quality (1-100, default: 85)
 * - width: Target width (optional)
 * - height: Target height (optional)
 * - optimize: Enable optimization (default: true)
 *
 * Response:
 * {
 *   success: boolean,
 *   result?: {
 *     image: string,      // Base64 encoded
 *     metadata: {...}
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    const { file, format, quality, width, height, optimize } =
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

    if (!format) {
      const response: APIResponse = {
        success: false,
        error: 'Format parameter is required',
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

    // Convert image
    const result = await imageProcessor.convert({
      file,
      format: format as ImageFormat,
      quality: quality || 85,
      width,
      height,
      optimize: optimize !== false,
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
    const response: APIResponse = {
      success: true,
      result: {
        image: result.data!,
        metadata: result.metadata!,
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
 * Parse multipart form data
 */
function parseFormData(
  req: VercelRequest
): Promise<{
  file?: Buffer;
  format?: string;
  quality?: number;
  width?: number;
  height?: number;
  optimize?: boolean;
}> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const result: any = {};
    let fileBuffer: Buffer | undefined;

    bb.on('file', (fieldname, file, info) => {
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('field', (fieldname, value) => {
      if (fieldname === 'quality' || fieldname === 'width' || fieldname === 'height') {
        result[fieldname] = parseInt(value);
      } else if (fieldname === 'optimize') {
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
