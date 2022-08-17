export interface SendMessageResult {
  ok: boolean;
  result?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: string;
    };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}
