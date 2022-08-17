import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { MessageData } from './dto/telegram-webhook.interface';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly clientService: ClientService,
  ) {}

  @Post(':id')
  async webhook(
    @Body() messageBody: MessageData,
    @Param('id') id: string,
  ): Promise<void> {
    const client = await this.clientService.listByIdClient(id);
    if (!client) throw new NotFoundException('Client not found');
    const messageData = {
      from: Number(messageBody.message.from.id),
      to: Number(client.chat_id),
      type: 'text',
      text: messageBody.message.text,
      createdAt: new Date(),
      clientId: client.id,
    };
    await this.webhookService.createMessage(messageData);
    await this.webhookService.sendNotification(client.webHookUrl, messageData);
  }
}
