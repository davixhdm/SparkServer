import multer from 'multer';
import env from '../../config/env';
import { BadRequestError } from '../../utils/errors';

// Use memoryStorage for direct Cloudinary upload (no disk writes)
const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const allowedTypes = [
    ...env.ALLOWED_IMAGE_TYPES,
    ...env.ALLOWED_VIDEO_TYPES,
    ...env.ALLOWED_DOC_TYPES,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${file.mimetype} is not allowed`));
  }
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.CLOUDINARY_MAX_FILE_SIZE || env.MAX_FILE_SIZE,
  },
}).single('file');

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.CLOUDINARY_MAX_FILE_SIZE || env.MAX_FILE_SIZE,
  },
}).array('files', 10);

export const uploadFields = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.CLOUDINARY_MAX_FILE_SIZE || env.MAX_FILE_SIZE,
  },
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'media', maxCount: 5 },
  { name: 'document', maxCount: 3 },
]);