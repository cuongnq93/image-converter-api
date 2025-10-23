/**
 * Types for Vercel Image Conversion API
 */

export interface ConversionRequest {
  file: Buffer;
  format: ImageFormat;
  quality?: number;
  width?: number;
  height?: number;
  fit?: FitMode;
  optimize?: boolean;
}

export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif';

export type FitMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export interface ConversionResult {
  success: boolean;
  data?: string; // Base64 encoded image
  buffer?: Buffer; // Raw buffer for direct response
  metadata?: ImageMetadata;
  error?: string;
}

export interface ImageMetadata {
  format: string;
  width: number;
  height: number;
  size: number;
  originalSize?: number;
  compressionRatio?: number;
}

export interface APIResponse {
  success: boolean;
  result?: {
    image: string; // Base64
    metadata: ImageMetadata;
  };
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  version: string;
  timestamp: string;
}
