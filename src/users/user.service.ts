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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    @InjectModel(IssueFile.name)
    private readonly issueFileModel: Model<IssueFile>,
    private readonly jwtService: JwtService,
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
        .populate('issues');
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
    // 폴더와 관련된 모든 이슈 파일을 찾음
    const folder = await this.folderModel.findById(folderId).populate('issues');
    console.log('폴더', folder);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 각 이슈 파일에 대해 반복
    for (const issueFileId of folder.issues) {
      const issueFile = await this.issueFileModel.findById(issueFileId);

      // S3에서 이미지와 비디오 파일 삭제
      if (issueFile.imageUrl) {
        const imageName = issueFile.imageUrl.split('/').pop(); // URL에서 파일 이름 추출
        console.log('삭제하는 이미지 이름 : ', imageName);
        if (imageName) {
          await this.videoService.deleteFromS3(imageName);
        }
      }
      if (issueFile.videoUrl) {
        const videoName = issueFile.videoUrl.split('/').pop(); // URL에서 파일 이름 추출
        console.log('삭제하는 비디오 이름 : ', videoName);
        if (videoName) {
          await this.videoService.deleteFromS3(videoName);
        }
      }

      // 이슈 파일을 데이터베이스에서 삭제
      await this.issueFileModel.deleteOne({ _id: issueFile._id });
    }

    // 폴더 삭제
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
