import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private telegramBaseUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
    private readonly fetchService: FetchService,
  ) {
    this.telegramBaseUrl = configService.get('telegramBaseUrl');
  }
  async sendText(
    userId: bson.ObjectID,
    sendMessageDto: SendTextDto,
  ): Promise<SendMessageResult> {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: sendMessageDto.clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.userId !== userId.toString())
      throw new NotFoundException(
        'You are not allowed to send message to this client',
      );
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

    await this.webhookService.sendNotification(client.webHookUrl, messageData);

    return result;
  }

  async sendImage(userId: bson.ObjectID, sendMessageDto: SendImageDto) {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: sendMessageDto.clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.userId !== userId.toString())
      throw new NotFoundException(
        'You are not allowed to send message to this client',
      );
    if (sendMessageDto.media.length > 10)
      throw new ConflictException('You can send up to 10 images at once');

    const result = await this.fetchService.fetch<SendMultipleImageResult>({
      method: 'post',
      base: {
        func: 'sendMediaGroup',
        token: client.token,
      },
      body: {
        chat_id: sendMessageDto.chat_id,
        media: sendMessageDto.media,
      },
    });
    await Promise.all(
      result.result.map(async (item) => {
        const messageData = {
          from: Number(client.chat_id),
          to: Number(sendMessageDto.chat_id),
          type: 'image',
          photo: item.photo.at(-1).file_id,
          mediaGroupId: item.media_group_id,
          createdAt: new Date(),
          clientId: client.id,
        };
        if (sendMessageDto.media[0].caption)
          messageData['caption'] = sendMessageDto.media[0].caption;
        if (sendMessageDto.media.length <= 1) delete messageData.mediaGroupId;
        await this.createMessage(messageData);
        await this.webhookService.sendNotification(
          client.webHookUrl,
          messageData,
        );
      }),
    );

    return result;
  }

  async sendLocation(userId: bson.ObjectID, sendLocationDto: SendLocationDto) {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: sendLocationDto.clientId },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.userId !== userId.toString())
      throw new NotFoundException(
        'You are not allowed to send message to this client',
      );

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

    this.webhookService.sendNotification(client.webHookUrl, messageData);

    return result;
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<void> {
    await this.prisma.message.create({
      data: createMessageDto,
    });
  }
}
