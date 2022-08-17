import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TelegramClient } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { SetWebhookResult } from './dto/setwebhook-result.interface';
import { lastValueFrom, map } from 'rxjs';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GetMeResult } from '../message/dto/getme-result.inteface';

@Injectable()
export class ClientService {
  private telegramBaseUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.telegramBaseUrl = configService.get('telegramBaseUrl');
  }

  async createClient(
    createClientDto: CreateClientDto,
  ): Promise<TelegramClient> {
    const $getMeResult = this.http
      .get<GetMeResult>(`${this.telegramBaseUrl}${createClientDto.token}/getMe`)
      .pipe(map((res) => res.data));
    const getMeResult = await lastValueFrom($getMeResult);
    if (!getMeResult.ok) throw new ForbiddenException(getMeResult.description);
    const client = await this.prisma.telegramClient.findFirst({
      where: { token: createClientDto.token },
    });
    if (client) throw new ConflictException('Client token already used');

    const createObject = {
      id: createClientDto._id,
      chat_id: getMeResult.result.id,
      ...createClientDto,
    };
    delete createObject._id;
    return await this.prisma.telegramClient.create({
      data: createObject,
    });
  }
  async listClients(): Promise<TelegramClient[]> {
    return await this.prisma.telegramClient.findMany();
  }
  async listByIdClient(id: string): Promise<TelegramClient> {
    return await this.prisma.telegramClient.findUnique({ where: { id } });
  }
  async updateClient(
    id: string,
    createClientDto: CreateClientDto,
  ): Promise<TelegramClient> {
    return await this.prisma.telegramClient.update({
      where: { id },
      data: createClientDto,
    });
  }
  async deleteClient(id: string): Promise<TelegramClient> {
    return await this.prisma.telegramClient.delete({ where: { id } });
  }

  createMongoId(): string {
    return new Types.ObjectId().toHexString();
  }

  async setWebhook(url: string): Promise<SetWebhookResult> {
    const $result = this.http
      .get<SetWebhookResult>(url)
      .pipe(map((res) => res.data));
    const result = await lastValueFrom($result).catch((err) => {
      return err.response.data;
    });
    return result;
  }
}
