import { Module } from '@nestjs/common';
import { FetchModule } from '../../fetch/fetch.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ClientModule } from '../client/client.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [FetchModule, PrismaModule, ClientModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
