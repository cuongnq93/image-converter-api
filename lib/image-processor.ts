import sharp from 'sharp';
import type {
  ConversionRequest,
  ConversionResult,
  ImageFormat,
  ImageMetadata,
} from './types';

/**
 * Image Processor using Sharp
 * Handles image conversion, optimization, and transformations
 */
export class ImageProcessor {
  /**
   * Convert image to specified format with options
   */
  async convert(request: ConversionRequest): Promise<ConversionResult> {
    try {
      const { file, format, quality = 85, width, height, fit = 'inside', optimize = true } = request;

      // Get original size
      const originalSize = file.length;

      // Start processing pipeline
      let pipeline = sharp(file);

      // Apply resize if dimensions specified
      if (width || height) {
        pipeline = pipeline.resize(width, height, {
          fit,
          withoutEnlargement: true,
        });
      }

      // Apply format conversion with optimization
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({
            quality,
            progressive: true,
            optimizeScans: optimize,
            mozjpeg: optimize,
          });
          break;

        case 'png':
          pipeline = pipeline.png({
            quality,
            progressive: true,
            compressionLevel: optimize ? 9 : 6,
            adaptiveFiltering: optimize,
          });
          break;

        case 'webp':
          pipeline = pipeline.webp({
            quality,
            effort: optimize ? 6 : 4,
            smartSubsample: optimize,
          });
          break;

        case 'avif':
          pipeline = pipeline.avif({
            quality,
            effort: optimize ? 9 : 4,
          });
          break;

        case 'gif':
          pipeline = pipeline.gif({
            effort: optimize ? 10 : 7,
          });
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Execute pipeline
      const outputBuffer = await pipeline.toBuffer({ resolveWithObject: true });
      const outputSize = outputBuffer.data.length;

      // Calculate metadata
      const metadata: ImageMetadata = {
        format: outputBuffer.info.format,
        width: outputBuffer.info.width,
        height: outputBuffer.info.height,
        size: outputSize,
        originalSize,
        compressionRatio: ((originalSize - outputSize) / originalSize) * 100,
      };

      // Convert to base64
      const base64 = outputBuffer.data.toString('base64');

      return {
        success: true,
        data: base64,
        buffer: outputBuffer.data,
        metadata,
      };
    } catch (error) {
      console.error('Image conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Optimize image without changing format
   */
  async optimize(file: Buffer, quality: number = 85): Promise<ConversionResult> {
    try {
      const metadata = await sharp(file).metadata();
      const format = metadata.format as ImageFormat;

      if (!format) {
        throw new Error('Unable to detect image format');
      }

      return this.convert({
        file,
        format,
        quality,
        optimize: true,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get image metadata without conversion
   */
  async getMetadata(file: Buffer): Promise<ImageMetadata | null> {
    try {
      const metadata = await sharp(file).metadata();
      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: file.length,
      };
    } catch (error) {
      console.error('Failed to get metadata:', error);
      return null;
    }
  }

  /**
   * Validate image buffer
   */
  async isValidImage(file: Buffer): Promise<boolean> {
    try {
      await sharp(file).metadata();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(
    file: Buffer,
    size: number = 200,
    format: ImageFormat = 'webp'
  ): Promise<ConversionResult> {
    return this.convert({
      file,
      format,
      width: size,
      height: size,
      fit: 'cover',
      quality: 85,
      optimize: true,
    });
  }

  /**
   * Batch process multiple images
   */
  async convertBatch(
    requests: ConversionRequest[]
  ): Promise<ConversionResult[]> {
    return Promise.all(requests.map((request) => this.convert(request)));
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
