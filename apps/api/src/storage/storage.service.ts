import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || 'nexcart-storage-bucket';
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy-key',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy-secret',
            },
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'products'): Promise<string> {
        try {
            const extension = path.extname(file.originalname);
            const filename = `${folder}/${uuidv4()}${extension}`;

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
                Body: file.buffer,
                ContentType: file.mimetype,
                // ACL: 'public-read' // Uncomment if bucket policies allow public read ACLs
            });

            await this.s3Client.send(command);

            // Return the public URL
            return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new InternalServerErrorException('Failed to upload file to S3');
        }
    }
}
