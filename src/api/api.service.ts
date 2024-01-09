import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mappedUrl } from 'src/models/mappedUrl.model';
import { UpdateImageDto } from 'src/dto/updateImage.dto';
import { Image } from 'src/models/images.model';

@Injectable()
export class ApiService {
  constructor(
    @InjectModel(mappedUrl.name)
    private readonly mappedUrlModel: Model<mappedUrl>,
    @InjectModel(Image.name)
    private readonly imageModel: Model<Image>,
  ) {}

  async createMapping(
    originUrl: string,
    hashedUrl: string,
  ): Promise<mappedUrl> {
    const newMapping = new this.mappedUrlModel({
      originUrl,
      hashedUrl,
    });
    return newMapping.save();
  }

  async getOriginalUrl(hashedUrl: string): Promise<mappedUrl | null> {
    return this.mappedUrlModel.findOne({ hashedUrl }).exec();
  }

  async deleteEditedImageUrl(updateImageDto: UpdateImageDto): Promise<boolean> {
    const { editedImageUrl } = updateImageDto;

    const deleteEditedUrlImage = await this.imageModel.findOneAndUpdate(
      { editedImageUrl },
      { $set: { editedImageUrl: null } },
      { new: true },
    );

    if (!deleteEditedUrlImage) {
      throw new NotFoundException('Issue File not found');
    }

    return true;
  }
}
