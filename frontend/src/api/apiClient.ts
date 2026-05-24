const API_URL = import.meta.env.VITE_SKILLSWAP_API_URL;

if (!API_URL) {
  throw new Error('VITE_SKILLSWAP_API_URL is not defined in environment variables');
}

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClientError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

// ======================
// API-клиент
// ======================
async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { accessToken, headers: customHeaders, body, ...restOptions } = options;

  const headers = new Headers(customHeaders);

  /**
   * Если тело запроса не FormData, устанавливаем Content-Type
   */
  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  /**
   * Установить токен при его наличии
   */
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // ======================
  // Блок запроса
  // ======================
  try {
    const response = await fetch(`${API_URL}${path}`, {
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
      const result = await response.json();

      return result as T;
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
      throw new ApiClientError(0, 'Ошибка соединения: невозможно подключиться к серверу');
    }

    throw new ApiClientError(500, 'Неизвестная ошибка сети');
  }
}

// ======================
// Методы-обертки
// ======================
export const api = {
  get: <T>(path: string, accessToken?: string) =>
    apiRequest<T>(path, { method: 'GET', accessToken }),

  post: <TRes, TBody = unknown>(path: string, data?: TBody, accessToken?: string) =>
    apiRequest<TRes>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      accessToken,
    }),

  put: <TRes, TBody = unknown>(path: string, data?: TBody, accessToken?: string) =>
    apiRequest<TRes>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      accessToken,
    }),

  patch: <TRes, TBody = unknown>(path: string, data?: TBody, accessToken?: string) =>
    apiRequest<TRes>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      accessToken,
    }),

  delete: <T>(path: string, accessToken?: string) =>
    apiRequest<T>(path, { method: 'DELETE', accessToken }),
};
