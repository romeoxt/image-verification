import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

// Configuration
const STORAGE_DIR = process.env.STORAGE_DIR || './uploads';
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

// Initialize storage on startup
ensureStorageDir();

export interface StoredFile {
  id: string;
  filename: string;
  path: string;
  url: string;
  mimetype: string;
  size: number;
}

/**
 * Save a buffer to disk
 */
export async function saveFile(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string
): Promise<StoredFile> {
  const id = randomUUID();
  const ext = path.extname(originalFilename) || getExtFromMime(mimetype);
  const filename = `${id}${ext}`;
  const filePath = path.join(STORAGE_DIR, filename);

  await fs.writeFile(filePath, buffer);

  return {
    id,
    filename,
    path: filePath,
    url: `${BASE_URL}/v1/assets/${filename}`,
    mimetype,
    size: buffer.length,
  };
}

/**
 * Get a file stream from disk
 */
export async function getFile(filename: string): Promise<{ stream: any; mimetype: string } | null> {
  const filePath = path.join(STORAGE_DIR, filename);
  
  // Security check: prevent directory traversal
  if (!filePath.startsWith(path.resolve(STORAGE_DIR))) {
    return null;
  }

  try {
    // Check if file exists
    await fs.access(filePath);
    
    // Determine mimetype
    const ext = path.extname(filename).toLowerCase();
    const mimetype = getMimeFromExt(ext);

    // Return stream (Fastify handles streams efficiently)
    // Note: We're returning the path for Fastify's sendFile, 
    // or we could return a ReadStream. For simplicity with fastify-static or manual sending:
    return { stream: await fs.readFile(filePath), mimetype }; 
  } catch {
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(STORAGE_DIR, filename);
    
    // Security check
    if (!filePath.startsWith(path.resolve(STORAGE_DIR))) {
        return false;
    }

    try {
        await fs.unlink(filePath);
        return true;
    } catch {
        return false;
    }
}

// Helpers
function getExtFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'video/mp4': return '.mp4';
    case 'application/c2pa': return '.c2pa';
    default: return '';
  }
}

function getMimeFromExt(ext: string): string {
  switch (ext) {
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.mp4': return 'video/mp4';
    case '.c2pa': return 'application/c2pa';
    default: return 'application/octet-stream';
  }
}

