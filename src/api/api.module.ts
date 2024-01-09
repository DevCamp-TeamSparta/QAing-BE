import { Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';
import { mappedUrl } from 'src/models/mappedUrl.model';
import { MappedUrlSchema } from 'src/models/mappedUrl.model';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from 'src/models/users.model';
import { UserSchema } from 'src/models/users.model';
import { Folder } from 'src/models/folders.model';
import { FolderSchema } from 'src/models/folders.model';
import { IssueFile } from 'src/models/issueFiles.model';
import { IssueFileSchema } from 'src/models/issueFiles.model';
import { Video } from 'src/models/videos.model';
import { VideoSchema } from 'src/models/videos.model';
import { Image } from 'src/models/images.model';
import { ImageSchema } from 'src/models/images.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: IssueFile.name, schema: IssueFileSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Video.name, schema: VideoSchema },
      { name: mappedUrl.name, schema: MappedUrlSchema },
    ]),
  ],
  providers: [ApiService],
  controllers: [ApiController],
})
export class ApiModule {}
