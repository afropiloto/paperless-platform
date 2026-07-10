import './polyfills';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { MongoExceptionFilter } from './filters/mongooseException.filter';
import * as bodyParser from 'body-parser';
import { LoggingInterceptor } from './interceptors/request-logger.interceptor';
import { join } from 'path';
import * as express from 'express';
import { ConfigurationValidationService } from './config/configuration-validation.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validate configuration
  const configValidationService = app.get(ConfigurationValidationService);
  configValidationService.validateConfiguration();
  configValidationService.logConfigurationSummary();
  
  // Add static file serving for .well-known directory
  app.use('/.well-known', express.static(join(__dirname, '..', 'public')));
  app.use('/attention-index', express.static(join(__dirname, '..', 'public', 'attention-index')));
  
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
    .setTitle('Voy Finance Paperless API')
    .setDescription('API to manage trade documents via Paperless')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const portNumber = process.env.PORT ?? 3001;
  console.log(`🚀 API Server starting on port ${portNumber}`);
  await app.listen(portNumber);
  console.log(`✅ API Server is running on http://localhost:${portNumber}`);
  console.log(`📚 API Documentation available at http://localhost:${portNumber}/api-docs`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start API server:', error);
  process.exit(1);
});
