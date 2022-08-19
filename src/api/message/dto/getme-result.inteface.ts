export interface IGetMeResult {
  ok: boolean;
  result?: {
    id: number;
  };
  error_code?: number;
  description?: string;
}
