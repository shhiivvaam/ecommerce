// Common response types for API endpoints
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  status?: string;
  [key: string]: unknown;
}

export interface WebhookResponse {
  received: boolean;
  type?: string;
  id?: string;
  [key: string]: unknown;
}

export interface FileDownloadResponse {
  downloadUrl?: string;
  fileData?: string;
  filename?: string;
  [key: string]: unknown;
}

export interface ImportResponse {
  imported: number;
  failed: number;
  errors: string[];
  [key: string]: unknown;
}

export interface ExportResponse {
  filename: string;
  downloadUrl?: string;
  recordCount: number;
  [key: string]: unknown;
}

export interface CouponResponse {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumAmount?: number;
  isValid: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface GiftCardResponse {
  balance: number;
  currency: string;
  status: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface HealthResponse {
  status: string;
  checks?: {
    database: boolean;
    redis: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface StorageResponse {
  url: string;
  publicUrl?: string;
  fileId: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  message: string;
  success: boolean;
  [key: string]: unknown;
}
