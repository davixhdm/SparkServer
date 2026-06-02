import { Request, Response, NextFunction } from 'express';
import { uploadImage, uploadVideo } from '../../services/external/cloudinaryService';
import { sendCreated, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      sendBadRequest(res, 'No file uploaded');
      return;
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const isImage = mimetype.startsWith('image/');
    const isVideo = mimetype.startsWith('video/');

    logger.info('Upload request received', {
      originalname,
      mimetype,
      size,
      type: isImage ? 'image' : isVideo ? 'video' : 'other'
    });

    if (!isImage && !isVideo) {
      sendBadRequest(res, 'Only images and videos are allowed');
      return;
    }

    const result = isImage
      ? await uploadImage(buffer, originalname)
      : await uploadVideo(buffer, originalname);

    if (result.success) {
      sendCreated(res, 'File uploaded successfully', {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        originalName: originalname,
        size: result.bytes,
        width: result.width,
        height: result.height,
        ...(result.duration && { duration: result.duration })
      });
    } else {
      sendBadRequest(res, result.error || 'Upload failed');
    }
  } catch (error: any) {
    logger.error('Upload controller error', { error: error.message });
    sendBadRequest(res, 'Upload failed: ' + error.message);
  }
}