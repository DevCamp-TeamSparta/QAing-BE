import { IsNotEmpty } from 'class-validator';

export class UpdateImageDto {
  @IsNotEmpty()
  originImageUrl: string;

  @IsNotEmpty()
  editedImageUrl: string | null;
}
