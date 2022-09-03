import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SendImageDto {
  @IsNotEmpty()
  @IsMongoId()
  clientId: string;

  @IsNotEmpty()
  chat_id: string;

  @IsNotEmpty()
  media: [{ type: string; caption: string; media: string }];
}
