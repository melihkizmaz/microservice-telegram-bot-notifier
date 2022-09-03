export interface SendMultipleImageResult {
  ok: boolean;
  result?: [
    {
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
      photo: [
        {
          file_id: string;
          file_unique_id: string;
          file_size: number;
          width: number;
          height: number;
        },
      ];
      media_group_id: string;
    },
  ];
  error_code?: number;
  description?: string;
}
