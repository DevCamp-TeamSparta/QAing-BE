import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/models/users.model';
import { Model } from 'mongoose';

@Injectable()
export class PresignedService {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

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
    try {
      const client = this.createS3Client();
      const command = new PutObjectCommand({
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: filename,
        ContentType: type,
      });

      return getSignedUrl(client, command);
    } catch {
      throw new Error('presignedUrl 생성 중 에러 발생');
    }
  }

  constructFileUrl(filename: string): string {
    return `https://static.qaing.co/${filename}`;
  }

  async updateUserFile(userId: string, fileUrl: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { userProfileImg: fileUrl });
  }
}
