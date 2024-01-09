import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';

const options: SchemaOptions = {
  timestamps: true,
};
@Schema(options)
export class mappedUrl extends Document {
  @Prop()
  originUrl: string;

  @Prop()
  hashedUrl: string;

  @Prop()
  canView: boolean;

  @Prop()
  canEdit: boolean;
}

export const MappedUrlSchema = SchemaFactory.createForClass(mappedUrl);
