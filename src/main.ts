import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './filters/mongooseException.filter';
import * as bodyParser from 'body-parser';
import { LoggingInterceptor } from './interceptors/request-logger.interceptor';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add static file serving for .well-known directory
  app.use('/.well-known', express.static(join(__dirname, '..', 'public')));
  
  app.enableCors();
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      strategy: 'excludeAll',
      excludeExtraneousValues: true
    })
  )
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalFilters(new MongoExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Voy Finance Paiperless API')
    .setDescription('API to manage trade documents via Paiperless')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const portNumber = process.env.PORT ?? 3001;
  console.log(`Starting server on port ${portNumber}`);
  await app.listen(portNumber);
}
bootstrap();
