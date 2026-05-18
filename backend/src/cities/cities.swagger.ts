import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update.city.dto';
import { City } from './entities/city.entity';

const UnauthorizedResponse = ApiResponse({
  status: 401,
  description:
    'Пользователь не авторизован (отсутствует или недействительный JWT)',
  schema: {
    example: {
      statusCode: 401,
      message: 'Требуется авторизация',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/cities',
    },
  },
});

const ForbiddenResponse = ApiResponse({
  status: 403,
  description: 'Доступ запрещён (нет прав на данное действие)',
  schema: {
    example: {
      statusCode: 403,
      message: 'Вы не можете создавать, удалять или изменять города',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/cities',
    },
  },
});

const NotFoundResponse = ApiResponse({
  status: 404,
  description: 'Ресурс не найден',
  schema: {
    example: {
      statusCode: 404,
      message: 'Город не найден',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/cities?search=Nonexistent',
    },
  },
});

const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Конфликт (например, такой город уже есть)',
  schema: {
    example: {
      statusCode: 409,
      message: 'Такой город уже существует',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/cities',
    },
  },
});

const BadRequestResponse = ApiResponse({
  status: 400,
  description: 'Ошибка валидации входных данных',
  schema: {
    example: {
      statusCode: 400,
      message: 'Данные не валидны',
      errors: [
        {
          field: 'name',
          errors: ['name should not be empty', 'name must be a string'],
        },
      ],
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/cities?search=Nonexistent',
    },
  },
});

export function ApiCreateCity() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Создание нового города',
      description: 'Доступен только администраторам',
    }),
    ApiBody({
      type: CreateCityDto,
      description: 'Данные для создания города',

      examples: {
        full: {
          summary: 'Пример запроса со всеми полями',
          value: {
            name: 'Москва',
            country: 'Россия',
            region: 'Московская область',
          },
        },
        partial: {
          summary: 'Пример запроса только с обязательными полями',
          value: {
            name: 'Санкт-Петербург',
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: 'Город успешно создан',
      type: City,
      schema: {
        example: {
          id: 1,
          name: 'Москва',
          country: 'Россия',
          region: 'Московская область',
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T10:00:00.000Z',
        },
      },
    }),
    ConflictResponse,
    BadRequestResponse,
    UnauthorizedResponse,
    NotFoundResponse,
  );
}

export function ApiFindAllCities() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение списка городов с поиском и лимитом',
      description:
        'Публичный эндпоинт. Поддерживает query параметры для поиска, а также лимит',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'название города',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'количество городов',
      example: 10,
    }),

    ApiExtraModels(City),
    ApiOkResponse({
      description: 'Список городов успешно получен',
      schema: {
        type: 'array',
        items: { $ref: getSchemaPath(City) },
        example: [
          {
            id: 1,
            name: 'Москва',
            country: 'Россия',
            region: 'Московская область',
            createdAt: '2025-05-06T10:00:00.000Z',
            updatedAt: '2025-05-06T10:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Запрашиваемые города не найдены',
      schema: {
        example: {
          statusCode: 404,
          message: 'Города не найдены',
          timestamp: '2025-05-06T12:00:00.000Z',
          path: '/cities?search=Nonexistent',
        },
      },
    }),
    BadRequestResponse,
  );
}

export function ApiFindOneCity() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение одного города по ID',
      description: 'Возвращает полную информацию о городе',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID города',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Город найден',
      type: City,
      schema: {
        example: {
          id: 1,
          name: 'Москва',
          country: 'Россия',
          region: 'Московская область',
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T10:00:00.000Z',
        },
      },
    }),
    NotFoundResponse,
    BadRequestResponse,
  );
}

export function ApiUpdateCity() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновление города',
      description:
        'Доступно только администраторам. Можно обновлять name, country и region',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID обновляемого города',
      example: 1,
    }),
    ApiBody({
      type: UpdateCityDto,
      description: 'Обновляемые поля (все необязательны)',
      examples: {
        full: {
          summary: 'Обновление всех полей',
          value: {
            name: 'Москва',
            country: 'Россия',
            region: 'Московская область',
          },
        },
        partial: {
          summary: 'Обновление только названия',
          value: { name: 'Новое название' },
        },
      },
    }),
    ApiOkResponse({
      description: 'Город успешно обновлён',
      type: City,
      schema: {
        example: {
          id: 1,
          name: 'Санкт-Петербург',
          country: 'Россия',
          region: 'Ленинградская область',
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T10:00:00.000Z',
        },
      },
    }),
    BadRequestResponse,
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse,
  );
}

export function ApiRemoveCity() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удаление города',
      description: 'Доступно только администраторам',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID удаляемого города',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Город успешно удалён',
      schema: {
        example: {
          message: 'Город "Москва" успешно удален',
        },
      },
    }),
    ApiResponse({
      status: 204,
      description: 'Успешное удаление (нет содержимого)',
    }),
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse,
  );
}
