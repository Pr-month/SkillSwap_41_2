import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

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

  findAll() {
    return `This action returns all skills`;
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
