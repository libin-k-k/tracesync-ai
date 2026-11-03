export type ApiSuccessEnvelope<T> = {
  success: true;
  status: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errors?: Record<string, string[]>;
  request_id?: string;
};

export type ApiErrorEnvelope = {
  success: false;
  status: number;
  message: string;
  data: null;
  errors?: Record<string, string[]>;
  error_code?: string;
  request_id?: string;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
