/**
 * Database Storage Service
 * Handles file storage in PostgreSQL instead of local filesystem
 * This solves the ephemeral storage issue on Railway
 */

import { UploadType } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface SaveFileOptions {
  filename: string;
  mimetype: string;
  data: Buffer;
  type: UploadType;
  userId?: string;
  entityId?: string;
}

interface SavedFile {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * Save a file to the database
 */
export async function saveFile(options: SaveFileOptions): Promise<SavedFile> {
  const { filename, mimetype, data, type, userId, entityId } = options;

  const upload = await prisma.upload.create({
    data: {
      filename,
      mimetype,
      size: data.length,
      data,
      type,
      userId,
      entityId,
    },
  });

  console.log(`[DB Storage] Saved file: ${filename} (${upload.id}) - ${data.length} bytes`);

  return {
    id: upload.id,
    url: `/files/${upload.id}`,
    filename: upload.filename,
    mimetype: upload.mimetype,
    size: upload.size,
  };
}

/**
 * Get a file from the database by ID
 */
export async function getFile(id: string): Promise<{
  data: Buffer;
  filename: string;
  mimetype: string;
  size: number;
} | null> {
  const upload = await prisma.upload.findUnique({
    where: { id },
  });

  if (!upload) {
    return null;
  }

  return {
    data: upload.data,
    filename: upload.filename,
    mimetype: upload.mimetype,
    size: upload.size,
  };
}

/**
 * Delete a file from the database
 */
export async function deleteFile(id: string): Promise<boolean> {
  try {
    await prisma.upload.delete({
      where: { id },
    });
    console.log(`[DB Storage] Deleted file: ${id}`);
    return true;
  } catch (error) {
    console.error(`[DB Storage] Failed to delete file ${id}:`, error);
    return false;
  }
}

/**
 * Get files by user ID
 */
export async function getFilesByUser(userId: string, type?: UploadType): Promise<SavedFile[]> {
  const uploads = await prisma.upload.findMany({
    where: {
      userId,
      ...(type && { type }),
    },
    select: {
      id: true,
      filename: true,
      mimetype: true,
      size: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return uploads.map((u) => ({
    id: u.id,
    url: `/files/${u.id}`,
    filename: u.filename,
    mimetype: u.mimetype,
    size: u.size,
  }));
}

/**
 * Get files by entity ID (badge, campaign, etc)
 */
export async function getFilesByEntity(entityId: string, type?: UploadType): Promise<SavedFile[]> {
  const uploads = await prisma.upload.findMany({
    where: {
      entityId,
      ...(type && { type }),
    },
    select: {
      id: true,
      filename: true,
      mimetype: true,
      size: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return uploads.map((u) => ({
    id: u.id,
    url: `/files/${u.id}`,
    filename: u.filename,
    mimetype: u.mimetype,
    size: u.size,
  }));
}

/**
 * Save profile photo and return URL
 */
export async function saveProfilePhoto(userId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'PROFILE_PHOTO',
    userId,
  });
  return saved.url;
}

/**
 * Save document and return URL
 */
export async function saveDocument(userId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'DOCUMENT',
    userId,
  });
  return saved.url;
}

/**
 * Save badge icon and return URL
 */
export async function saveBadgeIcon(badgeId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'BADGE',
    entityId: badgeId,
  });
  return saved.url;
}

/**
 * Save campaign media (banner, slides) and return URL
 */
export async function saveCampaignMedia(campaignId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'CAMPAIGN',
    entityId: campaignId,
  });
  return saved.url;
}

/**
 * Save feed post image and return URL
 */
export async function saveFeedImage(userId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'FEED',
    userId,
  });
  return saved.url;
}

/**
 * Save notification video and return URL
 */
export async function saveNotificationVideo(notificationId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'NOTIFICATION',
    entityId: notificationId,
  });
  return saved.url;
}

/**
 * Save help request file (audio/video) and return URL
 */
export async function saveHelpRequestFile(helpRequestId: string, file: Express.Multer.File): Promise<string> {
  const saved = await saveFile({
    filename: file.originalname,
    mimetype: file.mimetype,
    data: file.buffer,
    type: 'HELP_REQUEST',
    entityId: helpRequestId,
  });
  return saved.url;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  byType: Record<string, { count: number; sizeBytes: number }>;
}> {
  const uploads = await prisma.upload.findMany({
    select: {
      type: true,
      size: true,
    },
  });

  const byType: Record<string, { count: number; sizeBytes: number }> = {};
  let totalSizeBytes = 0;

  for (const upload of uploads) {
    totalSizeBytes += upload.size;
    if (!byType[upload.type]) {
      byType[upload.type] = { count: 0, sizeBytes: 0 };
    }
    byType[upload.type].count++;
    byType[upload.type].sizeBytes += upload.size;
  }

  return {
    totalFiles: uploads.length,
    totalSizeBytes,
    byType,
  };
}

export { UploadType };
