import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresignurlController } from './preSigned.controller';
import { PresignedService } from './preSigned.service';

@Module({
  imports: [],
  controllers: [PresignurlController],
  providers: [ConfigService, PresignedService], // 서비스 추가
  exports: [],
})
export class PreSingedModule {}
