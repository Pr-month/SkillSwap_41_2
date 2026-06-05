import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      parent: createCategoryDto.parentId
        ? { id: createCategoryDto.parentId }
        : null,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        where: { parent: IsNull() },
        relations: ['children'],
      });

      if (!categories) {
        console.error('Catergories are undefined!');
        return [];
      }

      return categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        subCategory:
          category.children?.map((child) => ({
            id: child.id,
            name: child.name,
          })) || [],
      }));
    } catch (error) {
      console.error(' Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children', 'parent'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);

    if (updateCategoryDto.parentId !== undefined) {
      category.parent = updateCategoryDto.parentId
        ? ({ id: updateCategoryDto.parentId } as Category)
        : null;
    }

    return await this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Категория с ID ${id} не найдена`);
    }
    await this.categoryRepository.remove(category);
    return { message: `Категория "${category.name}" успешно удалена` };
  }
}
