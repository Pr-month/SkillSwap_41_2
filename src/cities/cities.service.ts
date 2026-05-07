import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { City } from './entities/city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async create(createCityDto: CreateCityDto) {
    const existing = await this.cityRepository.findOne({
      where: {
        name: createCityDto.name,
      },
    });

    if (existing) {
      throw new ConflictException('Такой город уже существует');
    }

    const city = this.cityRepository.create(createCityDto);
    return this.cityRepository.save(city);
  }

  async findAll() {
    const cities = await this.cityRepository.find({
      order: { name: 'ASC' },
    });

    if (cities.length === 0) {
      throw new NotFoundException('Города не найдены');
    }

    return cities;
  }

  async findOne(id: number) {
    const city = await this.cityRepository.findOneOrFail({ where: { id } });
    return city;
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`Город с ID  ${id} не найден`);
    }

    Object.assign(city, updateCityDto);

    return await this.cityRepository.save(city);
  }

  async remove(id: number) {
    const city = await this.cityRepository.findOne({ where: { id } });

    if (!city) {
      throw new NotFoundException(`Город с ID  ${id} не найден`);
    }

    await this.cityRepository.remove(city);
    return { message: `Город "${city.name}" успешно удален` };
  }
}
