import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';

@Injectable()
export class FileUploadService {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly fileSignatures = {
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    gif: [0x47, 0x49, 0x46, 0x38], // GIF87a или GIF89a
  };

  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Нет файла для загрузки');
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Недопустимый формат файла. Разрешено: jpeg, png, gif',
      );
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла больше допустимого 2 МБ');
    }
    await this.validateFileContent(file);
    return { message: 'Файл успешно загружен', filePath: file.path };
  }

  private async validateFileContent(file: Express.Multer.File): Promise<void> {
    try {
      let fileBuffer: Buffer;

      // Если файл уже в памяти (memoryStorage)
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else {
        // Если файл на диске (diskStorage) - читаем весь файл и берем первые байты
        const fullBuffer = await fs.readFile(file.path);
        fileBuffer = fullBuffer.slice(0, 8); // Берем только первые 8 байт
      }

      // Определяем тип файла по сигнатуре
      const detectedType = this.detectFileType(fileBuffer);

      if (!detectedType) {
        throw new BadRequestException(
          'Не удалось определить тип файла по содержимому',
        );
      }

      // Сравниваем заявленный MIME-тип с фактическим содержимым
      const expectedType = this.getExpectedType(file.mimetype);
      if (detectedType !== expectedType) {
        throw new BadRequestException(
          `Тип файла не соответствует содержимому. Ожидается: ${expectedType}, обнаружено: ${detectedType}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Ошибка при проверке содержимого файла');
    }
  }

  private detectFileType(buffer: Buffer): string | null {
    // Проверка JPEG
    if (this.checkSignature(buffer, this.fileSignatures.jpeg)) {
      return 'jpeg';
    }

    // Проверка PNG
    if (this.checkSignature(buffer, this.fileSignatures.png)) {
      return 'png';
    }

    // Проверка GIF
    if (this.checkSignature(buffer, this.fileSignatures.gif)) {
      return 'gif';
    }

    return null;
  }

  private checkSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  private getExpectedType(mimetype: string): string {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/gif': 'gif',
    };

    return typeMap[mimetype] || mimetype;
  }
}
