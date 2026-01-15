/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for external access
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:4201',
        'http://localhost:8080',
        'http://localhost:8082',
        'http://127.0.0.1:8082',
        'http://217.154.18.8:8082',
        'http://217.154.18.8:3000',
      ];

  app.enableCors({
    origin: true, // Allow all origins for now to debug
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('CV Converter API')
    .setDescription('API for converting and managing CV documents')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('auth', 'Authentication operations')
    .addTag('users', 'User management operations')
    .addTag('cvs', 'CV document operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for external access
  await app.listen(port, host);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `🌐 External access available on: http://<your-server-ip>:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger documentation is available at: http://localhost:${port}/${globalPrefix}/docs`
  );
  Logger.log(
    `🔗 CORS enabled for: http://localhost:4200, http://localhost:8082 and other origins`
  );
}

bootstrap();
