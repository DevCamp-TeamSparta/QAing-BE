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
import { UserService } from 'src/users/user.service';
import { Types } from 'mongoose';

@Controller('folders')
export class FoldersController {
  constructor(
    private readonly foldersService: FolderService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getAllFolders(@Req() req, @Res() res) {
    try {
      const userId = req.user._id;
      if (!userId) {
        throw new Error('Invalid UserId');
      }

      const folders = await this.userService.getAllUserFolders(userId);

      return res.json(folders);
    } catch (error) {
      console.error('폴더를 불러 오는 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
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
        throw new Error('Invalid UserId');
      }

      await this.userService.updateFolderName(
        userId,
        folderId,
        updateFolderDto,
      );

      return res.json({ message: 'success' });
    } catch (error) {
      console.error('폴더 이름 변경 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
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
        throw new Error('Invalid UserId');
      }

      await this.userService.deleteFolder(userId, folderId);

      return res.json({ message: 'success' });
    } catch (error) {
      console.error('폴더 삭제 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
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
        throw new Error('Invalid folderId');
      }

      const issuesWithFolder =
        await this.foldersService.getIssuesFromFolder(folderId);
      return res.json(issuesWithFolder);
    } catch (error) {
      console.error('이슈 목록 조회 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
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
        throw new Error('폴더 이름 변경 중 에러 발생');
      }
    } catch (error) {
      console.log('에러 이름 : ', error.name);
    }
  }

  @Delete('/:folderId/issues/:issueId')
  async deleteIssueFile(@Res() res: any, @Param('issueId') issueId: string) {
    try {
      const isDeletedIssueFile =
        await this.foldersService.deleteIssueFile(issueId);
      if (isDeletedIssueFile) {
        return res.json({ message: 'success' });
      } else {
        throw new Error('이슈 파일 삭제 중 에러 발생');
      }
    } catch (error) {
      console.log('에러 이름 : ', error.name);
    }
  }
}
