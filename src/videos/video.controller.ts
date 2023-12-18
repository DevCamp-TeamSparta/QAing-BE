import {
  Controller,
  Get,
  Put,
  Param,
  Req,
  Res,
  Body,
  UseInterceptors,
  UploadedFile,
  Inject,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/models/users.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { getModelToken } from '@nestjs/mongoose';
import { Folder } from 'src/models/folders.model';
import { Response } from 'express';
import { Multer } from 'multer';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    @Inject(getModelToken(User.name)) private readonly userModel: Model<User>,
    @Inject(getModelToken(Folder.name))
    private readonly folderModel: Model<Folder>,
  ) {}

  @Get('process')
  @UseInterceptors(FileInterceptor('webmFile'))
  async createFolder(@Req() req: any, @Res() res: any): Promise<void> {
    try {
      const userId = req.user._id;
      console.log('유저 아이디 : ', userId);
      if (!userId) {
        throw new Error('유저를 찾을 수 없음');
      }

      const folder = await this.videoService.getFolderIdByUser(userId);
      console.log('폴더 생성');
      return res.json({ folderId: folder._id, status: folder.status });
    } catch (error) {
      console.log('에러 이름 : ', error.name);
      return res.json({ message: 'failure' });
    }
  }

  @Put('process/:folderId')
  @UseInterceptors(FileInterceptor('webmFile'))
  async processVideoAndImages(
    @UploadedFile() webmFile: Express.Multer.File,
    @Body('timestamps') timestamps: string,
    @Param('folderId') folderId: string,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    try {
      const parsedTimestamps = JSON.parse(timestamps);
      const userId = req.user._id;
      console.log('원본 파일 : ', webmFile);
      console.log('타임 스탬프 : ', timestamps);

      if (!userId) {
        throw new Error('유저를 찾을 수 없음.');
      }
      await this.videoService.processVideoAndImages(
        webmFile,
        parsedTimestamps,
        folderId,
      );
      return res.json({ message: 'success' });
    } catch (error) {
      console.log('에러 이름 : ', error.name);
      return res.json({ message: 'failure' });
    }
  }

  @Get('subscribe/:folderId')
  async subscribeToFolderUpdates(
    @Param('folderId') folderId: string,
    @Res() res: Response,
  ) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    this.videoService.subscribeToFolderUpdates(folderId, (folder: Folder) => {
      res.write(`data: ${JSON.stringify({ message: 'success' })}\n\n`);
    });
  }
}
