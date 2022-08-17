import { IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  chat_id: string;
  @IsNotEmpty()
  text: string;
}
