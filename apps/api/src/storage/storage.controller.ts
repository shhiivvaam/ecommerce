import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded or file type is invalid');
    }
    const fileUrl = await this.storageService.uploadFile(file);

    return {
      message: 'File uploaded successfully',
      url: fileUrl,
    };
  }

  @Post('presigned-url')
  async getPresignedUrl(
    @Body() body: { fileName: string; mimeType: string; folder?: string },
  ) {
    if (!body?.fileName || !body?.mimeType) {
      throw new BadRequestException('fileName and mimeType are required');
    }
    return this.storageService.generatePresignedUrl(
      body.fileName,
      body.mimeType,
      body.folder || 'products',
    );
  }
}
