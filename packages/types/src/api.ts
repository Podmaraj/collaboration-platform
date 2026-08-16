// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
