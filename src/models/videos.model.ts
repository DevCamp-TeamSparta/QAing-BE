//issueFiles.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions, Types } from 'mongoose';
import { IssueFile } from './issueFiles.model';
import { User } from './users.model';

const options: SchemaOptions = {
  timestamps: true,
};
@Schema(options)
export class Video extends Document {
  @Prop()
  originVideoUrl: string;

  @Prop()
  editedVideoUrl: string | null;

  @Prop({ type: Types.ObjectId, ref: 'IssueFile' })
  parentIssueFile: IssueFile;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: User;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
