import { User } from '@/entities/user/model/types';
import { setCookie, getCookie, deleteCookie } from './cookies';

const API_BASE_URL = import.meta.env.VITE_SKILLSWAP_API_URL || '';

export const checkResponse = <T>(res: Response): Promise<T> =>
  res.ok ? res.json() : res.json().then(err => Promise.reject(err));

export type TServerResponse<T> = {
  success: boolean;
} & T;

export type TRefreshResponse = TServerResponse<{
  refreshToken: string;
  accessToken: string;
}>;

export type TAuthResponse = TServerResponse<{
  refreshToken: string;
  accessToken: string;
  user: User;
}>;

export type TUserResponse = TServerResponse<{ user: User }>;

export type TLoginData = {
  email: string;
  password: string;
};

// Логика обновления токена
export const refreshToken = async (): Promise<TRefreshResponse> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Нет обновленного токена');
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await checkResponse<TRefreshResponse>(res);
  if (data.success) {
    setCookie('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  return data;
}

// Оболочка для функции выборки с автоматическим обновлением.
export const fetchWithRefresh = async <T>(
  url: RequestInfo,
  options: RequestInit,
): Promise<T> => {
  try {
    const accessToken = getCookie('accessToken');
    const headers = (options.headers || {}) as Record<string, string>;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    options.headers = headers;

    const res = await fetch(url, options);
    return await checkResponse<T>(res);
  } catch (err) {
    const error = err as { message?: string };
    // Проверяем, что ошибка связана с истекшим токеном
    if (error.message === 'jwt expired') {
      try {
        const refreshData = await refreshToken();
        if (refreshData.success) {
          // Обновляем заголовок новым accessToken (уже сохранён в куке)
          const newAccessToken = getCookie('accessToken');
          const newHeaders = (options.headers || {}) as Record<string, string>;
          if (newAccessToken) {
            newHeaders['Authorization'] = `Bearer ${newAccessToken}`;
          }
          options.headers = newHeaders;
          // Повторяем исходный запрос
          const retryRes = await fetch(url, options);
          return await checkResponse<T>(retryRes);
        } else {
          throw new Error('Токен обновления недействителен');
        }
      } catch {
        deleteCookie('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(new Error('Сессия истекла'));
      }
    } else {
      return Promise.reject(error);
    }
  }
};

// Функции API
export const getUserApi = (): Promise<TUserResponse> => {
  return fetchWithRefresh<TUserResponse>(`${API_BASE_URL}/auth/user`, {
    method: 'GET',
  });
};

export const loginUserApi = (data: TLoginData): Promise<TAuthResponse> => {
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(data),
  }).then(res => checkResponse<TAuthResponse>(res));
};

export const logoutApi = (): Promise<TServerResponse<object>> => {
  const accessToken = getCookie('accessToken');
  return fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }).then(res => checkResponse<TServerResponse<object>>(res));
};