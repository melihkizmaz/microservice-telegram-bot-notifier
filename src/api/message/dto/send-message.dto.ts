import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  clientId: string;

  @IsNotEmpty()
  chat_id: string;

  @IsNotEmpty()
  text: string;
}
