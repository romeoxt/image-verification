import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://image-verification-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const manifestFile = formData.get('manifest') as File;

    if (!imageFile || !manifestFile) {
      return NextResponse.json(
        { error: 'Both image and manifest files are required' },
        { status: 400 }
      );
    }

    // Create temp directory for this verification
    const tempDir = join(tmpdir(), `popc-verify-${randomUUID()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Save files to temp directory
      const imagePath = join(tempDir, imageFile.name);
      const manifestPath = join(tempDir, manifestFile.name);

      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const manifestBuffer = Buffer.from(await manifestFile.arrayBuffer());

      await writeFile(imagePath, imageBuffer);
      await writeFile(manifestPath, manifestBuffer);

      // Create form data for backend API
      const backendFormData = new FormData();
      backendFormData.append('image', new Blob([imageBuffer], { type: imageFile.type }), imageFile.name);
      backendFormData.append('manifest', new Blob([manifestBuffer], { type: 'application/json' }), manifestFile.name);

      // Call backend verification API
      const verifyResponse = await fetch(`${API_BASE_URL}/v1/verify`, {
        method: 'POST',
        body: backendFormData,
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Backend verification failed');
      }

      const verificationResult = await verifyResponse.json();

      // Clean up temp files
      await unlink(imagePath).catch(() => {});
      await unlink(manifestPath).catch(() => {});
      await unlink(tempDir).catch(() => {});

      return NextResponse.json({
        success: true,
        verificationId: verificationResult.verificationId,
        verdict: verificationResult.verdict,
        mode: verificationResult.mode,
        confidence: verificationResult.confidence,
      });
    } catch (error) {
      // Clean up on error
      await unlink(join(tempDir, imageFile.name)).catch(() => {});
      await unlink(join(tempDir, manifestFile.name)).catch(() => {});
      await unlink(tempDir).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Verification upload error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Verification failed',
        details: 'Failed to process verification request'
      },
      { status: 500 }
    );
  }
}

