import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { FindUsersQueryDto } from './dto/get-users.dto';
import { Category } from '../categories/entities/category.entity';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCategoryRepo = {
    findBy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(10),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('remove', () => {
    it('должен удалить пользователя, если он существует', async () => {
      const user = { id: 1, name: 'Test', email: 'test@test.com' } as User;
      mockRepo.findOne.mockResolvedValue(user);
      mockRepo.remove.mockResolvedValue(user);

      await service.remove(1);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepo.remove).toHaveBeenCalledWith(user);
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('должен вернуть пользователя, если ID существует', async () => {
      const user = { id: 1, name: 'Alice' } as User;
      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findById(1);
      expect(result).toEqual(user);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(404)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('должен обновить и вернуть пользователя', async () => {
      const existingUser = {
        id: 1,
        name: 'Old Name',
        email: 'old@test.com',
      } as User;
      const updateDto = { name: 'New Name' };
      const savedUser = { ...existingUser, ...updateDto };

      mockRepo.findOne.mockResolvedValue(existingUser);
      mockRepo.save.mockResolvedValue(savedUser);

      const result = await service.update(1, updateDto);
      expect(result.name).toBe('New Name');
      expect(mockRepo.save).toHaveBeenCalledWith(savedUser);
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('должен обновить пароль при верном старом пароле', async () => {
      const user = {
        id: 1,
        password: await bcrypt.hash('oldPass', 10),
      } as User;
      const dto = { oldPassword: 'oldPass', newPassword: 'newPass1' };

      mockRepo.findOne.mockResolvedValue(user);
      mockRepo.save.mockResolvedValue(user);

      const result = await service.updatePassword(1, dto);
      expect(result.message).toBe('Пароль успешно обновлен.');
      expect(mockRepo.save).toHaveBeenCalledWith(user);
      const isNewHash = await bcrypt.compare('newPass1', user.password || '');
      expect(isNewHash).toBe(true);
    });

    it('должен выбросить UnauthorizedException при неверном старом пароле', async () => {
      const user = {
        id: 1,
        password: await bcrypt.hash('correctOld', 10),
      } as User;
      mockRepo.findOne.mockResolvedValue(user);

      await expect(
        service.updatePassword(1, {
          oldPassword: 'wrongOld',
          newPassword: 'newPass1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePassword(1, {
          oldPassword: 'any',
          newPassword: 'newPass1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('должен создать пользователя, если email не занят', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const dto = {
        name: 'New User',
        email: 'new@test.com',
        password: 'pass1A',
      };
      const createdUser = { id: 1, ...dto, password: 'hashed' };
      mockRepo.create.mockReturnValue(createdUser);
      mockRepo.save.mockResolvedValue(createdUser);

      const result = await service.create(dto);
      expect(result).toEqual(createdUser);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('должен выбросить ConflictException, если email уже существует', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 2 });
      await expect(
        service.create({
          name: 'D',
          email: 'dup@test.com',
          password: 'pass1A',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('должен вернуть пагинированный список пользователей', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User1',
          email: 'user1@test.com',
          birthdate: new Date(),
          gender: 'male',
          avatar: 'avatar1.jpg',
          createdAt: new Date(),
          city: { id: 1, name: 'Moscow' },
          skills: [
            {
              id: 1,
              title: 'JS',
              category: { id: 1, parent: { id: 1, slug: 'programming' } },
            },
          ],
          favoriteSkills: [{ id: 2, title: 'Python' }],
          wantToLearn: [
            {
              id: 1,
              name: 'Web Development',
              parent: { id: 1, slug: 'it' },
            },
          ],
        },
      ];

      const query: FindUsersQueryDto = { limit: 10, offset: 0, search: '' };

      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 1]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.offset).toBe(0);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      // В сервисе 7 вызовов leftJoinAndSelect, а не 6
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledTimes(7);
      expect(mockQb.andWhere).toHaveBeenCalled();
    });
  });
});
