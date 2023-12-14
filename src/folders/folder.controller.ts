import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { UpdateIssueFileDto } from 'src/dto/updateIssueFile.dto';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { Types } from 'mongoose';

@Controller('folders')
@UseGuards(AuthMiddleware)
export class FoldersController {
  constructor(private readonly foldersService: FolderService) {}

  @Get(':folderId/issues')
  async getFolderWithIssueFiles(@Param('folderId') folderId: string) {
    try {
      const isValidObjectId = Types.ObjectId.isValid(folderId);

      if (!isValidObjectId) {
        throw new Error('Invalid folderId');
      }

      const issues = await this.foldersService.getIssuesFromFolder(folderId);
      return issues;
    } catch (error) {
      console.error(`Failed to get folder with issue files: ${error}`);
      throw new Error(
        `Failed to get folder with issue files: ${error.message}`,
      );
    }
  }

  @Put('/:folderId/issues/:issueId')
  async updateIssueFileName(
    @Param('issueId') issueId,
    @Res() res: any,
    @Body() updateIssueFileDto: UpdateIssueFileDto,
  ) {
    await this.foldersService.updateIssueFileName(issueId, updateIssueFileDto);
    return res.json({ message: 'success' });
  }

  @Delete('/:folderId/issues/:issueId')
  async deleteIssueFile(@Res() res: any, @Param('issueId') issueId: string) {
    await this.foldersService.deleteIssueFile(issueId);
    return res.json({ message: 'success' });
  }
}
