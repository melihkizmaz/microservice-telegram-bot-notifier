export interface ISendNotification {
  from: number;
  to: number;
  type: string;
  text: string;
  createdAt: Date;
  clientId: string;
}
