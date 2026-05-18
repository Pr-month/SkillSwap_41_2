import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const UnauthorizedResponse = ApiResponse({
  status: 401,
  description:
    'Пользователь не авторизован (JWT недействителен или отсутствует)',
  schema: {
    example: {
      statusCode: 401,
      message: 'Требуется авторизация',
      timestamp: '2026-05-08T12:00:00.000Z',
      path: '/users/me',
    },
  },
});

const ForbiddenResponse = ApiResponse({
  status: 403,
  description: 'Доступ запрещён (недостаточно прав, например, не ADMIN)',
  schema: {
    example: {
      statusCode: 403,
      message: 'Недостаточно прав',
      timestamp: '2026-05-08T12:00:00.000Z',
      path: '/users/1',
    },
  },
});

const NotFoundResponse = ApiResponse({
  status: 404,
  description: 'Пользователь не найден',
  schema: {
    example: {
      statusCode: 404,
      message: 'Пользователь не найден',
      timestamp: '2026-05-08T12:00:00.000Z',
      path: '/users/999',
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
      errors: [{ field: 'email', errors: ['email must be an email'] }],
      timestamp: '2026-05-08T12:00:00.000Z',
      path: '/users',
    },
  },
});

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Получение списка пользователей с пагинацией и поиском',
      description:
        'Публичный эндпоинт. Поддерживает поиск по имени/email и пагинацию (limit/offset).',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Поиск по имени или email',
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
      description: 'Номер страницы (начиная с 1)',
      example: 1,
    }),
    ApiExtraModels(User),
    ApiOkResponse({
      description: 'Список пользователей успешно получен',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(User) },
            example: [
              {
                id: 1,
                name: 'Иван Иванов',
                email: 'ivan@example.com',
                about: 'Люблю программировать',
                birthdate: '1990-01-01',
                city: 'Москва',
                gender: 'male',
                avatar: 'https://example.com/avatar.jpg',
                role: 'USER',
              },
            ],
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              offset: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Запрашиваемая страница не существует',
      schema: {
        example: {
          statusCode: 404,
          message: 'Страница не найдена',
          timestamp: '2026-05-08T12:00:00.000Z',
          path: '/users?offset=999',
        },
      },
    }),
    BadRequestResponse,
  );
}

export function ApiGetMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Получить профиль текущего пользователя' }),
    ApiOkResponse({
      description: 'Данные текущего пользователя',
      type: User,
      schema: {
        example: {
          id: 1,
          name: 'Иван Иванов',
          email: 'ivan@example.com',
          about: 'Люблю программировать',
          birthdate: '1990-01-01',
          city: 'Москва',
          gender: 'male',
          avatar: 'https://example.com/avatar.jpg',
          role: 'USER',
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({ summary: 'Получить пользователя по ID' }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID пользователя',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Пользователь найден',
      type: User,
      schema: {
        example: {
          id: 1,
          name: 'Иван Иванов',
          email: 'ivan@example.com',
          about: 'Люблю программировать',
          birthdate: '1990-01-01',
          city: 'Москва',
          gender: 'male',
          avatar: 'https://example.com/avatar.jpg',
          role: 'USER',
        },
      },
    }),
    NotFoundResponse,
  );
}

export function ApiUpdateMe() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Обновить профиль текущего пользователя' }),
    ApiBody({
      type: UpdateUserDto,
      description: 'Поля для обновления (все необязательны)',
    }),
    ApiOkResponse({
      description: 'Профиль успешно обновлён',
      type: User,
      schema: {
        example: {
          id: 1,
          name: 'Новое имя',
          email: 'ivan@example.com',
          about: 'Обновлённое описание',
          birthdate: '1990-01-01',
          city: 'Москва',
          gender: 'male',
          avatar: 'https://example.com/avatar.jpg',
          role: 'USER',
        },
      },
    }),
    UnauthorizedResponse,
    NotFoundResponse,
    BadRequestResponse,
  );
}

export function ApiUpdatePassword() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Изменить пароль текущего пользователя' }),
    ApiBody({ type: UpdatePasswordDto, description: 'Старый и новый пароль' }),
    ApiOkResponse({
      description: 'Пароль успешно изменён',
      schema: { example: { message: 'Пароль успешно обновлен.' } },
    }),
    UnauthorizedResponse,
    NotFoundResponse,
    BadRequestResponse,
  );
}

export function ApiRemoveUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удалить пользователя по ID (только для администратора)',
      description:
        'Требуется роль ADMIN. При успешном удалении возвращается пустой ответ 200.',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID удаляемого пользователя',
      example: 1,
    }),
    ApiOkResponse({ description: 'Пользователь успешно удалён' }),
    UnauthorizedResponse,
    ForbiddenResponse,
    NotFoundResponse,
  );
}
