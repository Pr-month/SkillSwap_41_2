import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService, MulterFile } from './file-upload.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiUploadFile } from './file-upload.swagger';

@ApiTags('files')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @ApiUploadFile()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: MulterFile | undefined) {
    if (!file) {
      throw new BadRequestException('Файл не загружен');
    }
    return this.fileUploadService.handleFileUpload(file);
  }
}
