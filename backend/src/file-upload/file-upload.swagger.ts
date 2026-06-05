import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiUploadFile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Загрузка файла на сервер',
      description: 'Загружает файл и возвращает ссылку',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Файл для загрузки',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Файл успешно загружен',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Файл успешно загружен' },
          filePath: { type: 'string', example: '/uploads/example.jpg' },
          originalName: { type: 'string', example: 'example.jpg' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Проблема с загрузкой файла, неверный формат или содержимое не соответствует расширению',
    }),
    ApiResponse({
      status: 413,
      description: 'Размер файла превышает допустимый размер',
    }),
  );
}
