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
      if (!userId) {
        throw new Error('유저를 찾을 수 없음');
      }

      const folder = await this.videoService.getFolderIdByUser(userId);
      return res.json({
        folderId: folder._id,
        status: folder.status,
        folderName: folder.folderName,
      });
    } catch (error) {
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

      if (!userId) {
        return res.status(404).json({ message: 'fail' });
      }
      await this.videoService.processVideoAndImages(
        webmFile,
        parsedTimestamps,
        folderId,
      );
      return res.json({ message: 'success' });
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
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

    res.header('Access-Control-Allow-Origin', process.env.PROD_REDIRECT_FE_URL);
    res.header('Access-Control-Allow-Credentials', 'true');

    this.videoService.subscribeToFolderUpdates(folderId, (folder: Folder) => {
      if (folder.status) {
        // Folder 상태 업데이트 시 메시지 전송
        res.write(
          `data: ${JSON.stringify({
            type: 'message',
            message: '이슈 파일 저장 성공',
            progress: folder.progress,
            totalTasks: folder.totalTasks,
            status: true,
          })}\n\n`,
        );
      } else {
        // Folder 진행 상태 업데이트
        res.write(
          `data: ${JSON.stringify({
            type: 'progress',
            progress: folder.progress,
            totalTasks: folder.totalTasks,
            status: false,
          })}\n\n`,
        );
      }
    });
  }
}
