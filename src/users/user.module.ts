import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { UserController } from './user.controller';
import { User, UserSchema } from '../models/users.model';
import { Folder, FolderSchema } from 'src/models/folders.model';
import { AuthService } from 'src/auth/auth.service';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { IssueFile, IssueFileSchema } from 'src/models/issueFiles.model';
import { VideoService } from 'src/videos/video.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
    ]),
  ],
  exports: [UserService],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    JwtService,
    ConfigService,
    VideoService,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/users');
  }
}
