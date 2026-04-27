import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { GetSkillsQueryDto } from './dto/get-skills';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {}

  create(createSkillDto: CreateSkillDto) {
    return 'This action adds a new skill';
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
