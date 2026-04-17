import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  async getMe(
    userId: number,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, refreshToken, ...result } = user;
    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // обновляем только переданные поля
    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);

    // исключаем чувствительные поля
    const { password, refreshToken, ...result } = savedUser;
    return result;
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid old password');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Пароль успешно обновлен.' };
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
