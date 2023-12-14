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
    const userId = req.user._id;
    const folder = await this.videoService.getFolderIdByUser(userId);
    return res.json({ folderId: folder._id, status: folder.status });
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
    const parsedTimestamps = JSON.parse(timestamps);
    console.log('녹화 중인 유저 : ', req.user);
    const userId = req.user._id;
    await this.videoService.processVideoAndImages(
      webmFile,
      parsedTimestamps,
      userId,
      folderId,
    );
    return res.json({ message: 'success' });
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
