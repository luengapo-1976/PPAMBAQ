import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { StructuredLogger } from './common/logger/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: configService.getOrThrow<string>('CORS_ORIGIN') });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap();
