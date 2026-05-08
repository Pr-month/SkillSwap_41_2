import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/users.enums';
import { FindUsersQueryDto } from './dto/get-users.dto';
import { of } from 'rxjs';
import { off } from 'process';

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const salt = this.configService.get<number>('app.hashSalt') ?? 10;
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const { city, ...userData } = dto;
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: FindUsersQueryDto) {
    // limit = сколько записей вернуть
    // offset = номер страницы
    // search = строка для поиска #по имени или email#
    const { limit, search, offset } = query;

    // take = сколько записей вернуть
    // skip = сколько записей пропустить (для пагинации)
    const take = limit || 10;
    const skip = offset ? (offset - 1) * take : 0;

    // SQL запрос, алиас таблицы - user
    const qb = this.usersRepository.createQueryBuilder('user');

    // Фильтрация по имени или email, если search передан
    // ILike - для case-insensitive
    // % - это wildcard, поиск по подстроке
    if (search) {
      qb.where('user.name ILIKE :search OR user.email ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // users - массив найденных пользователей
    // total - общее количество пользователей, подходящих под фильтр (без учета пагинации)
    // альтеранива - getManyAndCount() : [users, total]
    const users = await qb.skip(skip).take(take).getMany();
    const total = await qb.getCount();

    // totalPages - общее количество страниц c округлением в большую сторону
    const totalPages = Math.ceil(total / take);

    if (total > 0 && offset > totalPages) {
      throw new NotFoundException('Страница не найдена');
    }

    return {
      data: users,
      meta: {
        total,
        offset,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    // обновляем только переданные поля
    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);

    return savedUser; // возвращаем весь объект, включая password и refreshToken (но они не будут отправлены, если не настроено)
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid old password');
    const salt = this.configService.get<number>('app.hashSalt') || 10;
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    return { message: 'Пароль успешно обновлен.' };
  }
  
  async remove(id: number): Promise<void> {
  const user = await this.usersRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('Пользователь не найден');
  }
  await this.usersRepository.remove(user);
}
}
