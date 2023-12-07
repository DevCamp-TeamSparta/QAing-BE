import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { User, UserSchema } from '../models/users.model';
import { ShortVideo, ShortsVideoSchema } from '../models/shorts.model';
import { Image, ImageSchema } from '../models/image.model';
import { ConfigService } from '@nestjs/config';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ShortVideo.name, schema: ShortsVideoSchema },
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [VideoController],
  providers: [VideoService, ConfigService, AuthService, JwtService],
  exports: [VideoService],
})
// export class VideoModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(AuthMiddleware).forRoutes('/videos');
//   }
// }
export class VideoModule {}
