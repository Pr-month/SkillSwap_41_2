import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CitiesService', () => {
  let service: CitiesService;
  let repository: Repository<City>;

  const mockCityRepository = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitiesService,
        {
          provide: getRepositoryToken(City),
          useValue: mockCityRepository,
        },
      ],
    }).compile();

    service = module.get<CitiesService>(CitiesService);
    repository = module.get<Repository<City>>(getRepositoryToken(City));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Метод create', () => {
    const createCityDto = { name: 'Almaty' };

    it('Тест должен создавать новый город', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(createCityDto as City);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ id: 1, ...createCityDto } as City);

      const result = await service.create(createCityDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: createCityDto.name },
      });
      expect(repository.create).toHaveBeenCalledWith(createCityDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'Almaty' });
    });

    it('Должен прокидывать ConflictException, если город уже существует', async () => {
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ id: 1, name: 'Almaty' } as City);

      await expect(service.create(createCityDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('Метод findAll', () => {
    it('Должен вызывать queryBuilder с лимитами по умолчанию', async () => {
      const queryBuilderMock: Partial<SelectQueryBuilder<City>> = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(queryBuilderMock as SelectQueryBuilder<City>);

      await service.findAll();

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('city');
      expect(queryBuilderMock.select).toHaveBeenCalledWith([
        'city.id',
        'city.name',
      ]);
      expect(queryBuilderMock.take).toHaveBeenCalledWith(64);
      expect(queryBuilderMock.orderBy).toHaveBeenCalledWith('city.name', 'ASC');
    });

    it('Должен применять поисковой фильтр и кастомный лимит', async () => {
      const queryBuilderMock: Partial<SelectQueryBuilder<City>> = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(queryBuilderMock as SelectQueryBuilder<City>);

      await service.findAll('  Astana  ', 10);

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'city.name ILIKE :search',
        { search: '%Astana%' },
      );
      expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
    });
  });

  describe('Метод findOne', () => {
    it('Должен вернуть город, если таковой существует', async () => {
      const mockCity = { id: 1, name: 'Almaty' } as City;
      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockCity);

      const result = await service.findOne(1);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockCity);
    });
  });

  describe('Метод update', () => {
    const updateCityDto = { name: 'New Almaty' };

    it('Должен успешно обновлять данные города', async () => {
      const existingCity = { id: 1, name: 'Old Almaty' } as City;
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingCity);
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...existingCity, ...updateCityDto });

      const result = await service.update(1, updateCityDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(existingCity.name).toBe('New Almaty');
      expect(result.name).toBe('New Almaty');
    });

    it('Должен прокидывать ошибку NotFoundException если город не существует', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, updateCityDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Метод remove', () => {
    it('Должен удалять город без ошибок', async () => {
      const existingCity = { id: 1, name: 'Almaty' } as City;
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingCity);
      jest.spyOn(repository, 'remove').mockResolvedValue(existingCity);

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(existingCity);
      expect(result).toEqual({
        message: `Город "${existingCity.name}" успешно удален`,
      });
    });

    it('Должен прокидывать ошибку NotFoundException если город не существует', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
