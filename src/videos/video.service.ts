import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IssueFile } from 'src/models/issueFiles.model';
import { Folder } from 'src/models/folders.model';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { User } from 'src/models/users.model';
import * as crypto from 'crypto';

const execAsync = promisify(exec);
//테스트 커밋
@Injectable()
export class VideoService {
  private s3Client: S3Client;
  private folderUpdateSubscribers: Map<string, Function[]> = new Map();

  constructor(
    @InjectModel(IssueFile.name)
    private issueFileModel: Model<IssueFile>,
    @InjectModel(Folder.name)
    private folderModel: Model<Folder>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getFolderIdByUser(userId: string) {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const nowDate = new Date();
      const folder = new this.folderModel({
        folderName: `${nowDate.getFullYear()}-${
          nowDate.getMonth() + 1
        }-${nowDate.getDate()} ${
          nowDate.getHours() + 9
        }:${nowDate.getMinutes()}`,
        issues: [],
        status: false,
      });

      await folder.save();

      user.folders.push(folder._id);
      await user.save();

      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async processVideoAndImages(
    webmFile: Express.Multer.File,
    timestamps: number[],
    userId: string,
    folderId: string,
  ) {
    const tempWebmFilePath = path.join(__dirname, `${folderId}_temp.webm`);

    await this.writeTemporaryFile(webmFile.buffer, tempWebmFilePath);

    if (timestamps.length === 0) {
      console.log('타임 스탬프 배열 비어있음.');
      return;
    }

    try {
      const user = await this.userModel.findById(userId);
      const folder = await this.folderModel.findById(folderId);

      let issueNum: number = 1;
      for (const timestamp of timestamps) {
        const hashedImageName = `${this.hashString(
          `image_${folderId}_${issueNum}`,
        )}.jpg`;
        const hashedVideoName = `${this.hashString(
          `video_${folderId}_${issueNum}`,
        )}.mp4`;

        // 이미지와 비디오 처리
        const imageUrl = await this.processMedia(
          tempWebmFilePath,
          timestamp,
          hashedImageName,
          'image',
        );
        const videoUrl = await this.processMedia(
          tempWebmFilePath,
          timestamp,
          hashedVideoName,
          'video',
        );

        const createdIssueFile = await this.saveMediaUrlsToMongoDB(
          imageUrl,
          videoUrl,
          issueNum,
        );
        issueNum += 1;
        folder.issues.push(createdIssueFile._id);
      }

      if (folder.issues.length == timestamps.length) {
        folder.status = true;
        this.notifyFolderUpdate(folderId, folder);
      } else {
        throw new Error('이유 생성 중 에러 발생.');
      }

      await folder.save();
      await user.save();
      console.log('이미지 및 비디오 생성 완료!');
      return;
    } catch (err) {
      console.log('비디오 생성 중 에러 발생 : ', err);
      return;
    } finally {
      await this.deleteFile(tempWebmFilePath);
    }
  }
  private async writeTemporaryFile(
    buffer: Buffer,
    filePath: string,
  ): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, buffer, { flag: 'w' });
    } catch (error) {
      console.error('임시 파일 쓰기 에러:', error);
      throw error;
    }
  }

  subscribeToFolderUpdates(folderId: string, callback: Function) {
    if (!this.folderUpdateSubscribers.has(folderId)) {
      this.folderUpdateSubscribers.set(folderId, []);
    }
    this.folderUpdateSubscribers.get(folderId).push(callback);
  }

  private notifyFolderUpdate(folderId: string, folder: Folder) {
    const subscribers = this.folderUpdateSubscribers.get(folderId);
    if (subscribers) {
      subscribers.forEach((callback) => callback(folder));
    }
  }

  private async processMedia(
    webmFilePath: string,
    timestamp: number,
    hashedFileName: string,

    mediaType: 'image' | 'video',
  ): Promise<string> {
    const outputPath = path.join(__dirname, hashedFileName);
    const command =
      mediaType === 'image'
        ? `ffmpeg -ss ${timestamp} -i ${webmFilePath} -vframes 1 -q:v 2 ${outputPath}`
        : `ffmpeg -ss ${timestamp} -i ${webmFilePath} -t 20 -c:v libx264 -c:a aac ${outputPath}`;

    try {
      await execAsync(command);
      await this.uploadToS3(outputPath, hashedFileName); // 해시된 파일명을 전달
      return `https://static.qaing.co/${hashedFileName}`;
    } catch (error) {
      console.error(`${mediaType} 생성 중 오류 발생:`, error);
      throw error;
    }
  }

  private async uploadToS3(
    filePath: string,
    hashedFileName: string,
  ): Promise<string> {
    let contentType: string;
    let extension = hashedFileName.split('.').pop();

    switch (extension) {
      case 'jpg':
        contentType = 'image/jpeg';
        break;
      case 'mp4':
        contentType = 'video/mp4';
        break;
      default:
        contentType = 'application/octet-stream';
        break;
    }

    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: hashedFileName, // 해시된 파일명을 S3의 key로 사용
      Body: fileStream,
      ContentDisposition: 'inline',
      ContentType: contentType,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      const fileUrl = `https://${this.configService.get(
        'AWS_S3_BUCKET',
      )}.s3.${this.configService.get(
        'AWS_REGION',
      )}.amazonaws.com/${hashedFileName}`;
      console.log(`S3에 파일 업로드 및 URL 생성 완료: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      console.error(`S3에 파일 업로드 중 오류 발생:`, error);
      throw error;
    }
  }

  async saveMediaUrlsToMongoDB(
    imageUrl: string,
    videoUrl: string,
    issueNum: number,
  ) {
    try {
      const newIssueFile = new this.issueFileModel({
        issueName: `이슈 ${issueNum}`,
        imageUrl,
        videoUrl,
      });

      await newIssueFile.save();

      return newIssueFile;
    } catch (error) {
      console.error('MongoDB에 데이터 저장 중 오류 발생:', error);
      throw error;
    }
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error('파일 삭제 중 오류 발생:', error);
    }
  }

  private hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
