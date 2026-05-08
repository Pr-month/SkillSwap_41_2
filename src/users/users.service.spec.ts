import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { FindUsersQueryDto } from './dto/get-users.dto';
import * as bcrypt from 'bcrypt';
//import { UserRole } from './enums/users.enums';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;
  let configService: ConfigService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);

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
      const existingUser = { id: 1, name: 'Old Name', email: 'old@test.com' } as User;
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
      expect(mockRepo.save).toHaveBeenCalled();
      const savedUser = (mockRepo.save as jest.Mock).mock.calls[0][0];
      const isNewHash = await bcrypt.compare('newPass1', savedUser.password);
      expect(isNewHash).toBe(true);
    });

    it('должен выбросить UnauthorizedException при неверном старом пароле', async () => {
      const user = {
        id: 1,
        password: await bcrypt.hash('correctOld', 10),
      } as User;
      mockRepo.findOne.mockResolvedValue(user);

      await expect(
        service.updatePassword(1, { oldPassword: 'wrongOld', newPassword: 'newPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('должен выбросить NotFoundException, если пользователь не найден', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updatePassword(1, { oldPassword: 'any', newPassword: 'newPass1' }),
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
      mockRepo.findOne.mockResolvedValue({ id: 2 } as User);
      await expect(
        service.create({ name: 'D', email: 'dup@test.com', password: 'pass1A' }),
      ).rejects.toThrow(ConflictException);
    });
  });


  describe('findAll', () => {
    it('должен вернуть пагинированный список пользователей', async () => {
      const users = [{ id: 1, name: 'User1' }, { id: 2, name: 'User2' }] as User[];
      const query: FindUsersQueryDto = { limit: 10, offset: 1, search: '' };

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(users),
        getCount: jest.fn().mockResolvedValue(users.length),
      };

      mockRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQb);

      const result = await service.findAll(query);
      expect(result.data).toEqual(users);
      expect(result.meta.total).toBe(2);
      expect(result.meta.offset).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('должен выбросить NotFoundException, если страница за пределами', async () => {
      const query: FindUsersQueryDto = { limit: 10, offset: 99, search: '' };

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQb);

      await expect(service.findAll(query)).rejects.toThrow(NotFoundException);
    });
  });
});