import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ClientModule } from './api/client/client.module';
import { MessageModule } from './api/message/message.module';
import { ConfigModule } from '@nestjs/config';
import { WebhookModule } from './api/webhook/webhook.module';
import configuration from './config/configuration';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exeption.filter';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    PrismaModule,
    ClientModule,
    MessageModule,
    WebhookModule,
    AuthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
