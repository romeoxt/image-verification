import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { authenticateApiKey } from '../lib/auth.js';
import { getDb } from '../lib/db.js';

const STORAGE_DIR = process.env.STORAGE_DIR || './uploads';

export async function assetRoutes(fastify: FastifyInstance) {
    
    // Serve static files securely
    fastify.get<{ Params: { filename: string } }>('/v1/assets/:filename', async (request, reply) => {
        const { filename } = request.params;
        
        // Security: Prevent directory traversal
        const safeFilename = path.basename(filename);
        const filePath = path.join(STORAGE_DIR, safeFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return reply.code(404).send({ error: 'not_found', message: 'Asset not found' });
        }

        // Optional: Add authentication here if assets should be private
        // For now, we allow public read access if they have the URL (obfuscated ID)
        
        // Stream the file
        const stream = fs.createReadStream(filePath);
        
        // Set correct content type
        const ext = path.extname(safeFilename).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.mp4') mimeType = 'video/mp4';
        
        reply.type(mimeType);
        return reply.send(stream);
    });
}

