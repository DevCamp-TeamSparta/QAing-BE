import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Folder } from 'src/models/folders.model';
import { IssueFile } from 'src/models/issueFiles.model';
import { UpdateIssueFileDto } from 'src/dto/updateIssueFile.dto';

@Injectable()
export class FolderService {
  constructor(
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(IssueFile.name)
    private readonly issueFileModel: Model<IssueFile>,
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

      // issueFile을 삭제합니다.
      const issueFile = await this.issueFileModel.deleteOne({ _id: issueId });
      if (issueFile.deletedCount === 0) {
        throw new NotFoundException('Issue not found');
      }

      folder.issues = folder.issues.filter((id) => id.toString() !== issueId);

      await folder.save();

      return folder;
    } catch (error) {
      console.error(`Failed to delete issue file: ${error}`);
      throw new Error(`Failed to delete issue file: ${error.message}`);
    }
  }
}
