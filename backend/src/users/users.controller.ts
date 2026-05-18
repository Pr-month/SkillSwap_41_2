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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { TRequestWithUser } from 'src/auth/auth.types';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/get-users.dto';
import { UserRole } from './enums/users.enums';
import {
  ApiFindAllUsers,
  ApiGetMe,
  ApiFindById,
  ApiUpdateMe,
  ApiUpdatePassword,
  ApiRemoveUser,
} from './users.swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindAllUsers()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  @ApiGetMe()
  async getMe(@Req() req: TRequestWithUser): Promise<User> {
    const userId = +req.user.sub;
    const user = await this.usersService.findById(userId);
    return user;
  }

  @Get(':id')
  @ApiFindById()
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @ApiRemoveUser()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me')
  @ApiUpdateMe()
  async updateMe(
    @Req() req: TRequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAccessGuard)
  @Patch('me/password')
  @ApiUpdatePassword()
  async updatePassword(
    @Req() req: TRequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const userId = +req.user.sub;
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }
}
