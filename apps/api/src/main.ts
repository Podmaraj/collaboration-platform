import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // ── Global API prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ── Cookies (for HttpOnly refresh token) ──────────────────────────────────
  await app.register(fastifyCookie, {
    secret: configService.get<string>('JWT_REFRESH_SECRET'),
  });

  // ── Helmet (security headers) ─────────────────────────────────────────────
  await app.register(
    // @ts-expect-error fastify plugin typing
    (await import('@fastify/helmet')).default,
    {
      contentSecurityPolicy: false, // Disable for API; configure per-environment if serving HTML
    },
  );

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,           // Auto-transform types (string → number etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global response transform interceptor ────────────────────────────────
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running at http://localhost:${port}/${apiPrefix}`);
  logger.log(`📋 Health check at http://localhost:${port}/${apiPrefix}/health`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', err);
  process.exit(1);
});
