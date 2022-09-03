export interface SendLocationResult {
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
    location: {
      latitude: number;
      longitude: number;
    };
  };
  error_code?: number;
  description?: string;
}
