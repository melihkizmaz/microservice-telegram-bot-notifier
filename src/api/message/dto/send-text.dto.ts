import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SendTextDto {
  @IsNotEmpty()
  @IsMongoId()
  clientId: string;

  @IsNotEmpty()
  chat_id: string;

  @IsNotEmpty()
  text: string;
}
