import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from '@prisma/client';
import { isMongoId } from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ICurrentUser } from '../../auth/dto/current-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('client')
export class ClientController {
  private baseUrl: string;
  constructor(
    private readonly clientService: ClientService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = configService.get('baseUrl');
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @CurrentUser() user: ICurrentUser,
    @Body() createClientDto: CreateClientDto,
  ): Promise<TelegramClient> {
    const id = this.clientService.createMongoId();

    const client = this.clientService.createClient({
      _id: id,
      ...createClientDto,
      userId: user.id.toString(),
    });

    const setWebhookResult = await this.clientService.setWebhook({
      token: createClientDto.token,
      url: `${this.baseUrl}/webhook/${id}`,
    });
    if (!setWebhookResult.ok)
      throw new ForbiddenException(setWebhookResult.description);

    return client;
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list(@CurrentUser() user: ICurrentUser): Promise<TelegramClient[]> {
    return this.clientService.listClients(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<TelegramClient | string> {
    if (!isMongoId(id)) return 'Invalid id';
    return this.clientService.listClientById({ id, userId: user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  async update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() createClientDto: CreateClientDto,
  ): Promise<TelegramClient | string> {
    if (!isMongoId(id)) return 'Invalid id';

    return this.clientService.updateClient({
      id,
      createClientDto,
      userId: user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async delete(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ): Promise<TelegramClient | string> {
    if (!isMongoId(id)) return 'Invalid id';

    return this.clientService.deleteClient({ id, userId: user.id });
  }
}
