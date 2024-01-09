import { Controller, Get, Res, Param, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { ApiService } from './api/api.service';

@Controller('/')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly apiService: ApiService,
  ) {}

  @Get()
  home() {
    return 'Production Server';
  }

  @Get('health-check')
  healthCheck(@Res() res: Response): Response {
    return res.status(200).send('OK');
  }

  @Get('/d/:hashedUrl')
  async getOriginalUrl(@Param('hashedUrl') hashedUrl: string, @Res() res) {
    const mapping = await this.apiService.getOriginalUrl(hashedUrl);
    if (mapping) {
      // 원본 URL로 리디렉션
      res.redirect(HttpStatus.MOVED_PERMANENTLY, mapping.originUrl);
    } else {
      // URL을 찾을 수 없는 경우 404 응답
      res.status(HttpStatus.NOT_FOUND).json({ message: 'URL not found' });
    }
  }
}
