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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';

const UnauthorizedResponse = ApiResponse({
  status: 401,
  description:
    'Пользователь не авторизован (отсутствует или недействительный JWT)',
  schema: {
    example: {
      statusCode: 401,
      message: 'Требуется авторизация',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/skills',
    },
  },
});

const ForbiddenResponse = ApiResponse({
  status: 403,
  description: 'Доступ запрещён (нет прав на данное действие)',
  schema: {
    example: {
      statusCode: 403,
      message: 'Вы можете удалять собственные навыки',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/skills/1',
    },
  },
});

const NotFoundResponse = ApiResponse({
  status: 404,
  description: 'Ресурс не найден',
  schema: {
    example: {
      statusCode: 404,
      message: 'Навык не найден',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/skills/999',
    },
  },
});

const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Конфликт (например, навык уже в избранном)',
  schema: {
    example: {
      statusCode: 409,
      message: 'Навык уже находится в избранном',
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/skills/1/favorite',
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
          field: 'title',
          errors: ['title should not be empty'],
        },
      ],
      timestamp: '2025-05-06T12:00:00.000Z',
      path: '/skills',
    },
  },
});

export function ApiCreateSkill() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Создание нового навыка',
      description:
        'Доступен только авторизованным пользователям. В поле owner автоматически подставляется текущий пользователь.',
    }),
    ApiBody({
      type: CreateSkillDto,
      description: 'Данные для создания навыка',
      examples: {
        example1: {
          summary: 'Пример запроса',
          value: {
            title: 'React разработка',
            description: 'Создание интерактивных интерфейсов',
            categoryId: 5,
            images: ['react.png', 'hooks.jpg'],
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Навык успешно создан',
      type: Skill,
      schema: {
        example: {
          id: 42,
          title: 'React разработка',
          description: 'Создание интерактивных интерфейсов',
          images: ['react.png', 'hooks.jpg'],
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T10:00:00.000Z',
          category: {
            id: 5,
            name: 'Frontend',
            parent: null,
          },
          owner: {
            id: 1,
            name: 'Иван Иванов',
            email: 'ivan@example.com',
            role: 'USER',
          },
        },
      },
    }),
    BadRequestResponse,
    UnauthorizedResponse,
    NotFoundResponse,
  );
}

export function ApiFindAllSkills() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение списка навыков с фильтрацией и пагинацией',
      description:
        'Публичный эндпоинт. Поддерживает фильтры по категории, владельцу, поиск по заголовку/описанию, а также пагинацию (limit/offset).',
    }),
    ApiQuery({
      name: 'category',
      required: false,
      type: Number,
      description: 'ID категории для фильтрации',
      example: 5,
    }),
    ApiQuery({
      name: 'owner',
      required: false,
      type: Number,
      description: 'ID владельца для фильтрации',
      example: 3,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Поиск по title или description',
      example: 'React',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Количество записей на страницу',
      example: 10,
    }),
    ApiQuery({
      name: 'offset',
      required: false,
      type: Number,
      description: 'Количество пропущенных записей',
      example: 2,
    }),
    ApiExtraModels(Skill),
    ApiOkResponse({
      description: 'Список навыков успешно получен',
      schema: {
        type: 'array',
        items: { $ref: getSchemaPath(Skill) },
        example: [
          {
            id: 1,
            title: 'TypeScript',
            description: 'Изучение TS',
            images: [],
            createdAt: '2025-05-06T08:00:00Z',
            updatedAt: '2025-05-06T08:00:00Z',
            category: {
              id: 3,
              name: 'Programming',
            },
            owner: {
              id: 1,
              name: 'Alice',
            },
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Запрашиваемая страница не существует',
      schema: {
        example: {
          statusCode: 404,
          message: 'Навыки не найдены',
          timestamp: '2025-05-06T12:00:00.000Z',
          path: '/skills?offset=100',
        },
      },
    }),
    BadRequestResponse,
  );
}

export function ApiFindOneSkill() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение одного навыка по ID',
      description:
        'Возвращает полную информацию о навыке, включая категорию и владельца.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID навыка',
      example: 42,
    }),
    ApiOkResponse({
      description: 'Навык найден',
      type: Skill,
      schema: {
        example: {
          id: 42,
          title: 'React разработка',
          description: 'Создание интерактивных интерфейсов',
          images: ['react.png'],
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T10:00:00.000Z',
          category: {
            id: 5,
            name: 'Frontend',
            parent: null,
          },
          owner: {
            id: 1,
            name: 'Иван Иванов',
            email: 'ivan@example.com',
            role: 'USER',
          },
        },
      },
    }),
    NotFoundResponse,
    BadRequestResponse,
  );
}

export function ApiUpdateSkill() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновление навыка',
      description:
        'Доступно только владельцу навыка. Можно обновлять title, description, categoryId, images.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID обновляемого навыка',
      example: 42,
    }),
    ApiBody({
      type: UpdateSkillDto,
      description: 'Обновляемые поля (все необязательны)',
      examples: {
        full: {
          summary: 'Обновление всех полей',
          value: {
            title: 'React + Redux',
            description: 'Продвинутый React с Redux Toolkit',
            categoryId: 6,
            images: ['new-image.jpg'],
          },
        },
        partial: {
          summary: 'Обновление только заголовка',
          value: { title: 'Новое название' },
        },
      },
    }),
    ApiOkResponse({
      description: 'Навык успешно обновлён',
      type: Skill,
      schema: {
        example: {
          id: 42,
          title: 'React + Redux',
          description: 'Продвинутый React с Redux Toolkit',
          images: ['new-image.jpg'],
          createdAt: '2025-05-06T10:00:00.000Z',
          updatedAt: '2025-05-06T11:00:00.000Z',
          category: {
            id: 6,
            name: 'State Management',
          },
          owner: {
            id: 1,
            name: 'Иван Иванов',
          },
        },
      },
    }),
    BadRequestResponse,
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse,
  );
}

export function ApiRemoveSkill() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удаление навыка',
      description:
        'Удалить можно только свой навык. При удалении также стираются связанные файлы изображений.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID удаляемого навыка',
      example: 42,
    }),
    ApiOkResponse({
      description: 'Навык успешно удалён',
      schema: {
        example: {
          message: 'Skill deleted successfully',
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

export function ApiAddToFavorites() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Добавить навык в избранное текущего пользователя',
      description:
        'Авторизованный пользователь может добавить навык в свой список избранных.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID навыка, который добавляется в избранное',
      example: 42,
    }),
    ApiCreatedResponse({
      description: 'Навык добавлен в избранное',
      schema: {
        example: {
          message: 'Навык добавлен в избранное',
        },
      },
    }),
    ConflictResponse,
    UnauthorizedResponse,
    NotFoundResponse,
  );
}

export function ApiRemoveFromFavorites() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удалить навык из избранного',
      description:
        'Удаляет навык из избранного текущего пользователя. Если навыка нет в избранном – ошибка 404.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID навыка, который удаляется из избранного',
      example: 42,
    }),
    ApiOkResponse({
      description: 'Навык удалён из избранного',
      schema: {
        example: {
          message: 'Навык удалён из избранного',
        },
      },
    }),
    UnauthorizedResponse,
    NotFoundResponse,
  );
}

export function ApiFindSimilar() {
  return applyDecorators(
    ApiOperation({
      summary: 'Похожие предложения',
      description:
        'Возвращает список пользователей, у которых есть навыки в той же категории, что и указанный навык.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID навыка',
      example: 42,
    }),
    ApiOkResponse({
      description: 'Список пользователей успешно получен',
      schema: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  example: 5,
                },
                name: {
                  type: 'string',
                  example: 'Анна Смирнова',
                },
                avatar: {
                  type: 'string',
                  example: 'https://example.com/avatar.jpg',
                  nullable: true,
                },
              },
            },
          },
        },
        example: {
          users: [
            {
              id: 5,
              name: 'Анна Смирнова',
              avatar: null,
            },
            {
              id: 12,
              name: 'Иван Петров',
              avatar: '/uploads/avatar.png',
            },
          ],
        },
      },
    }),
    NotFoundResponse,
    BadRequestResponse,
  );
}
