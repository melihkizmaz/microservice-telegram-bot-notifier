import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendMessageResult } from './dto/sendMessage-result.interface';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly webhookService: WebhookService,
  ) {}
  async sendMessage(
    url: string,
    sendMessageDto: SendMessageDto,
  ): Promise<SendMessageResult> {
    const $result = this.http
      .get<SendMessageResult>(
        `${url}?chat_id=${sendMessageDto.chat_id}&text=${sendMessageDto.text}`,
      )
      .pipe(map((res) => res.data));
    const result = await lastValueFrom($result).catch((err) => {
      return err.response.data;
    });
    const client = await this.prisma.telegramClient.findFirst({
      where: {
        token: sendMessageDto.token,
      },
    });
    if (!client) throw new NotFoundException('Client not found');

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
  async createMessage(createMessageDto: CreateMessageDto): Promise<void> {
    await this.prisma.message.create({
      data: createMessageDto,
    });
  }
}
