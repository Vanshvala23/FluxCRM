import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);

    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req: any, res: any, next: any) => {
      const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'https://crmflux.netlify.app'];
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });

    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'https://crmflux.netlify.app'],
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

    await app.init(); // ✅ init() not listen() for serverless
  }

  return app;
}

// ✅ For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(app => {
    app.listen(process.env.PORT || 4000);
    console.log(`App running on: http://localhost:${process.env.PORT || 4000}`);
    console.log(`Swagger running on: http://localhost:${process.env.PORT || 4000}/api/docs`);
  });
}

// ✅ Vercel serverless handler
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
};