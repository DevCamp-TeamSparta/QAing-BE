import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  home() {
    return 'Production Server(Feat.Docker123456)';
  }

  @Get('health-check')
  healthCheck(@Res() res: Response): Response {
    return res.status(200).send('OK');
  }
}
