import sharp from 'sharp';

// Configuration for main display images
const MAIN_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
};

// Configuration for thumbnail images
const THUMB_CONFIG = {
  width: 400,
  height: 400,
  quality: 80,
};

export interface ProcessedImages {
  main: {
    buffer: Buffer;
    width: number;
    height: number;
    format: 'webp' | 'gif';
  };
  thumbnail: {
    buffer: Buffer;
    width: number;
    height: number;
    format: 'webp';
  };
  originalSize: number;
  optimizedSize: number;
}

/**
 * Process an uploaded image: optimize for web and generate thumbnail
 * - Resizes to max 1920x1920 while preserving aspect ratio
 * - Converts to WebP format (85% quality for main, 80% for thumb)
 * - Uses attention-based cropping for thumbnails to focus on interesting regions
 * - Preserves animation for GIFs
 * - Strips metadata but respects EXIF orientation
 */
export async function processImage(input: Buffer): Promise<ProcessedImages> {
  const originalSize = input.length;

  // Get metadata to check format and handle GIFs specially
  const metadata = await sharp(input).metadata();
  const isAnimatedGif = metadata.format === 'gif' && (metadata.pages ?? 1) > 1;

  let mainBuffer: Buffer;
  let mainFormat: 'webp' | 'gif';
  let mainWidth: number;
  let mainHeight: number;

  if (isAnimatedGif) {
    // Preserve animation for GIFs - optimize but keep as GIF
    mainBuffer = await sharp(input, { animated: true })
      .resize(MAIN_CONFIG.maxWidth, MAIN_CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .gif({ effort: 7 }) // Higher effort = better compression
      .toBuffer();

    const gifMeta = await sharp(mainBuffer).metadata();
    mainWidth = gifMeta.width!;
    mainHeight = gifMeta.height!;
    mainFormat = 'gif';
  } else {
    // Convert to WebP for all other formats
    mainBuffer = await sharp(input)
      .rotate() // Auto-rotate based on EXIF orientation before stripping metadata
      .resize(MAIN_CONFIG.maxWidth, MAIN_CONFIG.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: MAIN_CONFIG.quality })
      .toBuffer();

    const webpMeta = await sharp(mainBuffer).metadata();
    mainWidth = webpMeta.width!;
    mainHeight = webpMeta.height!;
    mainFormat = 'webp';
  }

  // Generate thumbnail - always WebP, use first frame for animated GIFs
  // Uses 'attention' position for smart cropping that focuses on interesting regions
  const thumbBuffer = await sharp(input, { animated: false }) // First frame only for GIFs
    .rotate()
    .resize(THUMB_CONFIG.width, THUMB_CONFIG.height, {
      fit: 'cover',
      position: 'attention', // Smart cropping based on luminance, color saturation, skin tones
    })
    .webp({ quality: THUMB_CONFIG.quality })
    .toBuffer();

  return {
    main: {
      buffer: mainBuffer,
      width: mainWidth,
      height: mainHeight,
      format: mainFormat,
    },
    thumbnail: {
      buffer: thumbBuffer,
      width: THUMB_CONFIG.width,
      height: THUMB_CONFIG.height,
      format: 'webp',
    },
    originalSize,
    optimizedSize: mainBuffer.length + thumbBuffer.length,
  };
}

/**
 * Calculate compression savings as a percentage
 */
export function calculateSavings(originalSize: number, optimizedSize: number): string {
  if (originalSize === 0) return '0%';
  const savings = ((originalSize - optimizedSize) / originalSize) * 100;
  return `${Math.round(savings)}%`;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
