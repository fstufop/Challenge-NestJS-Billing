import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppDataSource } from 'data-source';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  await AppDataSource.initialize();
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Billing API')
    .setDescription('API para processamento de pagamentos')
    .setVersion('1.0')
    .addTag('billing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
