
import { getCookie } from '@/shared/utils/cookies';
import { api } from './apiClient';
import { TUpdateProfileData, TUpdateProfileResponse, TUsersResponse } from './types/users';
import { TAuthResponse, TLoginData } from './types/auth';
import { TSkillResponse } from './types/skill';

/**
 * Получение списка категорий
 */
export const getCategoriesApi = async () => {
  return api.get('/api/categories');
}

/**
 * Получение списка навыков
 */
export const getSkillsApi = async () => {
  return api.get<TSkillResponse>('/api/skills');
};

/**
 * Получение списка пользователей
 */
export const getUsersApi = async () => {
  return api.get<TUsersResponse>('/api/users/all');
};

/**
 * Авторизация пользователя
 */
export const loginUserApi = async (data: TLoginData) => {
  return api.post<TAuthResponse, TLoginData>('/api/login', data);
};

/**
 * Обновление профиля пользователя
 */
export const updateProfileApi = (data: TUpdateProfileData) => {
  return api.patch<TUpdateProfileResponse, TUpdateProfileData>(
    '/api/profile',
    data,
    getCookie('accessToken') || '',
  );
};
