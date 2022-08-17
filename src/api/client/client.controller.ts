import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from '@prisma/client';
import { Types } from 'mongoose';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('client')
export class ClientController {
  private baseUrl: string;
  private telegramBaseUrl: string;
  constructor(
    private readonly clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = configService.get('baseUrl');
    this.telegramBaseUrl = configService.get('telegramBaseUrl');
  }
  @Post('create')
  async create(
    @Body() createClientDto: CreateClientDto,
  ): Promise<TelegramClient> {
    const id = this.clientService.createMongoId();
    const setWebhookResult = await this.clientService.setWebhook(
      `${this.telegramBaseUrl}${createClientDto.token}/setWebhook?url=${this.baseUrl}/webhook/${id}`,
    );
    if (!setWebhookResult.ok)
      throw new ForbiddenException(setWebhookResult.description);
    return this.clientService.createClient({ _id: id, ...createClientDto });
  }

  @Get('list')
  async list(): Promise<TelegramClient[]> {
    return this.clientService.listClients();
  }
  @Get('list/:id')
  async findOne(@Param('id') id: string): Promise<TelegramClient | string> {
    if (!Types.ObjectId.isValid(id)) return 'Invalid id';
    return this.clientService.listClientById(id);
  }
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() createClientDto: CreateClientDto,
  ): Promise<TelegramClient | string> {
    if (!Types.ObjectId.isValid(id)) return 'Invalid id';
    return this.clientService.updateClient(id, createClientDto);
  }
  @Delete('delete/:id')
  async delete(@Param('id') id: string): Promise<TelegramClient | string> {
    if (!Types.ObjectId.isValid(id)) return 'Invalid id';
    return this.clientService.deleteClient(id);
  }
}
