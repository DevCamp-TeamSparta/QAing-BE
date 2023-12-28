import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresignurlController } from './preSigned.controller';
import { PresignedService } from './preSigned.service';
import { User, UserSchema } from 'src/models/users.model';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/users/user.service';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { Folder, FolderSchema } from 'src/models/folders.model';
import { IssueFile, IssueFileSchema } from 'src/models/issueFiles.model';
import { VideoService } from 'src/videos/video.service';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
      { name: Folder.name, schema: FolderSchema },
    ]),
  ],
  controllers: [PresignurlController],
  providers: [
    ConfigService,
    PresignedService,
    JwtService,
    UserService,
    VideoService,
    AuthService,
    EmailService,
  ],
  exports: [],
})
export class PreSingedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/presignedurl');
  }
}
