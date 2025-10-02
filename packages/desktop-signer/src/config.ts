/**
 * Config management for ~/.popc directory
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

const CONFIG_DIR = join(homedir(), '.popc');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const PRIVATE_KEY_FILE = join(CONFIG_DIR, 'key.pem');
const PUBLIC_KEY_FILE = join(CONFIG_DIR, 'pub.pem');

const ConfigSchema = z.object({
  deviceId: z.string(),
  publicKeyFingerprint: z.string(),
  securityLevel: z.string(),
  enrolledAt: z.string(),
  baseUrl: z.string(),
  platform: z.string().default('web'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Ensure ~/.popc directory exists
 */
export async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Save configuration
 */
export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Load configuration
 */
export async function loadConfig(): Promise<Config | null> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return ConfigSchema.parse(JSON.parse(data));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save private key (PEM format)
 */
export async function savePrivateKey(pemData: string): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(PRIVATE_KEY_FILE, pemData, { mode: 0o600 });
}

/**
 * Load private key
 */
export async function loadPrivateKey(): Promise<string | null> {
  try {
    return await fs.readFile(PRIVATE_KEY_FILE, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save public key (PEM format)
 */
export async function savePublicKey(pemData: string): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(PUBLIC_KEY_FILE, pemData, { mode: 0o600 });
}

/**
 * Load public key
 */
export async function loadPublicKey(): Promise<string | null> {
  try {
    return await fs.readFile(PUBLIC_KEY_FILE, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if enrolled (config exists)
 */
export async function isEnrolled(): Promise<boolean> {
  const config = await loadConfig();
  return config !== null;
}

/**
 * Get config directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Verify private key file permissions
 */
export async function checkKeyPermissions(): Promise<boolean> {
  try {
    const stats = await fs.stat(PRIVATE_KEY_FILE);
    const mode = stats.mode & 0o777;
    return mode === 0o600;
  } catch {
    return false;
  }
}
