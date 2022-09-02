import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TelegramClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { SetWebhookResult } from './dto/setwebhook-result.interface';
import { lastValueFrom, map } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { IGetMeResult } from '../message/dto/getme-result.inteface';
import { ICreateClient } from './dto/create-client.interface';
import * as bson from 'bson';

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

  async createClient(createClient: ICreateClient): Promise<TelegramClient> {
    const $getMeResult = this.http
      .get<IGetMeResult>(`${this.telegramBaseUrl}${createClient.token}/getMe`)
      .pipe(map((res) => res.data));
    const getMeResult = await lastValueFrom($getMeResult);
    if (!getMeResult.ok) throw new ForbiddenException(getMeResult.description);

    const client = await this.prisma.telegramClient.findFirst({
      where: { token: createClient.token },
    });
    if (client) throw new ConflictException('Client token already used');

    const createObject = {
      id: createClient._id,
      chat_id: getMeResult.result.id,
      ...createClient,
    };
    delete createObject._id;

    return await this.prisma.telegramClient.create({
      data: createObject,
    });
  }
  async listClients(userId: bson.ObjectID): Promise<TelegramClient[]> {
    return await this.prisma.telegramClient.findMany({
      where: { userId: userId.toString() },
    });
  }
  async listClientById(
    id: string,
    userId: bson.ObjectID,
  ): Promise<TelegramClient> {
    await this.userPermissionGuard(id, userId);

    return await this.prisma.telegramClient.findUnique({
      where: { id },
    });
  }
  async listClientByIdForWebhook(id: string): Promise<TelegramClient> {
    return await this.prisma.telegramClient.findUnique({
      where: { id },
    });
  }
  async updateClient(
    id: string,
    createClientDto: CreateClientDto,
    userId: bson.ObjectID,
  ): Promise<TelegramClient> {
    await this.userPermissionGuard(id, userId);

    return await this.prisma.telegramClient.update({
      where: { id },
      data: createClientDto,
    });
  }
  async deleteClient(
    id: string,
    userId: bson.ObjectID,
  ): Promise<TelegramClient> {
    await this.userPermissionGuard(id, userId);

    return await this.prisma.telegramClient.delete({ where: { id } });
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
  createMongoId(): string {
    return new bson.ObjectID().toHexString();
  }
  private async userPermissionGuard(
    clientId: string,
    userId: bson.ObjectID,
  ): Promise<void> {
    const client = await this.prisma.telegramClient.findUnique({
      where: { id: clientId.toString() },
    });
    if (!client) throw new ForbiddenException('Client not found');
    if (client.userId.toString() !== userId.toString())
      throw new ForbiddenException('You are not allowed to access this client');
  }
}
