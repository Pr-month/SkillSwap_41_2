import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { FindUsersQueryDto } from './dto/get-users.dto';
import { Category } from 'src/categories/entities/category.entity';
import { UserRole } from './enums/users.enums';

@Injectable()
export class UsersService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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

    let categories: Category[] = [];
    if (dto.wantToLearn?.length) {
      categories = await this.categoryRepository.findBy({
        id: In(dto.wantToLearn),
      });
      if (categories.length !== dto.wantToLearn.length) {
        throw new NotFoundException('Одна или несколько категорий не найдены');
      }
    }

    const user = this.usersRepository.create({
      ...dto,
      city: undefined,
      password: hashedPassword,
      wantToLearn: categories,
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: FindUsersQueryDto) {
    // limit = сколько записей вернуть
    // offset = сколько записей пропустить (смещение)
    // search = строка для поиска по имени или email
    const { limit = 12, search, offset = 0 } = query;

    const take = limit || 12;
    const skip = offset || 0;

    // SQL запрос
    const qb = this.usersRepository.createQueryBuilder('user');

    if (search) {
      qb.where('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [users, total] = await qb
      .leftJoinAndSelect('user.city', 'city')
      .leftJoinAndSelect('user.skills', 'skills')
      .leftJoinAndSelect('user.favoriteSkills', 'favoriteSkills')

      .leftJoinAndSelect('skills.category', 'skillCategory')
      .leftJoinAndSelect('skillCategory.parent', 'categoryParent')

      .leftJoinAndSelect('user.wantToLearn', 'wantToLearn')
      .leftJoinAndSelect('wantToLearn.parent', 'wantToLearnParent')
      .select([
        'user.id',
        'user.name',
        'user.birthdate',
        'user.gender',
        'user.avatar',
        'user.createdAt',
        'user.email',

        'city.id',
        'city.name',

        'skills.id',
        'skills.title',
        'skillCategory.id',

        'categoryParent.id', // ID родительской категории
        'categoryParent.slug',

        'favoriteSkills.id',
        'favoriteSkills.title',

        'wantToLearn.id',
        'wantToLearn.name',
        'wantToLearnParent.id',
        'wantToLearnParent.slug',
      ])
      .andWhere('user.role != :role', { role: UserRole.ADMIN }) // исключаем админов
      .skip(skip)
      .take(take)
      .getManyAndCount();

    // общее количество страниц
    const totalPages = Math.ceil(total / take);

    if (total > 0 && offset >= total) {
      throw new NotFoundException(
        `Смещение ${offset} превышает общее количество записей (${total}).`,
      );
    }

    // Если запрошена пустая страница, возвращаем пустой массив
    if (total === 0) {
      return {
        data: [],
        meta: {
          total,
          offset,
          limit: take,
          totalPages: 0,
        },
      };
    }

    const userOutput = users.map((user) => ({
      ...user,
      skills: user.skills?.map((skill) => ({
        id: skill.id,
        title: skill.title,
        category: {
          id: skill.category?.id,
          parentSlug: skill.category?.parent?.slug || '',
        },
      })),
      wantToLearn: user.wantToLearn?.map((category) => ({
        id: category.id,
        name: category.name,
        parentSlug: category.parent?.slug || '',
      })),
    }));

    return {
      data: userOutput,
      meta: {
        total,
        offset,
        limit: take,
        totalPages,
      },
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { favoriteSkills: true },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const { wantToLearn, ...data } = updateUserDto;

    if (wantToLearn) {
      const categories = await this.categoryRepository.findBy({
        id: In(wantToLearn),
      });
      if (categories.length !== wantToLearn.length) {
        throw new NotFoundException('Одна или несколько категорий не найдены');
      }
      user.wantToLearn = categories;
    }

    Object.assign(user, data);

    return await this.usersRepository.save(user);
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password || '',
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid old password');
    const salt = this.configService.get<number>('app.hashSalt') || 10;

    user.password = await bcrypt.hash(dto.newPassword, salt);
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
