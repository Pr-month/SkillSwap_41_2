import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { SkillsService } from './skills.service';
import { SkillStatus } from './enums/skills.enums';

// мокаем fs/promises для тестирования работы с файлами
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('SkillsService', () => {
  let service: SkillsService;
  let skillRepository: jest.Mocked<Repository<Skill>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;
  let userRepository: jest.Mocked<Repository<User>>;

  // тестовые данные
  const mockCategory: Category = {
    id: 1,
    name: 'Test Category',
    parent: null,
    children: [],
    slug: 'test-category',
  };

  const mockUser: User = {
    id: 10,
    name: 'John Doe',
    email: 'john@example.com',
  } as User;

  const mockSkill: Skill = {
    id: 100,
    title: 'Test Skill',
    description: 'Test Description',
    images: ['image1.jpg', 'image2.png'],
    category: mockCategory,
    owner: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    offeredInRequests: [],
    requestedInRequests: [],
    status: SkillStatus.ACTIVE,
  };

  // перед каждым тестом инициализируем сервис
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(Skill),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    skillRepository = module.get(getRepositoryToken(Skill));
    categoryRepository = module.get(getRepositoryToken(Category));
    userRepository = module.get(getRepositoryToken(User));
  });

  // после каждого теста очищаем моки
  afterEach(() => {
    jest.clearAllMocks();
  });

  // тестирование добавления в Избранное
  describe('addToFavorites', () => {
    const skillId = 100;
    const userId = 10;

    it('Навык должен добавиться в Избранное, если его в нем еще нет', async () => {
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        favoriteSkills: [],
      });

      const result = await service.addToFavorites(skillId, userId);

      expect(skillRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: skillId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        relations: ['favoriteSkills'],
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          favoriteSkills: expect.arrayContaining([mockSkill]),
        }),
      );
      expect(result).toEqual({
        message: 'Навык добавлен в избранное',
      });
    });

    it('Должна вернуться ошибка NotFound, если пытаемся добавить в Избранное несуществующий навык', async () => {
      skillRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorites(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('Должна вернуться ошибка NotFound, если навык пытается добавить в Избранное несуществующий пользователь', async () => {
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.addToFavorites(skillId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('Должна вернуться ошибка Conflict, если пытаемся добавить в Избранное навык, который уже в нем есть', async () => {
      const userWithFavorite = { ...mockUser, favoriteSkills: [mockSkill] };
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue(userWithFavorite);

      await expect(service.addToFavorites(skillId, userId)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  // тестирование удаления навыка из Избранного
  describe('removeFromFavorites', () => {
    const skillId = 100;
    const userId = 10;

    it('Навык должен удалиться из Избранного, если он в нем есть', async () => {
      const userWithFavorite = { ...mockUser, favoriteSkills: [mockSkill] };
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue(userWithFavorite);

      const result = await service.removeFromFavorites(skillId, userId);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ favoriteSkills: [] }),
      );
      expect(result).toEqual({ message: 'Навык удалён из избранного' });
    });

    it('Должна вернуться ошибка NotFound, если пытаемся удалить из Избранного несуществующий навык', async () => {
      skillRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromFavorites(skillId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка NotFound, если навык пытается удалить из Избранного несуществующий пользователь', async () => {
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromFavorites(skillId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка NotFound, если у пользователя нет Избранного', async () => {
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        favoriteSkills: undefined,
      });

      await expect(
        service.removeFromFavorites(skillId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('Должна вернуться ошибка NotFound, если пытаемся удалить из Избранного навык, которого нет в Избранном', async () => {
      const anotherSkill = {
        ...mockSkill,
        id: 999,
        status: SkillStatus.ACTIVE,
      };
      const userWithOtherFavorite = {
        ...mockUser,
        favoriteSkills: [anotherSkill],
      };
      skillRepository.findOne.mockResolvedValue(mockSkill);
      userRepository.findOne.mockResolvedValue(userWithOtherFavorite);

      await expect(
        service.removeFromFavorites(skillId, userId),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  // тестирование создания навыка
  describe('create', () => {
    const userId = 10;
    const dto: CreateSkillDto = {
      title: 'New Skill',
      description: 'New Description',
      categoryId: 1,
      images: ['new.jpg'],
    };

    it('Должен создаться новый навык', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.findOne.mockResolvedValue(mockUser);
      const newSkill = {
        ...mockSkill,
        title: dto.title,
        description: dto.description,
        category: mockCategory,
        images: dto.images,
        owner: mockUser,
        status: SkillStatus.ACTIVE,
      };
      skillRepository.create.mockReturnValue(newSkill);
      skillRepository.save.mockResolvedValue(newSkill);

      const result = await service.create(dto, userId);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: dto.categoryId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
      expect(skillRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        category: mockCategory,
        images: dto.images,
        owner: mockUser,
      });
      expect(skillRepository.save).toHaveBeenCalledWith(newSkill);
      expect(result).toEqual(newSkill);
    });

    it('Должна вернуться ошибка NotFound, если пытаемся создать навык с несуществующей категорией', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(skillRepository.create).not.toHaveBeenCalled();
    });

    it('Должна вернуться ошибка NotFound, если навык пытается создать несуществующий пользователь', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(skillRepository.create).not.toHaveBeenCalled();
    });
  });

  // тестируем получение списка всех навыков
  describe('findAll', () => {
    let queryBuilder: jest.Mocked<SelectQueryBuilder<Skill>>;

    beforeEach(() => {
      queryBuilder = {
        cache: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getCount: jest.fn(),
      } as unknown as jest.Mocked<SelectQueryBuilder<Skill>>;
      skillRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    });

    it('Должен вернуться список навыков с пагинацией', async () => {
      const expectedSkills = [
        {
          id: mockSkill.id,
          title: mockSkill.title,
          images: mockSkill.images,
          description: mockSkill.description,
          category: {
            id: mockSkill.category.id,
            parentSlug: mockSkill.category.parent?.slug || '',
          },
        },
      ];

      queryBuilder.getMany.mockResolvedValue([mockSkill]);
      queryBuilder.getCount.mockResolvedValue(2);

      const query: GetSkillsQueryDto = {};
      const result = await service.findAll(query);

      expect(skillRepository.createQueryBuilder).toHaveBeenCalledWith('skill');
      expect(queryBuilder.take).toHaveBeenCalledWith(12);
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result).toEqual(expectedSkills);
    });

    it('Должен вернуться отфильтрованный список навыков', async () => {
      const query: GetSkillsQueryDto = {
        category: 5,
        owner: 10,
        search: 'test',
        limit: 10,
        offset: 20,
      };
      queryBuilder.getMany.mockResolvedValue([]);
      queryBuilder.getCount.mockResolvedValue(100);

      await service.findAll(query);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :category',
        { category: 5 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('owner.id = :owner', {
        owner: 10,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(skill.title ILIKE :search)',
        { search: '%test%' },
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('Должна вернуться ошибка NotFound, если номер запрашиваемой страницы больше общего количества страниц', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      queryBuilder.getCount.mockResolvedValue(5);

      const query: GetSkillsQueryDto = { offset: 10 };
      await expect(service.findAll(query)).rejects.toThrow(NotFoundException);
    });
  });

  // тестирование получения одного навыка по ID
  describe('findOne', () => {
    it('should return skill if found', async () => {
      skillRepository.findOne.mockResolvedValue(mockSkill);

      const result = await service.findOne(100);

      expect(skillRepository.findOne).toHaveBeenCalledWith({
        where: { id: 100 },
        relations: ['category', 'owner'],
      });
      expect(result).toEqual(mockSkill);
    });

    it('Должна вернуться ошибка NotFound, если навык не найден', async () => {
      skillRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // тестирование обновления навыка
  describe('update', () => {
    const skillId = 100;
    const userId = 10;

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSkill);
      skillRepository.save.mockResolvedValue(mockSkill);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Должны обновиться заголовок и описание навыка', async () => {
      const updateDto: UpdateSkillDto = {
        title: 'Updated Title',
        description: 'Updated Desc',
      };

      const result = await service.update(skillId, updateDto, userId);

      expect(service.findOne).toHaveBeenCalledWith(skillId);
      expect(skillRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          description: 'Updated Desc',
        }),
      );
      expect(result).toEqual(mockSkill);
    });

    it('Должна поменяться категория навыка', async () => {
      const updateDto: UpdateSkillDto = { categoryId: 2 };
      const newCategory = {
        id: 2,
        name: 'New Cat',
      } as Category;
      categoryRepository.findOne.mockResolvedValue(newCategory);

      const result = await service.update(skillId, updateDto, userId);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
      expect(skillRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          category: newCategory,
        }),
      );
      expect(result).toEqual(mockSkill);
    });

    it('Должна вернуться ошибка BadRequest, если категория не существует', async () => {
      const updateDto: UpdateSkillDto = { categoryId: 999 };
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update(skillId, updateDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(skillRepository.save).not.toHaveBeenCalled();
    });

    it('Старые картинки должны замениться на новые', async () => {
      const updateDto: UpdateSkillDto = {
        images: ['new1.jpg', 'new2.jpg'],
      };
      mockedFs.unlink.mockResolvedValue(undefined);

      const result = await service.update(skillId, updateDto, userId);

      expect(mockedFs.unlink).toHaveBeenCalledTimes(2);
      expect(skillRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          images: ['new1.jpg', 'new2.jpg'],
        }),
      );
      expect(result).toEqual(mockSkill);
    });

    it('Должна вернуться ошибка Forbidden, если обновить навык пытается не владелец', async () => {
      const otherUserId = 999;
      await expect(service.update(skillId, {}, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(skillRepository.save).not.toHaveBeenCalled();
    });
  });

  // тестирование удаления навыка
  describe('remove', () => {
    const skillId = 100;
    const userId = 10;

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSkill);
      mockedFs.unlink.mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Должен удалиться навык и его картинки', async () => {
      await service.remove(skillId, userId);

      expect(service.findOne).toHaveBeenCalledWith(skillId);
      expect(mockedFs.unlink).toHaveBeenCalledTimes(2);
      expect(skillRepository.remove).toHaveBeenCalledWith(mockSkill);
    });

    it('Должна вернуться ошибка Forbidden, если удалить навык пытается не владелец', async () => {
      const otherUserId = 999;
      await expect(service.remove(skillId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(skillRepository.remove).not.toHaveBeenCalled();
    });
  });

  // тестирование поиска похожих навыков
  describe('findSimilarUsers', () => {
    const skillId = 100;

    it('Должен вернуться список пользователей с навыками в той же категории', async () => {
      const mockSkillWithCategory = {
        ...mockSkill,
        category: { id: 5, name: 'Programming' },
      };
      skillRepository.findOne.mockResolvedValue(mockSkillWithCategory);

      const users = [
        { id: 1, name: 'Alice', avatar: 'alice.jpg' },
        { id: 2, name: 'Bob', avatar: null },
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockImplementation(() => Promise.resolve(users)),
      } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder);

      const result = await service.findSimilarUsers(skillId);

      expect(skillRepository.findOne).toHaveBeenCalledWith({
        where: { id: skillId },
        relations: ['category'],
      });
      expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'user.skills',
        'skill',
      );
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'skill.category',
        'category',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: 5 },
      );
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({ users });
    });

    it('Должен вернуться пустой массив, если в категории нет других пользователей', async () => {
      const mockSkillWithCategory = {
        ...mockSkill,
        category: { id: 5, name: 'Programming' },
      };
      skillRepository.findOne.mockResolvedValue(mockSkillWithCategory);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockImplementation(() => Promise.resolve([])),
      } as unknown as jest.Mocked<SelectQueryBuilder<User>>;

      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder);

      const result = await service.findSimilarUsers(skillId);
      expect(result).toEqual({ users: [] });
    });

    it('Должна вернуться ошибка NotFound, если навык не найден', async () => {
      skillRepository.findOne.mockResolvedValue(null);
      await expect(service.findSimilarUsers(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // тестирование функции удаления файлов
  describe('Тестирование функции удаления файлов', () => {
    it('Должна удалиться каждая картинка либо записать ошибка в лог', async () => {
      const images = ['img1.jpg', 'img2.png'];
      mockedFs.unlink
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(undefined);
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(jest.fn());

      await service.deleteImagesFiles(images);

      expect(mockedFs.unlink).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete image img1.jpg:',
        'ENOENT',
      );
      consoleSpy.mockRestore();
    });

    it('Ничего не должно произойти, если массив с картинками пуст или не задан', async () => {
      await service.deleteImagesFiles([]);
      await service.deleteImagesFiles(undefined as unknown as string[]);
      expect(mockedFs.unlink).not.toHaveBeenCalled();
    });
  });
});
