export interface GetMeResult {
  ok: boolean;
  result?: {
    id: number;
  };
  error_code?: number;
  description?: string;
}
