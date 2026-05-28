import { applyDecorators } from '@nestjs/common';
import { RegisterDTO } from './dto/register.dto';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { LoginDTO } from './dto/login.dto';
import { AuthResponseDto } from './dto/authResponse.dto';
import { RefreshResponseDto } from './dto/refreshResponse.dto';

// =========================
// Error Responses
// =========================

const BadRequestResponse = ApiResponse({
  status: 400,
  description: 'Невалидные данные',
  schema: {
    example: {
      statusCode: 400,
      message: 'Невалидные данные',
    },
  },
});

const UnauthorizedResponse = ApiResponse({
  status: 401,
  description: 'Недействительный или отсутствующий токен',
  schema: {
    example: {
      statusCode: 401,
      message: 'Недействительный или отсутствующий токен',
    },
  },
});

// const ForbiddenResponse_403 = ApiResponse({
//   status: 403,
//   description: 'Недостаточно прав для доступа к ресурсу',
//   schema: {
//     example: {
//       statusCode: 403,
//       message: 'Недостаточно прав для доступа к ресурсу',
//     },
//   },
// });

// const NotFoundResponse = ApiResponse({
//   status: 404,
//   description: 'Ресурс не найден',
//   schema: {
//     example: {
//       statusCode: 404,
//       message: 'Ресурс не найден',
//     },
//   },
// });

const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Пользователь с таким email уже существует',
  schema: {
    example: {
      statusCode: 409,
      message: 'Пользователь с таким email уже существует',
    },
  },
});

// =========================
// Swagger Decorators
// =========================

export function ApiAuthRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Регистрация нового пользователя' }),
    ApiBody({
      type: RegisterDTO,
    }),
    ApiResponse({
      status: 201,
      description: 'Успешная регистрация',
      headers: {
        'Set-Cookie': {
          description: 'Устанавливает HTTP-only cookie с refresh токеном',
          schema: {
            type: 'string',
            example: 'refresh-token=abc123; Path=/; HttpOnly; Secure',
          },
        },
      },
      type: AuthResponseDto,
    }),
    BadRequestResponse,
    ConflictResponse,
  );
}

export function ApiAuthRefresh() {
  return applyDecorators(
    ApiOperation({ summary: 'Обновление токенов доступа и обновления' }),
    ApiCookieAuth('refresh-token'), // Для HTTP-only cookie
    ApiResponse({
      status: 200,
      description: 'Токены успешно обновлены',
      type: RefreshResponseDto,
      headers: {
        'Set-Cookie': {
          description: 'Устанавливает новый HTTP-only cookie с refresh токеном',
          schema: {
            type: 'string',
            example: 'refresh-token=abc123; Path=/; HttpOnly; Secure',
          },
        },
      },
    }),
    UnauthorizedResponse,
  );
}

export function ApiAuthLogin() {
  return applyDecorators(
    ApiOperation({ summary: 'Аутентификация пользователя' }),
    ApiBody({
      type: LoginDTO,
    }),
    ApiResponse({
      status: 201,
      description: 'Успешная аутентификация',
      type: AuthResponseDto,
    }),
    BadRequestResponse,
    UnauthorizedResponse,
  );
}

export function ApiAuthLogout() {
  return applyDecorators(
    ApiOperation({ summary: 'Выход пользователя (инвалидация токенов)' }),
    ApiBearerAuth('accessToken'),
    ApiResponse({
      status: 200,
      description: 'Успешный выход',
    }),
    UnauthorizedResponse,
  );
}
