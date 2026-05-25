import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SendmailDto } from './dto/sendmail.dto';

export function ApiSendmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отправка email',
      description:
        'Отправляет email через SMTP с поддержкой текста или HTML, с автоматическими повторными попытками при ошибках.',
    }),
    ApiBody({
      type: SendmailDto,
      description: 'Данные для отправки письма',
      examples: {
        textExample: {
          summary: 'Текстовое письмо',
          value: {
            to: 'user@example.com',
            subject: 'Текстовое письмо',
            text: 'Привет, это текстовое сообщение.',
          },
        },
        htmlExample: {
          summary: 'HTML-письмо',
          value: {
            to: 'user@example.com',
            subject: 'HTML-письмо',
            html: '<h1>Заголовок</h1><p>HTML-содержимое</p>',
          },
        },
      },
    }),
    ApiNoContentResponse({
      description:
        'Письмо успешно отправлено (или после всех повторных попыток)',
    }),
    ApiBadRequestResponse({
      description: 'Ошибка валидации входных данных',
      schema: {
        example: {
          statusCode: 400,
          message: 'Validation failed',
          errors: [
            { field: 'to', errors: ['to must be an email'] },
            { field: 'subject', errors: ['subject should not be empty'] },
          ],
          timestamp: '2025-01-01T12:00:00.000Z',
          path: '/sendmail/send',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'Отсутствует или недействительный токен (если эндпоинт защищён)',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
          timestamp: '2025-01-01T12:00:00.000Z',
          path: '/sendmail/send',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Ошибка SMTP или внутренняя ошибка сервера',
      schema: {
        example: {
          statusCode: 500,
          message: 'Mail send failed (attempt 3/3)',
          timestamp: '2025-01-01T12:00:00.000Z',
          path: '/sendmail/send',
        },
      },
    }),
  );
}
