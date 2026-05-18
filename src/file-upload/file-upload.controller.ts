import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, MulterFile } from './file-upload.service';

import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('files')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @ApiOperation({
    summary: 'Загрузка файла на сервер',
    description: 'Загружает файл и возвращает ссылку',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description:
      'Проблема с загрузкой файла, неверный формат или содержимое не соответсвует расширению',
  })
  @ApiResponse({
    status: 413,
    description: 'Размер файла превышает допустимый размер',
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: MulterFile | undefined) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }
    return this.fileUploadService.handleFileUpload(file);
  }
}
