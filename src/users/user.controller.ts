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

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('preInfo')
  async updatePreInfo(
    @Req() req,
    @Res() res,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const userId = req.user._id;
      const isUpdatedUserInfo = this.userService.updatePreInfo(
        userId,
        updateUserDto,
      );

      if (isUpdatedUserInfo) {
        return res.json({ message: 'success' });
      } else {
        throw new Error('유저 정보 업데이트 중 에러 발생');
      }
    } catch (error) {
      console.log('에러 이름 : ', error.name);
    }
  }

  @Get('info')
  async getUserInfo(@Req() req, @Res() res: any) {
    try {
      const userId = req.user._id;
      if (!userId) {
        throw new Error('검색된 userId 없음.');
      }

      const findUser = await this.userService.getUserInfo(userId);
      return res.json(findUser);
    } catch (error) {
      console.error('유저 정보 조회 중 에러 발생 : ', error);
      console.log(error.name);
    }
  }

  @Put('profile')
  async updateUserProfile(
    @Req() req,
    @Res() res,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const userId = req.user._id;
      if (!userId) {
        throw new Error('검색된 userId 없음.');
      }
      await this.userService.updateUserProfile(userId, updateUserDto);

      return res.json({ message: 'success' });
    } catch (error) {
      console.error('유저 프로필 업데이트 중 에러 발생 : ', error);
      console.log('에러 이름 : ', error.name);
    }
  }
}
