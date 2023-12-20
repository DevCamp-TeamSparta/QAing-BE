import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './auth/google.strategy';
import { AuthController } from './auth/auth.controller';
import { UserModule } from './users/user.module';
import { UserController } from './users/user.controller';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/users.model';
import { VideoModule } from './videos/video.module';
import { VideoService } from './videos/video.service';
import { VideoController } from './videos/video.controller';
import { IssueFile, IssueFileSchema } from './models/issueFiles.model';
import { S3StorageModule } from './s3Storage/s3Storage.module';
import { AuthModule } from './auth/auth.module';
import { FoldersController } from './folders/folder.controller';
import { FolderService } from './folders/folder.service';
import { Folder, FolderSchema } from './models/folders.model';
import { PreSingedModule } from './preSignedUrl/preSigned.module';
import { FolderModule } from './folders/folder.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // 여기에 사용할 JWT 비밀 키를 설정
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
      { name: Folder.name, schema: FolderSchema },
    ]),
    UserModule,
    VideoModule,
    S3StorageModule,
    AuthModule,
    PreSingedModule,
    FolderModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    VideoController,
    FoldersController,
  ],
  providers: [
    AppService,
    GoogleStrategy,
    AuthService,
    VideoService,
    FolderService,
    ConfigService,
  ],
})
export class AppModule {}
