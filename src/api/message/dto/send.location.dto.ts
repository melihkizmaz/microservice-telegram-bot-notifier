import { IsNotEmpty, IsMongoId } from 'class-validator';

export class SendLocationDto {
  @IsNotEmpty()
  @IsMongoId()
  clientId: string;

  @IsNotEmpty()
  chat_id: string;

  @IsNotEmpty()
  latitude: string;

  @IsNotEmpty()
  longitude: string;
}
