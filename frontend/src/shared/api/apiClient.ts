import { ApiClientError } from './errors';

type ApiError = {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};

const API_URL = import.meta.env.VITE_SKILLSWAP_API_URL;

if (!API_URL) {
  throw new Error('VITE_SKILLSWAP_API_URL is not defined in environment variables');
}

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// ======================
// API-клиент
// ======================
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { headers: customHeaders, body, params, ...restOptions } = options;

  const headers = new Headers(customHeaders);
  const url = new URL(path, API_URL);

  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // ======================
  // Блок запроса
  // ======================
  try {
    const response = await fetch(url.toString(), {
      ...restOptions,
      body,
      credentials: 'include',
      headers,
    });

    /**
     * Проврка статуса и обработка ошибок
     */
    if (!response.ok) {
      let errorData: Partial<ApiError> = {};

      try {
        errorData = await response.json();
      } catch {
        errorData.message = response.statusText;
      }

      /**
       * Генерация кастомной ошибки
       */
      throw new ApiClientError(
        response.status,
        errorData.message || `Запрос завершился с кодом ${response.status}`,
        errorData.errors,
      );
    }

    /**
     * Обработка пустого ответа
     */
    if (response.status === 204) {
      return undefined as T;
    }

    /**
     * Определение типа ответа и его обработка
     */
    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    /**
     * Если ответ текст, вернуть его
     */
    return response.text() as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiClientError(0, 'Ошибка соединения c сервером');
    }

    throw new ApiClientError(500, 'Неизвестная ошибка сети');
  }
}

// ======================
// Методы-обертки
// ======================
export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <TRes, TBody = unknown>(path: string, data?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TRes>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <TRes, TBody = unknown>(path: string, data?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TRes>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <TRes, TBody = unknown>(path: string, data?: TBody, options?: ApiRequestOptions) =>
    apiRequest<TRes>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
