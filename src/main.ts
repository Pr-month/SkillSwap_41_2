import { NestFactory, Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, ClassSerializerInterceptor } from '@nestjs/common';
import { AllExceptionsFilter } from './common/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use(new AllExceptionsFilter());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля которых нет в DTO
      forbidNonWhitelisted: true, // возвращает ошибку если пришли лишние поля
      transform: true, // преобразует payload в DTO класс
      transformOptions: {
        enableImplicitConversion: true, // авто-конвертация типов (string → number)
      },
      forbidUnknownValues: true, // защита от "левого" payload (например, null вместо объекта)

      exceptionFactory: (errors) => {
        // параметр коллбек, делаем понятный ответ при ошибке валидации
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
