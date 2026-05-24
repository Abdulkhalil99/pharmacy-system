// Standard API response wrapper
// Every endpoint in our backend returns this shape
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

// Supported locales
export type Locale = 'fa' | 'ps' | 'en';

// RTL locales (Dari and Pashto are both RTL)
export const RTL_LOCALES: Locale[] = ['fa', 'ps'];