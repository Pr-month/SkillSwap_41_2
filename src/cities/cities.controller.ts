import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/enums/users.enums';
import { CitiesService } from './cities.service';
import {
  ApiCreateCity,
  ApiFindAllCities,
  ApiFindOneCity,
  ApiRemoveCity,
  ApiUpdateCity,
} from './cities.swagger';
import { CreateCityDto } from './dto/create-city.dto';
import { GetCitiesDto } from './dto/get-cities.dto';
import { UpdateCityDto } from './dto/update.city.dto';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  @ApiCreateCity()
  create(@Body() createCityDto: CreateCityDto) {
    return this.citiesService.create(createCityDto);
  }

  @Get()
  @ApiFindAllCities()
  async findAll(@Query() query: GetCitiesDto) {
    return this.citiesService.findAll(query.search, query.limit);
  }

  @Get(':id')
  @ApiFindOneCity()
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(+id);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  @ApiUpdateCity()
  update(@Param('id') id: string, @Body() updateCityDto: UpdateCityDto) {
    return this.citiesService.update(+id, updateCityDto);
  }

  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  @ApiRemoveCity()
  remove(@Param('id') id: string) {
    return this.citiesService.remove(+id);
  }
}
