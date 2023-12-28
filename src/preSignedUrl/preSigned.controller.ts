import { Body, Controller, Delete, Post, Req, Res } from '@nestjs/common';
import { PresignedService } from './preSigned.service';

@Controller('presignedurl')
export class PresignurlController {
  constructor(private presignedService: PresignedService) {}

  @Post()
  async createUploadUrl(
    @Body('filename') filename: string,
    @Body('type') type: string,
    @Res() res: any,
  ): Promise<{ url: string }> {
    try {
      const url = await this.presignedService.getUploadPresignedUrl(
        filename,
        type,
      );
      return res.json({ url });
    } catch (error) {
      console.error('presigned url 생성 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
    }
  }

  @Delete()
  async createDeleteUrl(
    @Body('filename') filename: string,
    @Res() res: any,
  ): Promise<{ url: string }> {
    const url = await this.presignedService.getDeletePresignedUrl(filename);
    return res.json({ url });
  }

  @Post('/s3bucket')
  async fileUploadedUrl(
    @Req() req: any,
    @Res() res: any,
    @Body('filename') filename: string,
    @Body('type') type: string,
  ) {
    const userId = req.user._id;
    const fileUrl = this.presignedService.constructFileUrl(filename, type);
    await this.presignedService.updateUserFile(userId, fileUrl);
    return res.json({ message: 'success', fileUrl });
  }
}
