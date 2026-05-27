import { getCookie } from '@/shared/utils/cookies';
import { api } from './apiClient';
import { TAuthResponse, TLoginData } from './types/auth';
import { TCategoriesResponse } from './types/categories';
import { TCitiesResponse } from './types/cities';
import { TSkillResponse } from './types/skill';
import { TUpdateProfileData, TUpdateProfileResponse, TUsersResponse } from './types/users';

/**
 * Получение списка категорий
 */
export const getCategoriesApi = async () => {
  return api.get<TCategoriesResponse>('/api/categories');
};

/**
 * Получение списка навыков
 */
export const getSkillsApi = async () => {
  return api.get<TSkillResponse>('/api/skills');
};
/**
 * Получение списка городов
 */
export const getCitiesApi = async () => {
  return api.get<TCitiesResponse>('/api/cities');
};

/**
 * Получение списка пользователей
 */
export const getUsersApi = async () => {
  return api.get<TUsersResponse>('/users');
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
