import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { UpdateFolderDto } from 'src/dto/updateFolder.dto';
import { Types } from 'mongoose';

@Controller('users')
// @UseGuards(AuthMiddleware)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('preInfo')
  async updatePreInfo(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    return this.userService.updatePreInfo(userId, updateUserDto);
  }

  @Get('info')
  async getUserInfo(@Req() req, @Res() res: any) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    const findUser = await this.userService.getUserInfo(userId);
    return res.json(findUser);
  }

  @Get('folders')
  async getAllUserFolders(@Req() req) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    const folders = await this.userService.getAllUserFolders(userId);
    return folders;
  }

  @Put('profile')
  async updateUserProfile(
    @Req() req,
    @Res() res,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    await this.userService.updateUserProfile(userId, updateUserDto);

    return res.json({ message: 'success' });
  }

  @Put('folders/:folderId')
  async updateFolderName(
    @Req() req,
    @Res() res,
    @Param('folderId') folderId: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    await this.userService.updateFolderName(userId, folderId, updateFolderDto);

    return res.json({ message: 'success' });
  }

  @Delete('folders/:folderId')
  async deleteFolder(
    @Req() req,
    @Res() res,
    @Param('folderId') folderId: string,
  ) {
    const userId = req.user.userId
      ? req.user.userId
      : new Types.ObjectId(req.user.id);
    await this.userService.deleteFolder(userId, folderId);

    return res.json({ message: 'success' });
  }
}
