import type { VercelRequest, VercelResponse } from '@vercel/node';
import { imageProcessor } from '../lib/image-processor';
import busboy from 'busboy';

/**
 * Get image metadata without conversion
 *
 * POST /api/metadata
 *
 * Request body (multipart/form-data):
 * - file: Image file
 *
 * Response:
 * {
 *   success: boolean,
 *   metadata?: {...},
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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
    return;
  }

  try {
    const file = await parseFile(req);

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    const metadata = await imageProcessor.getMetadata(file);

    if (!metadata) {
      res.status(400).json({
        success: false,
        error: 'Failed to read image metadata',
      });
      return;
    }

    res.status(200).json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('Metadata API Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * Parse file from multipart form data
 */
function parseFile(req: VercelRequest): Promise<Buffer | undefined> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let fileBuffer: Buffer | undefined;

    bb.on('file', (fieldname, file) => {
      const chunks: Buffer[] = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('close', () => {
      resolve(fileBuffer);
    });

    bb.on('error', reject);

    req.pipe(bb);
  });
}
