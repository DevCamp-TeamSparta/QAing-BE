import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Folder } from 'src/models/folders.model';
import { IssueFile } from 'src/models/issueFiles.model';
import { UpdateIssueFileDto } from 'src/dto/updateIssueFile.dto';
import { VideoService } from 'src/videos/video.service';

@Injectable()
export class FolderService {
  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(IssueFile.name)
    private readonly issueFileModel: Model<IssueFile>,
    private readonly videoService: VideoService,
  ) {}

  async getFolderById(folderId: string): Promise<Folder | null> {
    try {
      const folder = await this.folderModel.findById(folderId);
      if (!folder) {
        // Handle case where folder is not found
        throw new NotFoundException('Folder not found');
      }
      return folder;
    } catch (error) {
      console.error(`Failed to get folder by ID: ${error}`);
      throw new Error(`Failed to get folder by ID: ${error.message}`);
    }
  }

  async getIssuesFromFolder(folderId: string) {
    const folder = await this.folderModel.findById(folderId);
    if (!folder) {
      console.error(`Folder not found for id: ${folderId}`);
      throw new NotFoundException('Folder not found');
    }

    const issuesWithContents: IssueFile[] = [];

    for (const issueId of folder.issues) {
      const issue = await this.issueFileModel.findById(issueId);
      if (issue) {
        issuesWithContents.push(issue);
      }
    }

    const { folderName } = folder;
    return { folderName, issuesWithContents };
  }

  async updateIssueFileName(
    issueId: string,
    updateIssueFileDto: UpdateIssueFileDto,
  ): Promise<boolean> {
    try {
      const { newIssueName } = updateIssueFileDto;

      const issue = await this.issueFileModel.findById(issueId);

      if (!issue) {
        throw new NotFoundException('Issue File not found');
      }

      issue.issueName = newIssueName;

      await issue.save();

      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteIssueFile(
    folderId: string,
    issueId: string,
  ): Promise<Folder | null> {
    try {
      const folder = await this.folderModel.findOne({ _id: folderId });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }

      // 데이터베이스에서 이슈 파일을 찾고
      const issueFile = await this.issueFileModel.findById(issueId);
      if (!issueFile) {
        throw new NotFoundException('Issue not found');
      }

      // S3에서 이미지와 비디오 파일 삭제
      if (issueFile.imageUrl) {
        const imageName = issueFile.imageUrl.split('/').pop(); // URL에서 파일 이름 추출
        if (imageName) {
          await this.videoService.deleteFromS3(imageName);
        }
      }
      if (issueFile.videoUrl) {
        const videoName = issueFile.videoUrl.split('/').pop(); // URL에서 파일 이름 추출
        if (videoName) {
          await this.videoService.deleteFromS3(videoName);
        }
      }

      // 데이터베이스에서 이슈 파일 삭제
      await this.issueFileModel.deleteOne({ _id: issueId });

      // 폴더에서 해당 issueId를 제거
      folder.issues = folder.issues.filter((id) => id.toString() !== issueId);

      await folder.save();

      return folder;
    } catch (error) {
      console.error(`Failed to delete issue file: ${error}`);
      throw new Error(`Failed to delete issue file: ${error.message}`);
    }
  }
}
