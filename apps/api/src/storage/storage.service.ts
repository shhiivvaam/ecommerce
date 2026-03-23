import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET') || 'reyva-storage-bucket';
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('AWS_ACCESS_KEY_ID') || 'dummy-key',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
          'dummy-secret',
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    try {
      const extension = path.extname(file.originalname);
      const filename = `${folder}/${uuidv4()}${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: Buffer.from(file.buffer),
        ContentLength: file.size,
        ContentType: file.mimetype,
        // ACL: 'public-read' // Uncomment if bucket policies allow public read ACLs
      });

      await this.s3Client.send(command);

      // Return the public URL
      const region =
        this.configService.get<string>('AWS_REGION') || 'ap-south-1';
      return `https://${this.bucketName}.s3.${region}.amazonaws.com/${filename}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Error uploading file to S3', {
        error: errorMessage,
        filename: file.originalname,
        folder,
        bucket: this.bucketName,
      });
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async generatePresignedUrl(
    fileName: string,
    mimeType: string,
    folder: string = 'products',
  ): Promise<{ uploadUrl: string; publicUrl: string; filename: string }> {
    try {
      const extension = path.extname(fileName);
      const uniqueFilename = `${folder}/${uuidv4()}${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        ContentType: mimeType,
        // Optional ACL config:
        // ACL: 'public-read'
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600, // URL valid for 1 hour
      });

      const region =
        this.configService.get<string>('AWS_REGION') || 'ap-south-1';
      const publicUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;

      return { uploadUrl, publicUrl, filename: uniqueFilename };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating S3 presigned URL', {
        error: errorMessage,
        fileName,
        folder,
        bucket: this.bucketName,
      });
      throw new InternalServerErrorException(
        'Failed to generate presigned upload URL',
      );
    }
  }
}
