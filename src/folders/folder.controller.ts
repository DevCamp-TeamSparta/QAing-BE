import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { UpdateIssueFileDto } from 'src/dto/updateIssueFile.dto';
import { UpdateFolderDto } from 'src/dto/updateFolder.dto';
import { UpdateImageDto } from 'src/dto/updateImage.dto';
import { UserService } from 'src/users/user.service';
import { Types } from 'mongoose';

@Controller('folders')
export class FoldersController {
  constructor(
    private readonly foldersService: FolderService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getAllFolders(@Req() req: any, @Res() res: any) {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(404).json({ message: 'fail' });
      }
      const folders = await this.userService.getAllUserFolders(userId);

      return res.json(folders);
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Put(':folderId')
  async updateFolderName(
    @Req() req,
    @Res() res,
    @Param('folderId') folderId: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(404).json({ message: 'fail' });
      }

      await this.userService.updateFolderName(
        userId,
        folderId,
        updateFolderDto,
      );

      return res.json({ message: 'success' });
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Delete(':folderId')
  async deleteFolder(
    @Req() req,
    @Res() res,
    @Param('folderId') folderId: string,
  ) {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(404).json({ message: 'fail' });
      }

      await this.userService.deleteFolder(userId, folderId);

      return res.json({ message: 'success' });
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Get(':folderId/issues')
  async getFolderWithIssueFiles(
    @Param('folderId') folderId: string,
    @Res() res,
  ) {
    try {
      const isValidObjectId = Types.ObjectId.isValid(folderId);

      if (!isValidObjectId) {
        return res.status(404).json({ message: 'fail' });
      }

      const issuesWithFolder =
        await this.foldersService.getIssuesFromFolder(folderId);
      return res.json(issuesWithFolder);
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Put('/:folderId/issues/:issueId')
  async updateIssueFileName(
    @Param('issueId') issueId,
    @Res() res: any,
    @Body() updateIssueFileDto: UpdateIssueFileDto,
  ) {
    try {
      const isUpdatedFolderName = await this.foldersService.updateIssueFileName(
        issueId,
        updateIssueFileDto,
      );

      if (isUpdatedFolderName) {
        return res.json({ message: 'success' });
      } else {
        return res.status(404).json({ message: 'fail' });
      }
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Delete('/:folderId/issues/:issueId')
  async deleteIssueFile(
    @Res() res: any,
    @Param('issueId') issueId: string,
    @Param('folderId') folderId: string,
  ) {
    try {
      await this.foldersService.deleteIssueFile(folderId, issueId);

      return res.json({ message: 'success' });
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Delete('api/editedImgUrl')
  async deleteEditedImage(
    @Res() res: any,
    @Body() updateImageDto: UpdateImageDto,
  ) {}
}
