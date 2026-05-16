import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as fs from 'fs/promises';
import { TploadConfig, uploadConfig } from 'src/config/upload.config';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
  destination?: string;
  filename?: string;
}

@Injectable()
export class FileUploadService {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly fileSignatures = {
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    gif: [0x47, 0x49, 0x46, 0x38],
  };

  constructor(
    @Inject(uploadConfig.KEY) private readonly uploadCfg: TploadConfig,
  ) {}

  async handleFileUpload(file: MulterFile) {
    if (!file) {
      throw new BadRequestException('Нет файла для загрузки');
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Недопустимый формат файла. Разрешено: jpeg, png, gif',
      );
    }
    const maxSize = this.uploadCfg.maxSize as number;
    if (file.size > maxSize) {
      throw new BadRequestException('Размер файла больше допустимого 2 МБ');
    }

    await this.validateFileContent(file);
    const savedFilePath = await this.saveFile(file);

    return {
      message: 'Файл успешно загружен',
      filePath: savedFilePath,
      originalName: file.originalname,
    };
  }

  private async saveFile(file: MulterFile): Promise<string> {
    await this.ensureUploadDirectory();

    // Безопасное получение расширения файла
    const originalName = file.originalname;
    const lastDotIndex = originalName.lastIndexOf('.');
    const fileExtension =
      lastDotIndex !== -1 ? originalName.slice(lastDotIndex + 1) : '';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension ? `.${fileExtension}` : ''}`;
    const targetPath = `${this.uploadCfg.folder}/${uniqueFileName}`;

    if (file.buffer) {
      await fs.writeFile(targetPath, file.buffer);
    } else if (file.path) {
      const oldPath = file.path;
      await fs.rename(oldPath, targetPath);
    } else {
      throw new BadRequestException('Нет данных файла для сохранения');
    }
    return `/uploads/${uniqueFileName}`;
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadCfg.folder);
    } catch {
      await fs.mkdir(this.uploadCfg.folder, { recursive: true });
    }
  }

  private async validateFileContent(file: MulterFile): Promise<void> {
    try {
      let fileBuffer: Buffer;
      if (file.buffer) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        const filePath = file.path;
        const fullBuffer = await fs.readFile(filePath);
        fileBuffer = fullBuffer.slice(0, 8);
      } else {
        throw new BadRequestException('Невозможно прочитать содержимое файла');
      }

      const detectedType = this.detectFileType(fileBuffer);
      if (!detectedType) {
        throw new BadRequestException(
          'Не удалось определить тип файла по содержимому',
        );
      }

      const expectedType = this.getExpectedType(file.mimetype);
      if (detectedType !== expectedType) {
        throw new BadRequestException(
          `Тип файла не соответствует содержимому. Ожидается: ${expectedType}, обнаружено: ${detectedType}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Ошибка при проверке содержимого файла');
    }
  }

  private detectFileType(buffer: Buffer): string | null {
    if (this.checkSignature(buffer, this.fileSignatures.jpeg)) return 'jpeg';
    if (this.checkSignature(buffer, this.fileSignatures.png)) return 'png';
    if (this.checkSignature(buffer, this.fileSignatures.gif)) return 'gif';
    return null;
  }

  private checkSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    return true;
  }

  private getExpectedType(mimetype: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'jpeg',
      'image/png': 'png',
      'image/gif': 'gif',
    };
    return typeMap[mimetype] || mimetype;
  }
}
