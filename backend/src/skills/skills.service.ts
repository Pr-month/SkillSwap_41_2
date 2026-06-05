import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs/promises';
import path from 'path';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { SkillResponseDto } from './dto/skill-response.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async addToFavorites(
    skillId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const skill = await this.skillRepository.findOne({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isAlreadyFavorite = user.favoriteSkills?.some(
      (fav) => fav.id === skillId,
    );
    if (isAlreadyFavorite) {
      throw new ConflictException('Навык уже находится в избранном');
    }

    user.favoriteSkills = user.favoriteSkills
      ? [...user.favoriteSkills, skill]
      : [skill];
    await this.userRepository.save(user);

    return { message: 'Навык добавлен в избранное' };
  }

  async removeFromFavorites(
    skillId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const skill = await this.skillRepository.findOne({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteSkills'],
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.favoriteSkills) {
      throw new NotFoundException('Навык не найден в избранном');
    }

    const favoriteIndex = user.favoriteSkills.findIndex(
      (fav) => fav.id === skillId,
    );
    if (favoriteIndex === -1) {
      throw new NotFoundException('Навык не найден в избранном');
    }

    user.favoriteSkills.splice(favoriteIndex, 1);
    await this.userRepository.save(user);

    return { message: 'Навык удалён из избранного' };
  }

  async create(dto: CreateSkillDto, userId: number) {
    const [category, owner] = await Promise.all([
      this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      }),
      this.userRepository.findOne({
        where: { id: userId },
      }),
    ]);

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    if (!owner) {
      throw new NotFoundException('Пользователь не найден');
    }

    const skill = this.skillRepository.create({
      title: dto.title,
      description: dto.description,
      category: category,
      images: dto.images ?? [],
      owner,
    });

    return await this.skillRepository.save(skill);
  }

  async findAll(query: GetSkillsQueryDto): Promise<SkillResponseDto[]> {
    const { category, owner, search, limit, offset } = query;

    // собираем запрос (qb - query builder)
    const qb = this.skillRepository
      .createQueryBuilder('skill')
      .cache(true) // кэширование
      .leftJoinAndSelect('skill.category', 'category') // внешние связи
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('skill.owner', 'owner');

    // фильтры
    if (category) {
      qb.andWhere('category.id = :category', { category });
    }

    if (owner) {
      qb.andWhere('owner.id = :owner', { owner });
    }

    if (search) {
      qb.andWhere('(skill.title ILIKE :search)', { search: `%${search}%` });
    }

    // сортировка (последние навыки)
    qb.orderBy('skill.createdAt', 'DESC');

    // пагинация / дефолт
    const take = limit ?? 12;
    const skip = offset ?? 0;

    // LIMIT take OFFSET skip
    qb.take(take); // количество записей
    qb.skip(skip);

    const data = await qb.getMany();
    const total = await qb.getCount();

    if (skip > total) throw new NotFoundException('Навыки не найдены');

    return data.map((skill: Skill) => ({
      id: skill.id,
      title: skill.title,
      images: skill.images,
      description: skill.description,
      category: {
        id: skill.category.id,
        parentSlug: skill.category.parent?.slug || '',
      },
    }));
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id },
      relations: ['category', 'owner'],
    });

    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    return skill;
  }

  async update(
    id: number,
    updateSkillDto: UpdateSkillDto,
    userId: number,
  ): Promise<Skill> {
    const skill = await this.findOne(id);

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('You can only update your own skills');
    }

    if (updateSkillDto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateSkillDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(
          `Category with id ${updateSkillDto.categoryId} not found`,
        );
      }
      skill.category = category;
    }

    if (updateSkillDto.title !== undefined) skill.title = updateSkillDto.title;
    if (updateSkillDto.description !== undefined) {
      skill.description = updateSkillDto.description;
    }

    if (updateSkillDto.images !== undefined) {
      await this.deleteImagesFiles(skill.images);
      skill.images = updateSkillDto.images;
    }

    return this.skillRepository.save(skill);
  }

  async remove(id: number, userId: number): Promise<void> {
    const skill = await this.findOne(id);

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('You can only delete your own skills');
    }

    await this.deleteImagesFiles(skill.images);
    await this.skillRepository.remove(skill);
  }

  async findSimilarUsers(skillId: number): Promise<{ users: Partial<User>[] }> {
    const skill = await this.skillRepository.findOne({
      where: { id: skillId },
      relations: ['category'],
    });
    if (!skill) {
      throw new NotFoundException('Навык не найден');
    }

    const categoryId = skill.category.id;

    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.skills', 'skill')
      .innerJoin('skill.category', 'category')
      .where('category.id = :categoryId', { categoryId })
      .groupBy('user.id')
      .select(['user.id', 'user.name', 'user.avatar'])
      .orderBy('user.name', 'ASC')
      .limit(10)
      .getMany();

    return { users };
  }

  async deleteImagesFiles(images: string[]): Promise<void> {
    if (!images || images.length === 0) return;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    for (const image of images) {
      try {
        const filePath = path.join(uploadDir, image);
        await fs.unlink(filePath);
      } catch (error) {
        console.error(
          `Failed to delete image ${image}:`,
          (error as Error).message,
        );
      }
    }
  }
}
