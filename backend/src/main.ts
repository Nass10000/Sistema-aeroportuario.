import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Health check endpoint
  app.use('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema Aeroportuario API')
    .setDescription('API para gestión de operaciones aeroportuarias')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS para frontend privado (permitir todos los puertos de desarrollo)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Inicializar datos de prueba
  try {
    const userService = app.get(UserService);
    await userService.initializeTestUsers();
    
    console.log('✅ Test data initialization completed');
  } catch (error) {
    console.warn('⚠️ Test data initialization failed:', error.message);
  }

  await app.listen(process.env.PORT || 3001);
  console.log(`Backend started on port ${process.env.PORT || 3001}`);
  console.log('Swagger documentation available at: http://localhost:3001/api');
}

bootstrap();