import { IUser } from '../models/client/User';
import { IAdmin } from '../models/admin/Admin';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        phone: string;
        email?: string;
        role: string;
      };
      admin?: {
        adminId: string;
        email: string;
        role: string;
      };
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

export {};