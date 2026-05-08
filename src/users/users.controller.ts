import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { TRequestWithUser } from 'src/auth/auth.types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/get-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  async getMe(@Req() req: TRequestWithUser): Promise<User> {
    const userId = +req.user.sub;
    const user = await this.usersService.findById(userId);
    return user;
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me')
  async updateMe(
    @Req() req: TRequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me/password')
  async updatePassword(
    @Req() req: TRequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }
}
