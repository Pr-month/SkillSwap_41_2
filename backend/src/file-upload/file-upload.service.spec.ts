import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  describe,
  beforeEach,
  it,
  expect,
  jest,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { FileUploadService, MulterFile } from './file-upload.service';
import * as fs from 'fs/promises';
import { uploadConfig } from 'src/config/upload.config';

// Мокируем fs/promises целиком
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof import('fs/promises')>;

describe('FileUploadService', () => {
  let service: FileUploadService;

  // Детерминированные значения
  const mockTimestamp = 1234567890;
  const mockRandom = 0.123456789;
  const mockRandomString = mockRandom.toString(36).substring(2, 15);

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    jest.spyOn(Math, 'random').mockReturnValue(mockRandom);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        {
          provide: uploadConfig.KEY,
          useValue: {
            folder: 'public/uploads',
            maxSize: 2 * 1024 * 1024,
          },
        },
      ],
    }).compile();
    service = module.get<FileUploadService>(FileUploadService);
  });

  // Создаёт валидный файл (JPEG, 1 МБ, корректная сигнатура)
  const createValidFile = (): MulterFile => ({
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024,
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00]), // JPEG
    path: undefined,
  });

  describe('handleFileUpload', () => {
    it('файл должен быть успешно загружен', async () => {
      const mockFile = createValidFile();
      mockedFs.access.mockRejectedValue(new Error('not found'));
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);

      const result = await service.handleFileUpload(mockFile);

      expect(result).toEqual({
        message: 'Файл успешно загружен',
        filePath: `/uploads/${mockTimestamp}-${mockRandomString}.jpg`,
        originalName: 'test.jpg',
      });
      expect(mockedFs.mkdir).toHaveBeenCalledWith('public/uploads', {
        recursive: true,
      });
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('Если файл не предоставлен, должно быть исключение BadRequestException', async () => {
      await expect(
        service.handleFileUpload(null as unknown as MulterFile),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.handleFileUpload(null as unknown as MulterFile),
      ).rejects.toThrow('Нет файла для загрузки');
    });

    it('Должно быть исключение BadRequestException, если тип MIME файла не разрешен', async () => {
      const mockFile = createValidFile();
      mockFile.mimetype = 'application/pdf';
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        'Недопустимый формат файла. Разрешено: jpeg, png, gif',
      );
    });

    it('Должно быть исключение BadRequestException, если размер файла превышает 2 MB', async () => {
      const mockFile = createValidFile();
      mockFile.size = 3 * 1024 * 1024;
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        'Размер файла больше допустимого 2 МБ',
      );
    });

    it('Должно быть исключение BadRequestException, если содержимое файла не соответствует заявленному типу MIME', async () => {
      const mockFile = createValidFile();
      mockFile.mimetype = 'image/png';
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        'Тип файла не соответствует содержимому. Ожидается: png, обнаружено: jpeg',
      );
    });

    it('Должен обрабатывать файл без буфера (используя путь) и переименовывать его', async () => {
      // Создаём объект файла без buffer, но с path – приведение типа через as
      const fileWithPath = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 1024,
        buffer: undefined,
        path: '/tmp/uploaded-file',
      };
      mockedFs.readFile.mockResolvedValue(
        Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00]),
      );
      mockedFs.access.mockRejectedValue(new Error('not found'));
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.rename.mockResolvedValue(undefined);

      const result = await service.handleFileUpload(fileWithPath);

      expect(result.filePath).toBeDefined();
      expect(mockedFs.rename).toHaveBeenCalledWith(
        '/tmp/uploaded-file',
        expect.stringContaining('public/uploads/'),
      );
      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });
  });
});
