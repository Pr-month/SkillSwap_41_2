import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { UserRole } from 'src/users/enums/users.enums';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  ApiCategoriesDelete,
  ApiCategoriesGetAll,
  ApiCategoriesGetOne,
  ApiCategoriesPatch,
  ApiCategoriesPost,
} from './categories.swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiCategoriesPost()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiCategoriesGetAll()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiCategoriesGetOne()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @ApiCategoriesPatch()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @ApiCategoriesDelete()
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
