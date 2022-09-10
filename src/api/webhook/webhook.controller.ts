import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Message } from '@prisma/client';
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
  ): Promise<void | string> {
    if (
      !(
        !!messageBody?.message?.text ||
        !!messageBody?.message?.photo ||
        !!messageBody?.message?.location
      )
    ) {
      return console.log('invalid message type', messageBody);
    }

    const client = await this.clientService.listClientByIdForWebhook(id);
    if (!client) throw new NotFoundException('Client not found');

    const messageData: Omit<Message, 'id'> = {
      from: Number(messageBody.message.from.id),
      to: Number(client.chat_id),
      createdAt: new Date(),
      clientId: client.id,
      mediaGroupId: null,
      caption: null,
      longitude: null,
      latitude: null,
      text: null,
      photo: null,
      type: '',
    };

    if (messageBody.message.text) {
      messageData.type = 'text';
      messageData.text = messageBody.message.text;
    }

    if (messageBody.message.photo) {
      messageData.type = 'image';
      messageData.photo = messageBody.message.photo.at(-1).file_id;
      messageData.caption = messageBody.message?.caption;
      messageData.mediaGroupId = messageBody.message?.media_group_id;
    }

    if (messageBody.message.location) {
      messageData.type = 'location';
      messageData.latitude = messageBody.message.location.latitude;
      messageData.latitude = messageBody.message.location.longitude;
    }

    Object.keys(messageData).forEach((key) => {
      if (!messageData[key]) {
        delete messageData[key];
      }
    });
    if (!messageData.type) return;
    await this.webhookService.createMessage(messageData);
    this.webhookService.sendNotification({
      url: client.webHookUrl,
      sendWebhookDto: messageData,
    });
  }
}
