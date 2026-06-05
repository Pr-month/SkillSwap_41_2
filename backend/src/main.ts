import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { appConfig } from './config/app.config';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CitiesModule } from './cities/cities.module';
import { AllExceptionsFilter } from './common/all-exception.filter';
import { TAppConfig } from './config/app.config';
import { FileUploadModule } from './file-upload/file-upload.module';
import { RequestsModule } from './requests/requests.module';
import { SkillsModule } from './skills/skills.module';
import { UsersModule } from './users/users.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = app.get<TAppConfig>(appConfig.KEY);

  if (!config) {
    throw new Error(
      'App configuration not loaded. Check appConfig registration.',
    );
  }

  const uploadFolder = config.uploadFolder;

  app.useStaticAssets(join(process.cwd(), uploadFolder), {
    prefix: '/uploads',
  });

  app.use(cookieParser());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

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

  // Swagger
  const configSwagger = new DocumentBuilder()
    .setTitle('SkillSwap API')
    .setDescription('Описание API SkillSwap')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'accessToken',
    )
    .addCookieAuth('refreshToken')
    .build();
  const options: SwaggerDocumentOptions = {
    include: [
      AuthModule,
      CategoriesModule,
      CitiesModule,
      FileUploadModule,
      RequestsModule,
      SkillsModule,
      UsersModule,
    ],
    deepScanRoutes: true, // глубокое сканирование маршрутов
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const documentFactory = SwaggerModule.createDocument(
    app,
    configSwagger,
    options,
  );
  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
    ui: process.env.NODE_ENV !== 'production',
    raw: ['json'],
    customSiteTitle: 'SkillSwap API Docs',
    swaggerOptions: {
      persistAuthorization: true, // сохранять авторизацию при обновлении страницы
      docExpansion: 'none', // list, full, none
    },
    customCss: `
      .topbar { 
        display: none;
      }
      
      .swagger-ui .info {
        margin: 10px 0;
      }

      .swagger-ui .wrapper {
        max-width: 800px;
        margin: 0 auto;
      }

      .swagger-ui table.model tbody tr td:first-of-type {
        padding: 1em 1em 0 2em;
      }

      .swagger-ui .prop {
        display: block;
        margin-left: 1em;
      }
    `,
  });

  await app.listen(config?.port ?? 3000);
}
void bootstrap();
