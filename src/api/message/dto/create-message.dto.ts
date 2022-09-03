export class CreateMessageDto {
  from: number;
  to: number;
  type: string;
  text?: string;
  photo?: string;
  caption?: string;
  createdAt: Date;
  clientId: string;
}
