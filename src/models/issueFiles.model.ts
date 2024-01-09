//issueFiles.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions, Types } from 'mongoose';
import { User } from './users.model';
import { Folder } from './folders.model';
import { Image } from './images.model';
import { Video } from './videos.model';

const options: SchemaOptions = {
  timestamps: true,
};
@Schema(options)
export class IssueFile extends Document {
  @Prop()
  issueName: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Image' }],
  })
  images: Image[];

  @Prop({ type: Types.ObjectId, ref: 'Video' })
  video: Video;

  @Prop({ type: Types.ObjectId, ref: 'Folder' })
  parentFolder: Folder;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: User;
}

export const IssueFileSchema = SchemaFactory.createForClass(IssueFile);
