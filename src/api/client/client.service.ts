import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TelegramClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { SetWebhookResult } from './dto/setwebhook-result.interface';
import { IGetMeResult } from '../message/dto/getme-result.inteface';
import { ICreateClient } from './dto/create-client.interface';
import { FetchService } from '../../fetch/fetch.service';
import * as bson from 'bson';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientService {
  private baseUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly fetchService: FetchService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = configService.get('baseUrl');
  }

  async createClient(createClient: ICreateClient): Promise<TelegramClient> {
    const getMeResult = await this.fetchService.fetch<IGetMeResult>({
      method: 'get',
      base: {
        func: 'getMe',
        token: createClient.token,
      },
    });

    if (!getMeResult.ok) throw new ForbiddenException(getMeResult.description);

    const existClient = await this.prisma.telegramClient.findFirst({
      where: { token: createClient.token },
    });

    if (existClient) throw new ConflictException('Client token already used');

    const createObject = {
      chat_id: getMeResult.result.id,
      ...createClient,
    };

    const newClient = await this.prisma.telegramClient.create({
      data: createObject,
    });
    const setWebhookResult = await this.setWebhook({
      token: newClient.token,
      url: `${this.baseUrl}/webhook/${newClient.id}`,
    });

    if (!setWebhookResult.ok)
      throw new ForbiddenException(setWebhookResult.description);

    return newClient;
  }
  async listClients(userId: bson.ObjectID): Promise<TelegramClient[]> {
    return await this.prisma.telegramClient.findMany({
      where: { userId: userId.toString() },
    });
  }

  async listClientById({
    id,
    userId,
  }: {
    id: string;
    userId: bson.ObjectID;
  }): Promise<TelegramClient> {
    await this.userPermissionGuard({ clientId: id, userId });

    return await this.prisma.telegramClient.findUnique({
      where: { id },
    });
  }

  async listClientByIdForWebhook(id: string): Promise<TelegramClient> {
    try {
      const result = await this.prisma.telegramClient.findUnique({
        where: { id },
      });
      return result;
    } catch {
      return null;
    }
  }

  async updateClient({
    id,
    createClientDto,
    userId,
  }: {
    id: string;
    createClientDto: CreateClientDto;
    userId: bson.ObjectID;
  }): Promise<TelegramClient> {
    await this.userPermissionGuard({ clientId: id, userId });

    return await this.prisma.telegramClient.update({
      where: { id },
      data: createClientDto,
    });
  }

  async deleteClient({
    id,
    userId,
  }: {
    id: string;
    userId: bson.ObjectID;
  }): Promise<TelegramClient> {
    const clientToken = await this.userPermissionGuard({
      clientId: id,
      userId,
    });

    await this.prisma.message.deleteMany({
      where: { clientId: id },
    });
    const deleteWebhookResult = await this.deleteWebhook({
      token: clientToken,
    });

    if (!deleteWebhookResult.ok)
      throw new ForbiddenException('Webhook could not be deleted');

    return await this.prisma.telegramClient.delete({ where: { id } });
  }

  async setWebhook({ token, url }): Promise<SetWebhookResult> {
    return await this.fetchService.fetch<SetWebhookResult>({
      method: 'get',
      base: { func: 'setWebhook', token },
      params: { url },
    });
  }

  async deleteWebhook({ token }): Promise<SetWebhookResult> {
    return await this.fetchService.fetch<SetWebhookResult>({
      method: 'get',
      base: { func: 'setWebhook', token },
    });
  }

  private async userPermissionGuard({
    clientId,
    userId,
  }: {
    clientId: string;
    userId: bson.ObjectID;
  }): Promise<string> {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: clientId.toString() },
    });
    if (!client) throw new ForbiddenException('Client not found');
    if (client.userId.toString() !== userId.toString())
      throw new ForbiddenException('You are not allowed to access this client');
    return client.token;
  }
}
