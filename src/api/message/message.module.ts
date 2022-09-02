import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    PrismaModule,
    WebhookModule,
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
