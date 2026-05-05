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
import { CategoriesService } from './categories.service';
import { CategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { UserRole } from 'src/users/enums/users.enums';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({
    summary: 'Создание категории',
    description: 'Создаёт новую категорию или подгатегорию',
  })

  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Категория создана' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав',
  })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Post()
  create(@Body() createCategoryDto: CategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiOperation({
    summary: 'Получение списка категорий',
    description: 'Возвращает все корневые категории вместе с их подкатегориями',
  })
  @ApiResponse({
    status: 200,
    description: 'Список категории получен'
  })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({
    summary: 'Получение категории по ID',
    description: 'Возвращает категорию вместе с её родителем и подкатегориями'
  })
  @ApiParam({ name: 'id', description: 'ID категории', example: 1 })
  @ApiResponse({ status: 200, description: 'Категория найдена' })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @ApiOperation({
    summary: 'Обновление категории',
    description: 'Обновляет категорию по ID',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID категории', example: 1 })
  @ApiResponse({ status: 200, description: 'Категория обновлена' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации данных' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав',
  })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }


  @ApiOperation({
    summary: 'Удаление категории',
    description: 'Удаляет категорию по ID',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID категории', example: 1 })
  @ApiResponse({ status: 200, description: 'Категория удалена' })
  @ApiResponse({ status: 401, description: 'Пользователь не авторизован' })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав',
  })
  @ApiResponse({ status: 404, description: 'Категория не найдена' })
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
