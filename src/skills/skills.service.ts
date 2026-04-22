import { Injectable } from '@nestjs/common';
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
    const { categoryId, ownerId, search, limit, offset } = query;

    // собираем запрос
    const qb = this.skillsRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.category', 'category')
      .leftJoinAndSelect('skill.owner', 'owner');

    // фильтры
    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (ownerId) {
      qb.andWhere('owner.id = :ownerId', { ownerId });
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
    const take = limit ?? 20;
    const skip = offset ?? 0;

    qb.take(take);
    qb.skip(skip);

    return qb.getMany();
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
