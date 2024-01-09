import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../models/users.model';
import { IssueFile, IssueFileSchema } from 'src/models/issueFiles.model';
import { ConfigService } from '@nestjs/config';
import { FoldersController } from './folder.controller';
import { FolderService } from './folder.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { Folder, FolderSchema } from 'src/models/folders.model';
import { UserService } from 'src/users/user.service';
import { VideoService } from 'src/videos/video.service';
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
  controllers: [FoldersController],
  providers: [
    FolderService,
    ConfigService,
    AuthService,
    JwtService,
    UserService,
    VideoService,
    EmailService,
  ],
  exports: [FolderService],
})
export class FolderModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/folders');
  }
}
