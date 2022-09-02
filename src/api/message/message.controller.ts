import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ICurrentUser } from '../../auth/dto/current-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendMessage(
    @CurrentUser() user: ICurrentUser,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<any> {
    const result = await this.messageService.sendMessage(
      user.id,
      sendMessageDto,
    );
    if (!result.ok) throw new ForbiddenException(result.description);

    return result;
  }
}
