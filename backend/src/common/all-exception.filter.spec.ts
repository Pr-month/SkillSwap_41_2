import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exception.filter';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { Request, Response } from 'express';

type JsonResponseBody = {
  statusCode: number;
  message: string | string[];
  errors?: unknown;
  timestamp: string;
  path: string;
};

function mockArgumentsHost(
  request: Partial<Request>,
  response: Partial<Response>,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request as Request,
      getResponse: () => response as Response,
    }),
  } as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: Response;

  let statusMock: jest.MockedFunction<(statusCode: number) => Response>;
  let jsonMock: jest.MockedFunction<(body: JsonResponseBody) => Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllExceptionsFilter],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);

    statusMock = jest.fn().mockReturnThis();

    jsonMock = jest.fn().mockReturnThis();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  it('должен обработать HttpException и вернуть корректный ответ', () => {
    const exception = new HttpException(
      'Тестовое сообщение',
      HttpStatus.BAD_REQUEST,
    );
    const host = mockArgumentsHost({ url: '/test' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Тестовое сообщение',
        path: '/test',
      }),
    );
  });

  it('должен вернуть 404 для EntityNotFoundError', () => {
    const exception = new EntityNotFoundError('User', { id: 1 });
    const host = mockArgumentsHost({ url: '/users/1' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Сущность не найдена',
        path: '/users/1',
      }),
    );
  });

  it('должен вернуть 413 для PayloadTooLargeException', () => {
    const exception = new PayloadTooLargeException();
    const host = mockArgumentsHost({ url: '/files/upload' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'Слишком большой файл',
        path: '/files/upload',
      }),
    );
  });

  it('должен вернуть 409 при нарушении уникальности email', () => {
    const driverError = {
      code: '23505',
      detail: '(email) уже существует',
    } as Error & {
      code?: string;
      detail?: string;
    };

    const exception = new QueryFailedError('SELECT ...', [], driverError);
    const host = mockArgumentsHost({ url: '/auth/register' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Пользователь с таким email уже существует',
        path: '/auth/register',
      }),
    );
  });

  it('должен вернуть 409 при другом нарушении уникальности', () => {
    const driverError = {
      code: '23505',
      detail: 'другое поле',
    } as Error & {
      code?: string;
      detail?: string;
    };

    const exception = new QueryFailedError('INSERT ...', [], driverError);
    const host = mockArgumentsHost({ url: '/categories' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Запись с такими данными уже существует',
        path: '/categories',
      }),
    );
  });

  it('должен вернуть 500 для неизвестной ошибки', () => {
    const exception = new Error('Что-то пошло не так');
    const host = mockArgumentsHost({ url: '/something' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Внутренняя ошибка сервера',
        path: '/something',
      }),
    );
  });

  it('должен извлечь errors, если они есть в ответе HttpException', () => {
    const exception = new HttpException(
      {
        message: 'Validation failed',
        errors: [{ field: 'email', messages: ['email должен быть валидным'] }],
      },
      HttpStatus.BAD_REQUEST,
    );

    const host = mockArgumentsHost({ url: '/auth/register' }, mockResponse);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        path: '/auth/register',
      }),
    );

    const [responseBody] = jsonMock.mock.calls[0] ?? [];
    expect(Array.isArray(responseBody?.errors)).toBe(true);
  });
});
