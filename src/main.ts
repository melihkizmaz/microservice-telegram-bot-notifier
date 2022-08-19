import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: port,
    },
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
