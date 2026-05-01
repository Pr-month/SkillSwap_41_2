import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Папка для загрузки (с значением по умолчанию)
          const uploadDir = process.env.UPLOAD_DIR || 'public/uploads';
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          // Безопасное формирование имени: убираем пробелы, заменяем на нижние подчёркивания,
          // убираем потенциально опасные символы
          const originalName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const filename = `${uniqueSuffix}-${originalName}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService],
})
export class FileUploadModule {}