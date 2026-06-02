import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import env from '../../config/env';
import { logger } from '../../utils/logger';

let cloudinaryConfigured = false;

interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resourceType: string;
  duration?: number;
  error?: string;
}

function initCloudinary(): void {
  if (cloudinaryConfigured) return;

  if (env.CLOUDINARY && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryConfigured = true;
    logger.info('Cloudinary configured successfully', {
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      folder: env.CLOUDINARY_UPLOAD_FOLDER
    });
  } else {
    logger.warn('Cloudinary not fully configured — media uploads will fail');
  }
}

initCloudinary();

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

function bufferToDataURI(buffer: Buffer, originalName: string): string {
  const base64 = buffer.toString('base64');
  const ext = path.extname(originalName).toLowerCase();
  const mimeType = getMimeType(ext);
  return `data:${mimeType};base64,${base64}`;
}

export async function uploadImage(
  fileBuffer: Buffer,
  originalName: string,
  folder?: string
): Promise<UploadResult> {
  if (!env.CLOUDINARY) {
    return { success: false, url: '', publicId: '', format: '', width: 0, height: 0, bytes: 0, resourceType: 'image', error: 'Cloudinary disabled' };
  }

  try {
    const dataURI = bufferToDataURI(fileBuffer, originalName);
    const uploadFolder = folder || env.CLOUDINARY_UPLOAD_FOLDER;

    logger.info('Uploading image to Cloudinary', {
      originalName,
      size: fileBuffer.length,
      folder: uploadFolder
    });

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: uploadFolder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    logger.info('Image uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: 'image',
    };
  } catch (error: any) {
    logger.error('Cloudinary image upload failed', {
      error: error.message,
      code: error.code,
      http_code: error.http_code
    });
    return {
      success: false,
      url: '',
      publicId: '',
      format: '',
      width: 0,
      height: 0,
      bytes: 0,
      resourceType: 'image',
      error: error.message
    };
  }
}

export async function uploadVideo(
  fileBuffer: Buffer,
  originalName: string,
  folder?: string
): Promise<UploadResult> {
  if (!env.CLOUDINARY) {
    return { success: false, url: '', publicId: '', format: '', width: 0, height: 0, bytes: 0, resourceType: 'video', error: 'Cloudinary disabled' };
  }

  try {
    const dataURI = bufferToDataURI(fileBuffer, originalName);
    const uploadFolder = folder || env.CLOUDINARY_UPLOAD_FOLDER;

    logger.info('Uploading video to Cloudinary', {
      originalName,
      size: fileBuffer.length,
      folder: uploadFolder
    });

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: uploadFolder,
      resource_type: 'video',
      eager: [
        { streaming_profile: 'hd', format: 'mp4' },
      ],
      eager_async: true,
    });

    logger.info('Video uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: 'video',
      duration: result.duration,
    };
  } catch (error: any) {
    logger.error('Cloudinary video upload failed', {
      error: error.message,
      code: error.code,
      http_code: error.http_code
    });
    return {
      success: false,
      url: '',
      publicId: '',
      format: '',
      width: 0,
      height: 0,
      bytes: 0,
      resourceType: 'video',
      error: error.message
    };
  }
}

export async function deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
  if (!env.CLOUDINARY) return false;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info('Cloudinary file deleted', { publicId });
    return true;
  } catch (error: any) {
    logger.error('Cloudinary file deletion failed', { publicId, error: error.message });
    return false;
  }
}

export function getOptimizedUrl(publicId: string, options?: { width?: number; height?: number; format?: string }): string {
  return cloudinary.url(publicId, {
    width: options?.width,
    height: options?.height,
    crop: 'limit',
    format: options?.format || 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });
}