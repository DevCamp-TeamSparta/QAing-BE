import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/models/users.model';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { Folder } from 'src/models/folders.model';
import { UpdateFolderDto } from 'src/dto/updateFolder.dto';
import { JwtService } from '@nestjs/jwt';
import { VideoService } from 'src/videos/video.service';
import { IssueFile } from 'src/models/issueFiles.model';
import { Image } from 'src/models/images.model';
import { Video } from 'src/models/videos.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(IssueFile.name)
    private readonly issueFileModel: Model<IssueFile>,
    @InjectModel(Image.name)
    private readonly imageModel: Model<Image>,
    @InjectModel(Video.name)
    private readonly videoModel: Model<Video>,
    private readonly videoService: VideoService,
  ) {}

  async updatePreInfo(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<boolean> {
    try {
      const existingUser = await this.userModel.findById(userId);
      // 업데이트된 필드값을 적용합니다.
      Object.assign(existingUser, updateUserDto);

      // 업데이트된 사용자를 저장하고 반환합니다.
      await existingUser.save();

      return true;
    } catch (error) {
      return false;
    }
  }

  async getUserInfo(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);

    return user;
  }

  async getAllUserFolders(userId: string): Promise<Folder[]> {
    const user = await this.userModel.findById(userId);
    const foldersWithContents: Folder[] = [];

    for (const folderId of user.folders) {
      const folder = await this.folderModel
        .findById(folderId)
        .populate({
          path: 'issues',
          populate: {
            path: 'images',
          },
        })
        .populate({
          path: 'issues',
          populate: {
            path: 'video',
          },
        });
      if (folder) {
        foldersWithContents.unshift(folder);
      }
    }

    return foldersWithContents;
  }

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const existingUser = await this.userModel.findById(userId);
    // 업데이트된 필드값을 적용합니다.
    Object.assign(existingUser, updateUserDto);

    // 업데이트된 사용자를 저장하고 반환합니다.
    await existingUser.save();
    return;
  }

  async updateFolderName(
    userId: string,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<Folder> {
    const existingFolder = await this.folderModel.findById(folderId);

    if (!existingFolder) {
      throw new NotFoundException('Folder not found');
    }

    existingFolder.folderName = updateFolderDto.newFolderName;

    return existingFolder.save();
  }

  async deleteFolder(userId: string, folderId: string): Promise<void> {
    const folder = await this.folderModel
      .findById(folderId)
      .populate({
        path: 'issues',
        populate: {
          path: 'images',
          model: 'Image',
        },
      })
      .populate({
        path: 'issues',
        populate: {
          path: 'video',
          model: 'Video',
        },
      });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    for (const issueId of folder.issues) {
      const issueFile = await this.issueFileModel.findById(issueId);
      const videoId = issueFile.video;
      const mp4File = await this.videoModel.findById(videoId);

      for (const imageId of issueFile.images) {
        const image = await this.imageModel.findById(imageId);
        const imageName = image.originImageUrl.split('/').pop();
        if (imageName) {
          await this.videoService.deleteFromS3(imageName);
          await this.imageModel.deleteOne({ _id: imageId });
        } else {
          continue;
        }
      }

      if (mp4File) {
        const videoName = mp4File.originVideoUrl.split('/').pop();
        if (videoName) {
          await this.videoService.deleteFromS3(videoName);
          await this.videoModel.deleteOne({ _id: videoId });
        }
      } else {
        break;
      }

      await this.issueFileModel.deleteOne({ _id: issueFile._id });
    }

    await this.folderModel.deleteOne({ _id: folderId });
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { folders: folder._id } },
    );
  }

  async findUserByEmail(userEmail: string): Promise<User | null> {
    const user = await this.userModel.findOne({ userEmail }).exec();

    return user;
  }
}
