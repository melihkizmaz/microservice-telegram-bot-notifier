import { Injectable } from '@nestjs/common';
import { FetchService } from '../../fetch/fetch.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { ISendNotification } from './dto/send-notification.interface';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fetchService: FetchService,
  ) {}
  async createMessage(createMessage: CreateMessageDto) {
    return await this.prisma.message.create({ data: createMessage });
  }

  async sendNotification({
    url,
    sendWebhookDto,
  }: {
    url: string;
    sendWebhookDto: ISendNotification;
  }) {
    const filteredNotificationDto = { ...sendWebhookDto };

    delete filteredNotificationDto.clientId;
    await this.fetchService.sendNotification<void>({
      url: url,
      body: filteredNotificationDto,
    });
  }
}
