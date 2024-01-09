//issueFiles.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions, Types } from 'mongoose';
import { User } from './users.model';
import { IssueFile } from './issueFiles.model';

const options: SchemaOptions = {
  timestamps: true,
};
@Schema(options)
export class Image extends Document {
  @Prop()
  originImageUrl: string;

  @Prop()
  editedImageUrl: string | null;

  @Prop()
  timestamp: number;

  @Prop({ type: Types.ObjectId, ref: 'IssueFile' })
  parentIssueFile: IssueFile;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner: User;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
