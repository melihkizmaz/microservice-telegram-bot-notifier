import { IsEmpty, IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @IsEmpty()
  _id: string;
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  webHookUrl: string;
}
