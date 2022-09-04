import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebhookModule } from '../webhook/webhook.module';
import { FetchModule } from '../../fetch/fetch.module';

@Module({
  imports: [PrismaModule, WebhookModule, FetchModule],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
