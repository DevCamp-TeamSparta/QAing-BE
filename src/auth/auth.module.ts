import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { UserService } from 'src/users/user.service';
import { User, UserSchema } from 'src/models/users.model';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/users/user.module';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import { AppService } from 'src/app.service';
import { Folder, FolderSchema } from 'src/models/folders.model';
import { IssueFile, IssueFileSchema } from 'src/models/issueFiles.model';
import { VideoService } from 'src/videos/video.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, // 여기에 사용할 JWT 비밀 키를 설정
      signOptions: { expiresIn: '1h' }, // 선택적으로 만료 시간을 설정
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
    ]),
    UserModule,
    PassportModule.register({ defaultStrategy: 'google' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    JwtService,
    GoogleStrategy,
    ConfigService,
    AppService,
    UserService,
    VideoService,
    EmailService,
  ],
})
export class AuthModule {}
