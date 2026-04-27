import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { GetSkillsQueryDto } from './dto/get-skills';

import { Skill } from './entities/skill.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateSkillDto, userId: number) {
    const [category, owner] = await Promise.all([
      this.skillRepository.findOne({
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

  async findAll(query: GetSkillsQueryDto): Promise<Skill[]> {
    const { category, owner, search, limit, offset } = query;

    // собираем запрос (qb - query builder)
    const qb = this.skillsRepository
      .createQueryBuilder('skill')
      .cache(true) // кэширование
      .leftJoinAndSelect('skill.category', 'category') // внешние связи
      .leftJoinAndSelect('skill.owner', 'owner');

    // фильтры
    if (category) {
      qb.andWhere('category.id = :category', { category });
    }

    if (owner) {
      qb.andWhere('owner.id = :owner', { owner });
    }

    if (search) {
      qb.andWhere(
        '(skill.title ILIKE :search OR skill.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // сортировка (последние навыки)
    qb.orderBy('skill.createdAt', 'DESC');

    // пагинация / дефолт
    const take = limit ?? 21;
    const skip = offset ?? 0;

    // LIMIT take OFFSET skip
    qb.take(take); // количество записей
    qb.skip(skip); 

    const data = await qb.getMany();
    const total = await qb.getCount();

    if (skip > total) throw new NotFoundException('Навыки не найдены');

    return data;
  }

  findOne(id: number) {
    return `This action returns a #${id} skill`;
  }

  update(id: number, updateSkillDto: UpdateSkillDto) {
    return `This action updates a #${id} skill`;
  }

  remove(id: number) {
    return `This action removes a #${id} skill`;
  }
}
