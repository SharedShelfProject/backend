import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (
      req: Request & { user?: { id: string } },
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const userId = req.user?.id ?? 'unknown';
      const timestamp = Date.now();
      const ext = extname(file.originalname);
      cb(null, `avatar-${userId}-${timestamp}${ext}`);
    },
  }),
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
