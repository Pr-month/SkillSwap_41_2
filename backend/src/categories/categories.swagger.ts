import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiCategoriesPost() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Создание категории',
      description: 'Создаёт новую категорию или подкатегорию',
    }),
    ApiResponse({ status: 201, description: 'Категория создана' }),
    ApiResponse({ status: 400, description: 'Ошибка валидации данных' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
  );
}

export function ApiCategoriesGetAll() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение списка категорий',
      description:
        'Возвращает все корневые категории вместе с их подкатегориями',
    }),
    ApiResponse({ status: 200, description: 'Список категорий получен' }),
  );
}

export function ApiCategoriesGetOne() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение категории по ID',
      description:
        'Возвращает категорию вместе с её родителем и подкатегориями',
    }),
    ApiParam({ name: 'id', description: 'ID категории', example: 1 }),
    ApiResponse({ status: 200, description: 'Категория найдена' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesPatch() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновление категории',
      description: 'Обновляет категорию по ID',
    }),
    ApiParam({ name: 'id', description: 'ID категории', example: 1 }),
    ApiResponse({ status: 200, description: 'Категория обновлена' }),
    ApiResponse({ status: 400, description: 'Ошибка валидации данных' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}

export function ApiCategoriesDelete() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удаление категории',
      description: 'Удаляет категорию по ID',
    }),
    ApiParam({ name: 'id', description: 'ID категории', example: 1 }),
    ApiResponse({ status: 200, description: 'Категория удалена' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({ status: 403, description: 'Недостаточно прав' }),
    ApiResponse({ status: 404, description: 'Категория не найдена' }),
  );
}
