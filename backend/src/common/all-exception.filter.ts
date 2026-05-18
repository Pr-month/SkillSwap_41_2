import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test'
    ) {
      if (exception instanceof Error) {
        this.logger.error(exception.message, exception.stack);
      } else {
        this.logger.error('Unknown exception', String(exception));
      }
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Внутренняя ошибка сервера';

    let errors: unknown;

    // 1) EntityNotFoundError -> 404
    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Сущность не найдена';
    }

    // 2) PayloadTooLargeException -> 413
    else if (exception instanceof PayloadTooLargeException) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Слишком большой файл';
    }

    // 3) Postgres unique violation (23505) -> 409
    else if (exception instanceof QueryFailedError) {
      const error = exception as QueryFailedError & {
        code?: string;
        detail?: string;
        driverError?: {
          code?: string;
          detail?: string;
        };
      };

      const code = error.code ?? error.driverError?.code;
      const detail = error.detail ?? error.driverError?.detail ?? '';

      if (code === '23505') {
        status = HttpStatus.CONFLICT;

        // Если дубликат именно по email — отдаем понятное сообщение
        if (detail.includes('(email)')) {
          message = 'Пользователь с таким email уже существует';
        } else {
          message = 'Запись с такими данными уже существует';
        }
      }
    }

    // Остальные HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
          errors?: unknown;
        };

        message = responseBody.message ?? exception.message;
        errors = responseBody.errors;
      } else {
        message = exception.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors !== undefined ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    });
  }
}
