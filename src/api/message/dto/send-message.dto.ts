import { IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  chat_id: string;

  @IsNotEmpty()
  text: string;
}
