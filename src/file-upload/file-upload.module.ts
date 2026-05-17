import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import { ConfigModule } from '@nestjs/config';
import { uploadConfig } from 'src/config/upload.config';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    ConfigModule.forFeature(uploadConfig),
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],

  controllers: [FileUploadController],
  providers: [FileUploadService],
})
export class FileUploadModule {}
