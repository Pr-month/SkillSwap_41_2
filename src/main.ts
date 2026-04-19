import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe, BadRequestException  } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля которых нет в DTO
      forbidNonWhitelisted: true, // возвращает ошибку если пришли лишние поля
      transform: true, // преобразует payload в DTO класс
      transformOptions: {
        enableImplicitConversion: true, // авто-конвертация типов (string → number)
      },
      forbidUnknownValues: true, // защита от "левого" payload (например, null вместо объекта)

      exceptionFactory: (errors) => { // параметр коллбек, делаем понятный ответ при ошибке валидации
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          })),
        });
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
