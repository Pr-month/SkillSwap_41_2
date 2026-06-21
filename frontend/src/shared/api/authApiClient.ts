import { apiRequest, ApiRequestOptions } from './apiClient';
import { UnauthorizedError } from './errors';
import { tokenStorage } from './tokenStorege';
import { TApiResponse } from './types';

type RefreshResponse = {
  success: boolean;
  accessToken: string;
  refreshToken: string;
};

export type TRefreshResponse = TApiResponse<{
  refreshToken: string;
  accessToken: string;
}>;

// ======================
// Обновление токена
// ======================

export const refreshToken = async (): Promise<void> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new UnauthorizedError('Нет обновленного токена');
  }

  const res = await apiRequest<RefreshResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  tokenStorage.setAccessToken(res.accessToken);
  tokenStorage.setRefreshToken(res.refreshToken);
};

// ======================
// Auth_API-клиент
// ======================

export const authApiClient = async <T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  try {
    const accessToken = tokenStorage.getAccessToken();

    const headers = new Headers(options.headers);

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return await apiRequest<T>(url, {
      ...options,
      headers,
    });
  } catch (err) {
    const isUnauthorized =
      err instanceof UnauthorizedError ||
      (err instanceof Error && 'status' in err && (err as { status?: number }).status === 401);

    if (!isUnauthorized) {
      throw err;
    }

    try {
      await refreshToken();

      const newAccessToken = tokenStorage.getAccessToken();

      const retryHeaders = new Headers(options.headers);

      if (newAccessToken) {
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      }

      return await apiRequest<T>(url, {
        ...options,
        headers: retryHeaders,
      });
    } catch {
      tokenStorage.clear();

      throw new UnauthorizedError('Сессия истекла');
    }
  }
};

// ======================
// Методы-обертки
// ======================

export const authApi = {
  get: <T>(url: string, options?: ApiRequestOptions) =>
    authApiClient<T>(url, { ...options, method: 'GET' }),

  post: <TRes, Tbody = unknown>(url: string, data?: Tbody, options?: ApiRequestOptions) =>
    authApiClient<TRes>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <TRes, Tbody = unknown>(url: string, data?: Tbody, options?: ApiRequestOptions) =>
    authApiClient<TRes>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <TRes, Tbody = unknown>(url: string, data?: Tbody, options?: ApiRequestOptions) =>
    authApiClient<TRes>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, options?: ApiRequestOptions) =>
    authApiClient<T>(url, { ...options, method: 'DELETE' }),
};
