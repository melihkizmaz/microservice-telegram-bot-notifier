import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { ISendNotification } from './dto/send-notification.interface';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}
  async createMessage(createMessage: CreateMessageDto) {
    return await this.prisma.message.create({ data: createMessage });
  }

  async sendNotification(url: string, sendWebhookDto: ISendNotification) {
    const filteredNotificationDto = { ...sendWebhookDto };

    delete filteredNotificationDto.clientId;

    const $result = this.http.post<void>(url, filteredNotificationDto);
    await lastValueFrom($result);
  }
}
