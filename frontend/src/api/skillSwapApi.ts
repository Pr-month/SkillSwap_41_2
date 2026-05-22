
import { getCookie } from '@/shared/utils/cookies';
import { api } from './apiClient';
import { TUpdateProfileData, TUpdateProfileResponse, TUsersResponse } from './types/users';
import { TAuthResponse, TLoginData } from './types/auth';
import { Skill } from '@/entities/skill/model/types';

/**
 * Получение списка навыков
 */
export const getSkillsApi = async () => {
  return api.get<Skill[]>('/api/skills');
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
