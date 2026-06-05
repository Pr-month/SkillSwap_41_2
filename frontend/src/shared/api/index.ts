import { api } from './apiClient';
import { authApi } from './authApiClient';

export const apiClient = {
  ...api,
  auth: authApi,
};

/**
 * Пример использования
 * 
 * обычный api
 * apiClient.get('/categories');
 * 
 * api с авторизацией
 * apiClient.auth.get('/auth/user');
 */