import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/models/users.model';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { Folder } from 'src/models/folders.model';
import { UpdateFolderDto } from 'src/dto/updateFolder.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Folder.name) private readonly folderModel: Model<Folder>,
    private readonly jwtService: JwtService,
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
    const result = await this.folderModel.deleteOne({ _id: folderId });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Folder not found');
    }
  }

  async findUserByEmail(userEmail: string): Promise<User | null> {
    const user = await this.userModel.findOne({ userEmail }).exec();

    return user;
  }
}
