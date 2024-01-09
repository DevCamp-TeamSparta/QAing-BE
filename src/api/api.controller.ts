import { Controller, Post, Body, Delete, Res } from '@nestjs/common';
import { ApiService } from './api.service';
import { UpdateImageDto } from 'src/dto/updateImage.dto';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('map-url')
  async createMapping(
    @Body()
    body: {
      originUrl: string;
      hashedUrl: string;
    },
  ) {
    return this.apiService.createMapping(body.originUrl, body.hashedUrl);
  }

  @Delete('editedImgUrl')
  async deleteEditedImage(
    @Res() res: any,
    @Body() updateImageDto: UpdateImageDto,
  ) {
    try {
      const isUpdatedImageUrl =
        await this.apiService.deleteEditedImageUrl(updateImageDto);

      if (isUpdatedImageUrl) {
        return res.json({ message: 'success' });
      } else {
        return res.status(404).json({ message: 'fail' });
      }
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }
}
