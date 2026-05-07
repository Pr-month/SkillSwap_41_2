import { Injectable, NotFoundException } from '@nestjs/common';
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
    const city = this.cityRepository.create({
      name: createCityDto.name,
      country: createCityDto.country,
      region: createCityDto.region,
    });

    return await this.cityRepository.save(city);
  }

  async findAll() {
    try {
      return this.cityRepository.find();
    } catch (error) {
      console.error(' Error in findAll:', error);
      throw error;
    }
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
