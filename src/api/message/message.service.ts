import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendTextDto } from './dto/send-text.dto';
import { SendImageDto } from './dto/send-image.dto';
import { SendMessageResult } from './dto/sendMessage-result.interface';
import * as bson from 'bson';
import { SendImageResult } from './dto/sendImage-result.interface';
import { SendLocationDto } from './dto/send.location.dto';
import { SendLocationResult } from './dto/sendLocation-result.interface';
import { SendMultipleImageResult } from './dto/sendMultipleImage-result.interface';

@Injectable()
export class MessageService {
  private telegramBaseUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
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

    const $result = this.http
      .get<SendMessageResult>(
        `${this.telegramBaseUrl}${client.token}/sendMessage?chat_id=${sendMessageDto.chat_id}&text=${sendMessageDto.text}`,
      )
      .pipe(map((res) => res.data));
    const result = await lastValueFrom($result).catch((err) => {
      throw new ConflictException(err.response.data.description);
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

    if (sendMessageDto.media.length === 1) {
      const $result = this.http
        .post<SendImageResult>(
          `${this.telegramBaseUrl}${client.token}/sendPhoto`,
          {
            photo: sendMessageDto.media[0].media,
            chat_id: sendMessageDto.chat_id,
            caption: sendMessageDto.media[0].caption,
          },
        )
        .pipe(map((res) => res.data));
      const result = await lastValueFrom($result).catch((err) => {
        throw new ConflictException(err.response.data.description);
      });

      const messageData = {
        from: Number(client.chat_id),
        to: Number(sendMessageDto.chat_id),
        type: 'image',
        photo: result.result.photo[result.result.photo.length - 1].file_id,
        createdAt: new Date(),
        clientId: client.id,
      };
      if (sendMessageDto.media[0].caption)
        messageData['caption'] = sendMessageDto.media[0].caption;

      await this.createMessage(messageData);

      await this.webhookService.sendNotification(
        client.webHookUrl,
        messageData,
      );
      return result;
    }
    if (sendMessageDto.media.length > 1) {
      const $result = this.http
        .post<SendMultipleImageResult>(
          `${this.telegramBaseUrl}${client.token}/sendMediaGroup`,
          {
            chat_id: sendMessageDto.chat_id,
            media: sendMessageDto.media,
          },
        )
        .pipe(map((res) => res.data));
      const result = await lastValueFrom($result).catch((err) => {
        throw new ConflictException(err.response.data.description);
      });
      result.result.map(async (item) => {
        setTimeout(async () => {
          const messageData = {
            from: Number(client.chat_id),
            to: Number(sendMessageDto.chat_id),
            type: 'image',
            photo: item.photo[item.photo.length - 1].file_id,
            mediaGroupId: item.media_group_id,
            createdAt: new Date(),
            clientId: client.id,
          };
          if (sendMessageDto.media[0].caption)
            messageData['caption'] = sendMessageDto.media[0].caption;

          await this.createMessage(messageData);

          await this.webhookService.sendNotification(
            client.webHookUrl,
            messageData,
          );
        }, 500);
      });
      return result;
    }
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

    const $result = this.http
      .post<SendLocationResult>(
        `${this.telegramBaseUrl}${client.token}/sendLocation`,
        {
          chat_id: sendLocationDto.chat_id,
          latitude: sendLocationDto.latitude,
          longitude: sendLocationDto.longitude,
        },
      )
      .pipe(map((res) => res.data));
    const result = await lastValueFrom($result).catch((err) => {
      throw new ConflictException(err.response.data.description);
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

    await this.webhookService.sendNotification(client.webHookUrl, messageData);

    return result;
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<void> {
    await this.prisma.message.create({
      data: createMessageDto,
    });
  }
}
