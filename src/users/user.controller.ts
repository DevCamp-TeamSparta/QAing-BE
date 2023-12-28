import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/models/users.model';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

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
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Get('info')
  async getUserInfo(@Req() req, @Res() res: any) {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(404).json({ message: 'fail' });
      }

      const findUser = await this.userService.getUserInfo(userId);
      return res.json(findUser);
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
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
        return res.status(404).json({ message: 'fail' });
      }
      await this.userService.updateUserProfile(userId, updateUserDto);

      return res.json({ message: 'success' });
    } catch (error) {
      return res.status(404).json({ message: 'fail' });
    }
  }

  @Get('logout')
  async logout(@Req() req, @Res() res) {
    const userId = req.user._id;
    const user = await this.userModel.findByIdAndUpdate(userId, {
      accessToken: null,
      refreshToken: null,
    });

    res.cookie('refresh-token', user.refreshToken, {
      httpOnly: true,
      expires: new Date(0),
      domain: '.qaing.co',
    });
    res.cookie('access-token', user.accessToken, {
      httpOnly: true,
      expires: new Date(0),
      domain: '.qaing.co',
    });

    return res.status(HttpStatus.OK).json({
      message: 'success',
    });
  }
}
