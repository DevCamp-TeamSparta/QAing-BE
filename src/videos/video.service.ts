import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IssueFile } from 'src/models/issueFiles.model';
import { Folder } from 'src/models/folders.model';
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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

  private formatToTwoDigits(number: number): string {
    return number.toString().padStart(2, '0');
  }

  async getFolderIdByUser(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      const nowDate = new Date();
      const folderName = `${nowDate.getFullYear()}-${this.formatToTwoDigits(
        nowDate.getMonth() + 1,
      )}-${this.formatToTwoDigits(nowDate.getDate())} ${this.formatToTwoDigits(
        nowDate.getHours(),
      )}:${this.formatToTwoDigits(nowDate.getMinutes())}`;
      const folder = new this.folderModel({
        folderName,
        issues: [],
        status: false,
        totalTasks: 0,
      });

      await folder.save();

      user.folders.push(folder._id);
      await user.save();

      return folder;
    } catch (error) {
      console.log('에러 이름 : ', error);
      throw error;
    }
  }

  async processVideoAndImages(
    webmFile: Express.Multer.File,
    timestamps: number[],
    folderId: string,
  ) {
    const tempWebmFilePath = path.join(__dirname, `${folderId}_temp.webm`);

    await this.writeTemporaryFile(webmFile.buffer, tempWebmFilePath);
    if (timestamps.length === 0) {
      console.log('타임 스탬프 배열 비어있음.');
      return;
    }

    const folder = await this.folderModel.findById(folderId);
    const totalTasks = timestamps.length;

    let completedTasks: number = 0;
    let issueNum: number = 1;
    let updatedProgress: number;

    this.notifyFolderProgress(folderId, completedTasks, totalTasks);

    try {
      try {
        for (const timestamp of timestamps) {
          const hashedImageName = `${this.hashString(
            `image_${folderId}_${issueNum}`,
          )}.jpg`;
          const hashedVideoName = `${this.hashString(
            `video_${folderId}_${issueNum}`,
          )}.mp4`;
          console.log(`${issueNum}번 이미지 및 비디오 이름 해싱 완료`);

          // 이미지와 비디오 처리
          const imageUrl = await this.processMedia(
            tempWebmFilePath,
            timestamp,
            hashedImageName,
            'image',
          );
          console.log(`${issueNum}번 이미지 편집 및 s3업로드 완료`);
          const videoUrl = await this.processMedia(
            tempWebmFilePath,
            timestamp,
            hashedVideoName,
            'video',
          );
          console.log(`${issueNum}번 비디오 편집 및 s3업로드 완료`);
          const createdIssueFile = await this.saveMediaUrlsToMongoDB(
            imageUrl,
            videoUrl,
            issueNum,
          );
          console.log(`${issueNum}번 이미지 및 비디오 몽고db에 저장 완료`);
          folder.issues.push(createdIssueFile._id);

          completedTasks++;
          //const progress = Math.floor((completedTasks / totalTasks) * 100);
          this.notifyFolderProgress(folderId, completedTasks, totalTasks);

          // updatedProgress = progress;
          issueNum++;
        }
      } catch (error) {
        console.log('파일 편집 중 에러 발생 : ', error);
        throw error;
      }

      if (folder.issues.length == totalTasks) {
        folder.status = true;
        this.notifyFolderUpdate(folderId, folder);
      } else {
        throw new Error('이슈 생성 중 에러 발생.');
      }

      folder.totalTasks = totalTasks;
      folder.completedTasks = completedTasks;
      // folder.progress = `${updatedProgress}%`;
      // folder.progress = totalTasks

      await folder.save();
      console.log('이미지 및 비디오 생성 완료!');
    } catch (err) {
      console.log('파일 생성 중 에러 발생 : ', err.name);
      return;
    } finally {
      await this.deleteFile(tempWebmFilePath);
      return;
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

  private async processMedia(
    webmFilePath: string,
    timestamp: number,
    hashedFileName: string,

    mediaType: 'image' | 'video',
  ): Promise<string> {
    const outputPath = path.join(__dirname, hashedFileName);
    console.log('파일저장 경로 : ', outputPath);
    const command =
      mediaType === 'image'
        ? `ffmpeg -ss ${timestamp} -i ${webmFilePath} -vframes 1 -q:v 2 ${outputPath}`
        : `ffmpeg -ss ${
            timestamp - 10
          } -i ${webmFilePath} -t 20 -c:v libx264 -preset superfast -b:v 600k -r 30 -c:a aac ${outputPath}
      `;

    if (mediaType == 'video') {
      console.log('비디오 파일 cli 실행');
    }
    try {
      await execAsync(command);

      if (mediaType == 'video') {
        console.log('비디오 파일 cli 실행 완료 ');
      }

      await this.uploadToS3(outputPath, hashedFileName); // 해시된 파일명을 전달
      return `https://static.qaing.co/${hashedFileName}`;
    } catch (error) {
      console.error(`${mediaType} 생성 중 오류 발생:`, error);
      throw error;
    }
  }

  async deleteFromS3(hashedFileName: string): Promise<void> {
    const deleteParams = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: hashedFileName, // S3에서 삭제할 파일의 Key
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log(`File ${hashedFileName} deleted successfully from S3`);
    } catch (error) {
      console.error(`Error in deleting file ${hashedFileName} from S3:`, error);
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

    const fileStream = await fs.createReadStream(filePath);
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
      console.log(
        `S3에 ${contentType}파일 업로드 및 URL 생성 완료: ${fileUrl}`,
      );
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
      console.log('///////////이슈 파일 FE로 전송 성공///////////');
    }
  }

  private notifyFolderProgress(
    folderId: string,
    progress: number,
    totalTasks: number,
  ) {
    const subscribers = this.folderUpdateSubscribers.get(folderId);
    if (subscribers) {
      console.log('///////////이슈 파일 Progress 전송///////////');
      subscribers.forEach((callback) => callback({ progress, totalTasks }));
    }
  }
}
