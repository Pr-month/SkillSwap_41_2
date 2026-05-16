import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Repository<Category>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    repository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create category', async () => {
      const dto = {
        name: 'Frontend',
      };

      const savedCategory = {
        id: 1,
        name: 'Frontend',
      };

      repository.create.mockReturnValue(savedCategory as Category);

      repository.save.mockResolvedValue(savedCategory as Category);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        parent: null,
      });

      expect(repository.save).toHaveBeenCalled();

      expect(result).toEqual(savedCategory);
    });
  });

  describe('findAll', () => {
    it('should return categories', async () => {
      const categories = [
        {
          id: 1,
          name: 'Frontend',
        },
      ];

      repository.find.mockResolvedValue(categories as Category[]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();

      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      const category = {
        id: 1,
        name: 'Frontend',
      };

      repository.findOne.mockResolvedValue(category as Category);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['children', 'parent'],
      });

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      const category = {
        id: 1,
        name: 'Frontend',
      };

      const updateDto = {
        name: 'Backend',
      };

      const updatedCategory = {
        id: 1,
        name: 'Backend',
      };

      repository.findOne.mockResolvedValue(category as Category);

      repository.save.mockResolvedValue(updatedCategory as Category);

      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(repository.save).toHaveBeenCalled();

      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove category', async () => {
      const category = {
        id: 1,
        name: 'Frontend',
      };

      repository.findOne.mockResolvedValue(category as Category);

      repository.remove.mockResolvedValue(category as Category);

      const result = await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(category);

      expect(result).toEqual({
        message: `Категория "Frontend" успешно удалена`,
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});