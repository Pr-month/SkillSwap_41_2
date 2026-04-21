import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TRequestWithUser } from 'src/auth/auth.types';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AccessTokenGuard)
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

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me')
  async updateMe(
    @Req() req: TRequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('me/password')
  async updatePassword(
    @Req() req: TRequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }
}
