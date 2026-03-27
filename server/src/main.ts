import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Explicitly type as NestExpressApplication so we can access the raw Express instance
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get the raw underlying Express app and set CORS headers manually at the
  // lowest possible level — before ANY NestJS middleware, guards, or interceptors.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: any, res: any, next: any) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000','http://localhost:5174','https://crmflux.netlify.app'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Answer preflight immediately — never reaches JWT guard
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Keep enableCors as well (belt-and-suspenders)
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000','http://localhost:5174','https://crmflux.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('FluxCRM API')
    .setDescription('FluxCRM - CRM System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
  ],
});

  await app.listen(process.env.PORT || 4000);
  console.log(`Application is running on: http://localhost:${process.env.PORT || 4000}`);
  console.log(`Swagger is running on: http://localhost:${process.env.PORT || 4000}/api/docs`);
}
bootstrap();