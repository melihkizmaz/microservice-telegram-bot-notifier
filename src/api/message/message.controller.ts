import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  private telegramBaseUrl: string;
  constructor(
    private readonly messageService: MessageService,
    private readonly configService: ConfigService,
  ) {
    this.telegramBaseUrl = configService.get('telegramBaseUrl');
  }

  @Post('send')
  async create(@Body() sendMessageDto: SendMessageDto): Promise<any> {
    const result = await this.messageService.sendMessage(
      `${this.telegramBaseUrl}${sendMessageDto.token}/sendMessage`,
      sendMessageDto,
    );
    if (!result.ok) throw new ForbiddenException(result.description);

    return result;
  }
}
