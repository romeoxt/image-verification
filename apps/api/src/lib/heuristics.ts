/**
 * Heuristic analysis for media authenticity verification
 *
 * This module provides non-cryptographic signals for media verification
 * when a cryptographic manifest is not available.
 */

import exifr from 'exifr';

// Type definitions matching OpenAPI HeuristicSignals schema
export interface ExifSignals {
  present: boolean;
  camera?: string;
  software?: string;
  createDate?: string;
  gps?: {
    lat?: number;
    lon?: number;
  };
}

export interface JpegSignals {
  recompressionDetected?: boolean;
  quantTableAnomaly?: boolean;
  progressive?: boolean;
}

export interface NoiseSignals {
  prnuChecked: boolean;
  matched?: boolean;
  score?: number;
}

export interface MlSignals {
  model?: string;
  score?: number;
}

export interface ReverseImageSignals {
  attempted: boolean;
  earliestFound?: string;
  source?: string;
}

export interface UploadChannelSignals {
  signedForm?: boolean;
}

export interface HeuristicSignals {
  exif?: ExifSignals;
  jpeg?: JpegSignals;
  noise?: NoiseSignals;
  ml?: MlSignals;
  reverse_image?: ReverseImageSignals;
  upload_channel?: UploadChannelSignals;
}

/**
 * Analyze EXIF metadata from image buffer
 *
 * Extracts camera information, software tags, timestamps, and GPS coordinates
 * from JPEG/HEIC images using the exifr library.
 */
export async function analyzeExif(buffer: Buffer): Promise<ExifSignals> {
  try {
    const exifData = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      ifd1: false,
      interop: false,
    });

    if (!exifData) {
      return { present: false };
    }

    const signals: ExifSignals = { present: true };

    // Extract camera make/model
    if (exifData.Make || exifData.Model) {
      const make = exifData.Make?.trim() || '';
      const model = exifData.Model?.trim() || '';
      signals.camera = [make, model].filter(Boolean).join(' ').trim();
    }

    // Extract software tag
    if (exifData.Software) {
      signals.software = exifData.Software.trim();
    }

    // Extract creation date
    if (exifData.DateTimeOriginal) {
      signals.createDate = new Date(exifData.DateTimeOriginal).toISOString();
    } else if (exifData.DateTime) {
      signals.createDate = new Date(exifData.DateTime).toISOString();
    } else if (exifData.CreateDate) {
      signals.createDate = new Date(exifData.CreateDate).toISOString();
    }

    // Extract GPS coordinates
    if (exifData.latitude !== undefined && exifData.longitude !== undefined) {
      signals.gps = {
        lat: exifData.latitude,
        lon: exifData.longitude,
      };
    }

    return signals;
  } catch (error) {
    // If EXIF parsing fails, return no EXIF present
    return { present: false };
  }
}

/**
 * Analyze JPEG compression characteristics
 *
 * Detects:
 * - Progressive vs baseline JPEG encoding
 * - Recompression artifacts (multiple APP markers indicating editing)
 * - Quantization table anomalies
 */
export async function analyzeJpeg(buffer: Buffer): Promise<JpegSignals> {
  try {
    const signals: JpegSignals = {};

    // Check if this is a JPEG file
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      // Not a JPEG, return empty signals
      return signals;
    }

    // Detect progressive JPEG by checking for SOF2 (0xFFC2) marker
    let isProgressive = false;
    let appMarkerCount = 0;
    const quantTables: number[][] = [];

    // Parse JPEG markers
    let offset = 2; // Skip SOI marker
    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xFF) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];

      // SOF2 indicates progressive JPEG
      if (marker === 0xC2) {
        isProgressive = true;
      }

      // Count APP markers (APP0-APP15: 0xE0-0xEF)
      if (marker >= 0xE0 && marker <= 0xEF) {
        appMarkerCount++;
      }

      // DQT (Define Quantization Table) marker
      if (marker === 0xDB) {
        // Basic check: multiple DQT segments or unusual table values
        quantTables.push([]);
      }

      // Get segment length and skip to next marker
      if (marker >= 0xC0 && marker <= 0xFE && marker !== 0xD8 && marker !== 0xD9) {
        const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
        offset += 2 + length;
      } else {
        offset += 2;
      }

      // Stop at SOS (Start of Scan) for progressive check
      if (marker === 0xDA) {
        break;
      }
    }

    signals.progressive = isProgressive;

    // Heuristic: Multiple APP markers suggest editing/recompression
    // Typical camera JPEG: 1-2 APP markers (JFIF, EXIF)
    // Edited JPEG: 3+ APP markers (Adobe, XMP, etc.)
    if (appMarkerCount >= 3) {
      signals.recompressionDetected = true;
    }

    // Heuristic: Multiple quantization tables might indicate manipulation
    // This is a conservative check - more sophisticated analysis would examine table values
    if (quantTables.length > 2) {
      signals.quantTableAnomaly = true;
    }

    return signals;
  } catch (error) {
    // If JPEG parsing fails, return empty signals
    return {};
  }
}

/**
 * Compute confidence score from heuristic signals
 *
 * Scoring model (additive, clamped to [0, 100]):
 * - Base score: 50
 * - +10 if EXIF present
 * - +10 if EXIF has camera info and no editing software tag
 * - -15 if JPEG recompression detected
 * - -10 if JPEG quantization table anomaly
 *
 * Higher scores indicate higher confidence that the media is authentic.
 * Lower scores indicate signs of manipulation or editing.
 */
export function computeHeuristicScore(signals: HeuristicSignals): number {
  let score = 50; // Base score

  // EXIF signals
  if (signals.exif) {
    if (signals.exif.present) {
      score += 10;

      // Bonus if camera present and no editing software
      if (signals.exif.camera && !signals.exif.software) {
        score += 10;
      }

      // Penalty if editing software detected
      if (signals.exif.software) {
        const software = signals.exif.software.toLowerCase();
        // Common photo editing software
        const editingSoftware = ['photoshop', 'gimp', 'lightroom', 'pixelmator', 'affinity'];
        if (editingSoftware.some(s => software.includes(s))) {
          score -= 5;
        }
      }
    }
  }

  // JPEG compression signals
  if (signals.jpeg) {
    if (signals.jpeg.recompressionDetected) {
      score -= 15;
    }
    if (signals.jpeg.quantTableAnomaly) {
      score -= 10;
    }
  }

  // PRNU signals (future)
  if (signals.noise) {
    if (signals.noise.matched && signals.noise.score !== undefined) {
      score += signals.noise.score * 0.3; // Add up to 30 points for strong PRNU match
    }
  }

  // ML signals (future)
  if (signals.ml && signals.ml.score !== undefined) {
    score += (signals.ml.score - 50) * 0.2; // Adjust by ML score
  }

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Run complete heuristic analysis pipeline
 *
 * Analyzes asset and returns all available signals plus confidence score
 */
export async function analyzeAsset(buffer: Buffer): Promise<{
  signals: HeuristicSignals;
  confidence_score: number;
}> {
  const signals: HeuristicSignals = {};

  // EXIF analysis
  signals.exif = await analyzeExif(buffer);

  // JPEG analysis (if applicable)
  signals.jpeg = await analyzeJpeg(buffer);

  // Noise analysis (placeholder)
  signals.noise = {
    prnuChecked: false,
  };

  // Reverse image search (placeholder)
  signals.reverse_image = {
    attempted: false,
  };

  // Compute confidence score
  const confidence_score = computeHeuristicScore(signals);

  return { signals, confidence_score };
}
