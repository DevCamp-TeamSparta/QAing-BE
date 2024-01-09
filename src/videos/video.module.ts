import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { User, UserSchema } from '../models/users.model';
import { IssueFile, IssueFileSchema } from 'src/models/issueFiles.model';
import { ConfigService } from '@nestjs/config';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Folder, FolderSchema } from 'src/models/folders.model';
import { UserService } from 'src/users/user.service';
import { EmailService } from 'src/email/email.service';
import { Image, ImageSchema } from 'src/models/images.model';
import { Video, VideoSchema } from 'src/models/videos.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  controllers: [VideoController],
  providers: [
    VideoService,
    ConfigService,
    AuthService,
    JwtService,
    UserService,
    EmailService,
  ],
  exports: [VideoService],
})
export class VideoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/videos');
  }
}
