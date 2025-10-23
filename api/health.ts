import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { HealthCheckResponse } from '../lib/types';

/**
 * Health check endpoint
 *
 * GET /api/health
 */
export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const response: HealthCheckResponse = {
    status: 'ok',
    message: 'Image Converter API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
