import sharp from 'sharp';

export interface CVAnalysisResult {
  moire: { detected: boolean; score: number };
  pixel_grid: { detected: boolean; score: number };
  depth_anomaly: { detected: boolean; score: number };
  glare: { detected: boolean; score: number };
}

/**
 * Simple 1D FFT implementation (Cooley-Tukey)
 * Input: Real valued array
 * Output: Magnitude array (first half)
 */
function fftMagnitude(input: number[]): number[] {
  const n = input.length;
  // Ensure n is power of 2
  if ((n & (n - 1)) !== 0) {
    throw new Error("FFT input size must be power of 2");
  }

  // Interlace
  const real = new Float64Array(input);
  const imag = new Float64Array(n).fill(0);

  // Bit-reversal permutation (simplified for JS)
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Butterfly updates
  let l2 = 1;
  for (let l = 0; l < Math.log2(n); l++) {
    const l1 = l2;
    l2 <<= 1;
    const theta = -Math.PI / l1;
    
    // In actual implementation we compute W for each step
    // But for simplicity/speed in JS we can loop
    
    for (let j = 0; j < l1; j++) {
        // Precompute cos/sin for this stage could be faster but this is fine
        const wr = Math.cos(theta * j);
        const wi = Math.sin(theta * j);
        
        for (let i = j; i < n; i += l2) {
            const i1 = i + l1;
            const t1 = wr * real[i1] - wi * imag[i1];
            const t2 = wr * imag[i1] + wi * real[i1];
            
            real[i1] = real[i] - t1;
            imag[i1] = imag[i] - t2;
            real[i] += t1;
            imag[i] += t2;
        }
    }
  }

  // Compute magnitudes
  const mags = [];
  for(let i=0; i<n/2; i++) {
      mags.push(Math.sqrt(real[i]*real[i] + imag[i]*imag[i]));
  }
  return mags;
}

/**
 * Basic computer vision analysis for screen detection artifacts
 */
export async function analyzeScreenArtifacts(buffer: Buffer): Promise<CVAnalysisResult> {
  // Decode image using sharp
  let width: number;
  let height: number;
  let data: Buffer;
  let channels: number;

  try {
    const { data: rawData, info } = await sharp(buffer)
      .ensureAlpha() // Ensure 4 channels (RGBA) for consistent indexing
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    width = info.width;
    height = info.height;
    channels = info.channels; // Should be 4 due to ensureAlpha()
    data = rawData;
  } catch (e) {
    // Return safe defaults if not a valid image
    return {
      moire: { detected: false, score: 0 },
      pixel_grid: { detected: false, score: 0 },
      depth_anomaly: { detected: false, score: 0 },
      glare: { detected: false, score: 0 },
    };
  }

  // 1. Glare Detection
  // Check for saturated clusters
  let highLumaCount = 0;
  const totalPixels = width * height;
  
  // Use a stride to speed up analysis if image is large
  const stride = Math.max(1, Math.floor(Math.sqrt(totalPixels / 100000))); 
  
  // Sampled Luma buffer for frequency analysis
  // We'll take a center crop or downsample for FFT
  const fftSize = 512;
  const useFFT = width >= fftSize && height >= fftSize;
  const lumaRow = new Float64Array(fftSize).fill(0);
  const lumaCol = new Float64Array(fftSize).fill(0);
  
  // Center coordinates for crop
  const startX = Math.floor((width - fftSize) / 2);
  const startY = Math.floor((height - fftSize) / 2);

  for (let i = 0; i < totalPixels; i += stride) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    
    // Y = 0.299R + 0.587G + 0.114B
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (luma > 250) {
      highLumaCount++;
    }
  }

  const glareRatio = (highLumaCount * stride) / totalPixels;
  const glareDetected = glareRatio > 0.01; // > 1% pixels are blown out
  const glareScore = Math.min(100, Math.round(glareRatio * 1000));

  // 2. Moiré & Pixel Grid (Frequency Analysis)
  // We extract a center row and center column to check for periodic signals
  let moireDetected = false;
  let moireScore = 0;
  let gridDetected = false;
  let gridScore = 0;

  if (useFFT) {
    // Fill luma buffers from center crop
    // Horizontal line
    const rowOffset = (startY + fftSize/2) * width * 4;
    for (let x = 0; x < fftSize; x++) {
        const off = rowOffset + (startX + x) * 4;
        lumaRow[x] = 0.299 * data[off] + 0.587 * data[off+1] + 0.114 * data[off+2];
    }
    
    // Vertical line
    const colX = startX + fftSize/2;
    for (let y = 0; y < fftSize; y++) {
        const off = (startY + y) * width * 4 + colX * 4;
        lumaCol[y] = 0.299 * data[off] + 0.587 * data[off+1] + 0.114 * data[off+2];
    }

    const rowMags = fftMagnitude(Array.from(lumaRow));
    const colMags = fftMagnitude(Array.from(lumaCol));
    
    // Analyze Spectrum
    // DC component is at 0. Low frequencies are image structure.
    // High frequencies with sharp peaks indicate grid/moire.
    // We look for peaks in the upper half of the spectrum.
    
    const analyzeSpectrum = (mags: number[]) => {
        let maxPeak = 0;
        let mean = 0;
        // Skip DC and very low freq
        const startBin = 10;
        for(let i=startBin; i<mags.length; i++) {
            mean += mags[i];
            if (mags[i] > maxPeak) maxPeak = mags[i];
        }
        mean /= (mags.length - startBin);
        
        // Peak-to-average ratio
        return maxPeak / (mean || 1);
    };
    
    const rowPeakRatio = analyzeSpectrum(rowMags);
    const colPeakRatio = analyzeSpectrum(colMags);
    
    // Thresholds (empirically determined)
    // Strong periodic signal usually > 10-20x average noise floor
    const peakThreshold = 15;
    
    if (rowPeakRatio > peakThreshold || colPeakRatio > peakThreshold) {
        // High frequency peak detected
        // Very high frequency (near Nyquist) -> Pixel Grid
        // Mid-High frequency -> Moiré
        
        // This is a simplification. A real grid detector would check the specific frequency bin.
        // Assuming > 30% of spectrum range is "high freq"
        
        moireDetected = true;
        moireScore = Math.min(100, Math.round(Math.max(rowPeakRatio, colPeakRatio) * 2));
        
        // If the peak is extremely strong, it's likely a pixel grid
        if (Math.max(rowPeakRatio, colPeakRatio) > 30) {
            gridDetected = true;
            gridScore = Math.min(100, Math.round(Math.max(rowPeakRatio, colPeakRatio) * 3));
        }
    }
  }

  // 3. Depth Anomaly (Flatness)
  // Check for gradient distribution.
  // A simple heuristic: calculate variance of the Laplacian (edge energy).
  // "Flat" images (like a photo of a paper) might have uniform edge characteristics or lack depth-of-field blur variation.
  // This is hard to do reliably without ML. 
  // We'll use a placeholder heuristic: "Low Variance of Variance".
  // Real scenes usually have areas of high detail (in focus) and low detail (out of focus).
  // Flat captures often have uniform detail (all in focus) or uniform blur.
  
  // We'll implement a basic check: Is the image suspiciously "uniform" in its texture?
  // We divide image into grid, calculate variance of each cell.
  // If variance of cell-variances is low, it might be flat.
  
  let depthAnomalyDetected = false;
  let depthScore = 0;
  
  if (width > 200 && height > 200) {
      const gridX = 4;
      const gridY = 4;
      const cellW = Math.floor(width / gridX);
      const cellH = Math.floor(height / gridY);
      const cellVariances: number[] = [];
      
      for(let gy=0; gy<gridY; gy++) {
          for(let gx=0; gx<gridX; gx++) {
              // Sample pixels in this cell (sparse sampling)
              let sum = 0;
              let sqSum = 0;
              let count = 0;
              
              const startX = gx * cellW;
              const startY = gy * cellH;
              
              // Sample 100 pixels per cell
              for(let k=0; k<100; k++) {
                  const x = startX + Math.floor(Math.random() * cellW);
                  const y = startY + Math.floor(Math.random() * cellH);
                  const off = (y * width + x) * 4;
                  if (off < data.length) {
                    const luma = 0.299 * data[off] + 0.587 * data[off+1] + 0.114 * data[off+2];
                    sum += luma;
                    sqSum += luma * luma;
                    count++;
                  }
              }
              
              if (count > 0) {
                  const mean = sum / count;
                  const variance = (sqSum / count) - (mean * mean);
                  cellVariances.push(variance);
              }
          }
      }
      
      // Calculate variance of cell variances
      let vSum = 0;
      let vSqSum = 0;
      cellVariances.forEach(v => { vSum += v; vSqSum += v*v; });
      const vMean = vSum / cellVariances.length;
      const vOfV = (vSqSum / cellVariances.length) - (vMean * vMean);
      
      // Heuristic: If variance of variances is very low, the image has uniform texture (flat?)
      // Natural images usually have high vOfV (sky is smooth, ground is textured).
      // Screen captures or photos of docs are often uniform.
      
      // Threshold is arbitrary/experimental
      if (vMean > 10 && vOfV < 100) { // Has detail (vMean > 10) but is uniform (vOfV < 100)
          depthAnomalyDetected = true;
          depthScore = 60; // Moderate confidence
      }
  }

  return {
    moire: { detected: moireDetected, score: moireScore },
    pixel_grid: { detected: gridDetected, score: gridScore },
    depth_anomaly: { detected: depthAnomalyDetected, score: depthScore },
    glare: { detected: glareDetected, score: glareScore },
  };
}
