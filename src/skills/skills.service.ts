import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DeepPartial, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createSkillDto: CreateSkillDto, user: User): Promise<Skill> {
    const { categoryId, title, description, images } = createSkillDto;

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(`Category with id ${categoryId} not found`);
    }

    // Явное приведение типа для обхода строгой проверки DeepPartial
    const skillData: DeepPartial<Skill> = {
      title,
      description,
      images: images ?? [],
      category,
      owner: user,
    };
    const skill = this.skillRepository.create(skillData);
    return this.skillRepository.save(skill);
  }

  async findAll(query: GetSkillsQueryDto): Promise<{
    data: Skill[];
    page: number;
    totalPages: number;
  }> {
    const { categoryId, ownerId, search, page = 1, limit = 20 } = query;
    const take = limit;
    const skip = (page - 1) * take;

    const qb = this.skillRepository
      .createQueryBuilder('skill')
      .leftJoinAndSelect('skill.category', 'category')
      .leftJoinAndSelect('skill.owner', 'owner');

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

    qb.orderBy('skill.createdAt', 'DESC');

    const [data, total] = await qb.take(take).skip(skip).getManyAndCount();
    const totalPages = Math.ceil(total / take);

    if (page > totalPages && totalPages > 0) {
      throw new NotFoundException('Page exceeds total number of pages');
    }

    return { data, page, totalPages };
  }

  async findOne(id: number): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id },
      relations: ['category', 'owner'],
    });
    if (!skill) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }
    return skill;
  }

  async update(id: number, updateSkillDto: UpdateSkillDto, userId: number): Promise<Skill> {
    const skill = await this.findOne(id);

    if (skill.owner.id !== userId) {
      throw new ForbiddenException('You can only update your own skills');
    }

    if (updateSkillDto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateSkillDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException(`Category with id ${updateSkillDto.categoryId} not found`);
      }
      skill.category = category;
    }

    if (updateSkillDto.title !== undefined) skill.title = updateSkillDto.title;
    if (updateSkillDto.description !== undefined) skill.description = updateSkillDto.description;

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

  private async deleteImagesFiles(images: string[]): Promise<void> {
    if (!images || images.length === 0) return;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    for (const image of images) {
      try {
        const filePath = path.join(uploadDir, image);
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete image ${image}:`, (error as Error).message);
      }
    }
  }
}
