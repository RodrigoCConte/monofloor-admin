/**
 * Files Routes
 * Serves files stored in PostgreSQL database
 */

import { Router, Request, Response } from 'express';
import { getFile, getStorageStats } from '../services/db-storage.service';

const router = Router();

/**
 * GET /files/:id
 * Serve a file from the database
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await getFile(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' },
      });
    }

    // Set headers
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

    // Cache for 1 day (files are immutable)
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Send file data
    res.send(file.data);
  } catch (error) {
    console.error('[Files] Error serving file:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to serve file' },
    });
  }
});

/**
 * GET /files/stats (admin only - for monitoring)
 * Get storage statistics
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getStorageStats();

    // Format sizes for readability
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    res.json({
      success: true,
      data: {
        totalFiles: stats.totalFiles,
        totalSize: formatSize(stats.totalSizeBytes),
        totalSizeBytes: stats.totalSizeBytes,
        byType: Object.fromEntries(
          Object.entries(stats.byType).map(([type, data]) => [
            type,
            {
              count: data.count,
              size: formatSize(data.sizeBytes),
              sizeBytes: data.sizeBytes,
            },
          ])
        ),
      },
    });
  } catch (error) {
    console.error('[Files] Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get storage stats' },
    });
  }
});

export default router;
