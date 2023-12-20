//folders.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaOptions } from 'mongoose';
import { IssueFile } from './issueFiles.model';

const options: SchemaOptions = {
  timestamps: true,
};
@Schema(options)
export class Folder extends Document {
  @Prop()
  folderName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'IssueFile' }] })
  issues: IssueFile[];

  @Prop()
  status: boolean;

  @Prop({ default: 0 })
  totalTasks: number;

  @Prop({ default: 0 })
  completedTasks: number;

  @Prop()
  progress: string;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
