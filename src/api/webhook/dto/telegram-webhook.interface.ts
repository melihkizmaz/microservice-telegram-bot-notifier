export interface IMessageData {
  message: {
    from: {
      id: number;
    };
    text?: string;
    photo?: [{ file_id: string }];
    caption?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    media_group_id?: string;
  };
}
