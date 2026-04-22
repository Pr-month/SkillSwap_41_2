import { Injectable } from '@nestjs/common';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(dto: CreateSkillDto, user: User) {
    const category = await this.skillRepository.findOne({
      where: { id: dto.categoryId }
    });

    if (!category) {
      throw new Error('Категория не найдена');
    }

    const skill = this.skillRepository.create({
      title: dto.title,
      description: dto.description,
      category: category,
      images: dto.images ?? [],
      owner: user,
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
