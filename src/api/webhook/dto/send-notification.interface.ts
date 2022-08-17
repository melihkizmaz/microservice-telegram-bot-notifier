export interface SendNotification {
  from: number;
  to: number;
  type: string;
  text: string;
  createdAt: Date;
  clientId: string;
}
