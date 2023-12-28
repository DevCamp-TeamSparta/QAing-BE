import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresignurlController } from './preSigned.controller';
import { PresignedService } from './preSigned.service';
import { User, UserSchema } from 'src/models/users.model';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [PresignurlController],
  providers: [ConfigService, PresignedService], // 서비스 추가
  exports: [],
})
export class PreSingedModule {}
