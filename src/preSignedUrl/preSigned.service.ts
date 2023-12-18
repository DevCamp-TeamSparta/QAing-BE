import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PresignedService {
  constructor(private configService: ConfigService) {}

  private createS3Client(): S3Client {
    return new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getUploadPresignedUrl(filename: string, type: string): Promise<string> {
    const client = this.createS3Client();
    const command = new PutObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: filename,
      ContentType: type,
    });

    return getSignedUrl(client, command);
  }

  async getDeletePresignedUrl(filename: string): Promise<string> {
    const client = this.createS3Client();
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: filename,
    });

    return getSignedUrl(client, command);
  }
}
