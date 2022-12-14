import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendTextDto } from './dto/send-text.dto';
import { SendImageDto } from './dto/send-image.dto';
import { SendMessageResult } from './dto/sendMessage-result.interface';
import * as bson from 'bson';
import { SendLocationDto } from './dto/send.location.dto';
import { SendLocationResult } from './dto/sendLocation-result.interface';
import { SendMultipleImageResult } from './dto/sendMultipleImage-result.interface';
import { FetchService } from '../../fetch/fetch.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly fetchService: FetchService,
  ) {}
  async sendText({
    userId,
    sendMessageDto,
  }: {
    userId: bson.ObjectID;
    sendMessageDto: SendTextDto;
  }): Promise<SendMessageResult> {
    const client = await this.checkPermisionAndGetClient({
      clientId: sendMessageDto.clientId,
      userId,
    });
    const result = await this.fetchService.fetch<SendMessageResult>({
      method: 'get',
      base: {
        func: 'sendMessage',
        token: client.token,
      },
      params: {
        chat_id: sendMessageDto.chat_id,
        text: sendMessageDto.text,
      },
    });

    const messageData = {
      from: client.chat_id,
      to: Number(sendMessageDto.chat_id),
      type: 'text',
      text: sendMessageDto.text,
      createdAt: new Date(),
      clientId: client.id,
    };

    await this.createMessage(messageData);

    await this.webhookService.sendNotification({
      url: client.webHookUrl,
      sendWebhookDto: messageData,
    });

    return result;
  }

  async sendImage({
    userId,
    sendImageDto,
  }: {
    userId: bson.ObjectID;
    sendImageDto: SendImageDto;
  }) {
    const client = await this.checkPermisionAndGetClient({
      clientId: sendImageDto.clientId,
      userId,
    });

    const result = await this.fetchService.fetch<SendMultipleImageResult>({
      method: 'post',
      base: {
        func: 'sendMediaGroup',
        token: client.token,
      },
      body: {
        chat_id: sendImageDto.chat_id,
        media: sendImageDto.media,
      },
    });
    await Promise.all(
      result.result.map(async (item) => {
        const messageData = {
          from: Number(client.chat_id),
          to: Number(sendImageDto.chat_id),
          type: 'image',
          photo: item.photo.at(-1).file_id,
          mediaGroupId: item.media_group_id,
          createdAt: new Date(),
          clientId: client.id,
        };
        if (sendImageDto.media[0].caption)
          messageData['caption'] = sendImageDto.media[0].caption;
        if (sendImageDto.media.length <= 1) delete messageData.mediaGroupId;
        await this.createMessage(messageData);
        await this.webhookService.sendNotification({
          url: client.webHookUrl,
          sendWebhookDto: messageData,
        });
      }),
    );

    return result;
  }

  async sendLocation({
    userId,
    sendLocationDto,
  }: {
    userId: bson.ObjectID;
    sendLocationDto: SendLocationDto;
  }) {
    const client = await this.checkPermisionAndGetClient({
      clientId: sendLocationDto.clientId,
      userId,
    });

    const result = await this.fetchService.fetch<SendLocationResult>({
      method: 'post',
      base: {
        func: 'sendLocation',
        token: client.token,
      },
      body: {
        chat_id: sendLocationDto.chat_id,
        latitude: sendLocationDto.latitude,
        longitude: sendLocationDto.longitude,
      },
    });

    const messageData = {
      from: Number(client.chat_id),
      to: Number(sendLocationDto.chat_id),
      type: 'location',
      latitude: sendLocationDto.latitude,
      longitude: sendLocationDto.longitude,
      createdAt: new Date(),
      clientId: client.id,
    };

    await this.createMessage(messageData);

    this.webhookService.sendNotification({
      url: client.webHookUrl,
      sendWebhookDto: messageData,
    });

    return result;
  }

  private async createMessage(
    createMessageDto: CreateMessageDto,
  ): Promise<void> {
    await this.prisma.message.create({
      data: createMessageDto,
    });
  }

  private async checkPermisionAndGetClient({ clientId, userId }) {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.userId !== userId.toString())
      throw new NotFoundException(
        'You are not allowed to send message to this client',
      );
    return client;
  }
}
