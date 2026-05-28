import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from './entities/request.entity';

const ApiRequestIdParam = () =>
  ApiParam({
    name: 'id',
    description: 'UUID заявки',
    format: 'uuid',
    example: '11111111-2222-3333-4444-555555555555',
  });

export function ApiRequestsCreate() {
  return applyDecorators(
    ApiBearerAuth('accessToken'),
    ApiOperation({
      summary: 'Создание заявки на обмен навыками',
      description:
        'Создаёт запрос другому пользователю на обмен навыками: ты предлагаешь свой навык, а просишь навык другого пользователя.',
    }),
    ApiResponse({ status: 201, description: 'Заявка создана', type: Request }),
    ApiResponse({
      status: 400,
      description: 'Ошибка валидации или такая заявка уже существует',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description:
        'Предлагаемый навык не принадлежит отправителю или запрашиваемый не принадлежит получателю',
    }),
    ApiResponse({
      status: 404,
      description: 'Получатель или один из навыков не найден',
    }),
  );
}

export function ApiRequestsGetIncoming() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Получение входящих заявок',
      description: 'Возвращает заявки отправленные текущему пользователю',
    }),
    ApiResponse({ status: 200, description: 'Список входящих заявок получен' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiRequestsGetOutgoing() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Получение исходящих заявок',
      description: 'Возвращает заявки отправленные текущим пользователем',
    }),
    ApiResponse({
      status: 200,
      description: 'Список исходящих заявок получен',
    }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
  );
}

export function ApiRequestsAccept() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Принятие заявки',
      description:
        'Меняет статус заявки на accepted. Принять заявку может только её получатель',
    }),
    ApiRequestIdParam(),
    ApiResponse({ status: 200, description: 'Заявка принята' }),
    ApiResponse({ status: 400, description: 'Заявка уже обработана' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Только получатель может принять заявку',
    }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
  );
}

export function ApiRequestsReject() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Отклонение заявки',
      description:
        'Меняет статус заявки на rejected. Отклонить заявку может только её получатель',
    }),
    ApiRequestIdParam(),
    ApiResponse({ status: 200, description: 'Заявка отклонена' }),
    ApiResponse({ status: 400, description: 'Заявка уже обработана' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Только получатель может отклонить заявку',
    }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
  );
}

export function ApiRequestsDelete() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Удаление заявки',
      description:
        'Удаляет заявку. Обычный пользователь может удалить только свою исходящую заявку. Администратор может удалить любую',
    }),
    ApiRequestIdParam(),
    ApiResponse({ status: 200, description: 'Заявка удалена' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description: 'Можно удалить только свою исходящую заявку (если не админ)',
    }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
  );
}

export function ApiRequestsUpdateStatus() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Обновление статуса заявки',
      description:
        'Изменяет статус заявки на accepted или rejected. Доступно получателю заявки или администратору',
    }),
    ApiRequestIdParam(),
    ApiResponse({ status: 200, description: 'Статус заявки обновлён' }),
    ApiResponse({ status: 400, description: 'Ошибка валидации' }),
    ApiResponse({ status: 401, description: 'Пользователь не авторизован' }),
    ApiResponse({
      status: 403,
      description:
        'Можно установить только статус accepted или rejected. Менять статус может только получатель или админ',
    }),
    ApiResponse({ status: 404, description: 'Заявка не найдена' }),
  );
}
