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
import { SendImageDto } from './dto/send-image.dto';
import { SendTextDto } from './dto/send-text.dto';
import { SendLocationDto } from './dto/send.location.dto';
import { MessageService } from './message.service';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send-text')
  async sendMessage(
    @CurrentUser() user: ICurrentUser,
    @Body() sendMessageDto: SendTextDto,
  ): Promise<any> {
    const result = await this.messageService.sendText({
      userId: user.id,
      sendMessageDto,
    });
    if (!result.ok) throw new ForbiddenException(result.description);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-image')
  async sendPhoto(
    @CurrentUser() user: ICurrentUser,
    @Body() sendImageDto: SendImageDto,
  ): Promise<any> {
    const result = await this.messageService.sendImage({
      userId: user.id,
      sendImageDto,
    });
    if (!result.ok) throw new ForbiddenException(result.description);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-location')
  async sendLocation(
    @CurrentUser() user: ICurrentUser,
    @Body() sendLocationDto: SendLocationDto,
  ): Promise<any> {
    const result = await this.messageService.sendLocation({
      userId: user.id,
      sendLocationDto,
    });
    if (!result.ok) throw new ForbiddenException(result.description);

    return result;
  }
}
