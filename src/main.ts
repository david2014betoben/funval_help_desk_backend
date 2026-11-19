import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Global, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new PrismaExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('API RestFull "HELP DESK Interno - FUNVAL"')
    .setDescription('Backend para una Mesa de Ayuda')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu JWT token aqui',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth') // Para configurar el token globalmente
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const configService = app.get(ConfigService);

  // === CONFIGURACIÓN DE CORS ===
  app.enableCors({
  origin: [
    configService.get<string>('FRONTEND_URL'),
    'http://localhost:5173',
  ].filter((origin): origin is string => Boolean(origin)),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization',
});

  await app.listen(configService.getOrThrow<number>('PORT') ?? 3000);
}
await bootstrap();
