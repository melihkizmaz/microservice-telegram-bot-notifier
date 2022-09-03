import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ClientService } from '../client/client.service';
import { IMessageData } from './dto/telegram-webhook.interface';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly clientService: ClientService,
  ) {}

  @Post(':id')
  async webhook(
    @Body() messageBody: IMessageData,
    @Param('id') id: string,
  ): Promise<void> {
    const client = await this.clientService.listClientByIdForWebhook(id);
    if (!client) throw new NotFoundException('Client not found');
    let messageData;

    if (messageBody.message.text) {
      const textData = {
        from: Number(messageBody.message.from.id),
        to: Number(client.chat_id),
        type: 'text',
        text: messageBody.message.text,
        createdAt: new Date(),
        clientId: client.id,
      };

      messageData = { ...textData };
    }

    if (messageBody.message.photo) {
      const photoData = {
        from: Number(messageBody.message.from.id),
        to: Number(client.chat_id),
        type: 'image',
        photo:
          messageBody.message.photo[messageBody.message.photo.length - 1]
            .file_id,

        caption: messageBody.message.caption,
        createdAt: new Date(),
        clientId: client.id,
        mediaGroupId: messageBody.message.media_group_id,
      };
      messageData = { ...photoData };
    }

    if (messageBody.message.location) {
      const locationData = {
        from: Number(messageBody.message.from.id),
        to: Number(client.chat_id),
        type: 'location',
        latitude: messageBody.message.location.latitude,
        longitude: messageBody.message.location.longitude,
        createdAt: new Date(),
        clientId: client.id,
      };

      messageData = { ...locationData };
    }

    if (!messageBody.message.caption) delete messageData.caption;
    if (!messageBody.message.media_group_id) delete messageData.mediaGroupId;

    await this.webhookService.createMessage(messageData);

    await this.webhookService.sendNotification(client.webHookUrl, messageData);
  }
}
