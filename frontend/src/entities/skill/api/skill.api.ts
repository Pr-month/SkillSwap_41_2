import { TGetSkillsParams, TSkillResponse } from './skill.types';
import { apiClient } from '@/shared/api';

export const getSkillsApi = async (params?: TGetSkillsParams) => {
  return apiClient.get<TSkillResponse>('/api/skills', { params });
};

export const addToFavoritesApi = async (id: number) => {
  return apiClient.auth.post<{ message: string }>(`/api/skills/${id}/favorite`);
};

export const removeFromFavoritesApi = async (id: number) => {
  return apiClient.auth.delete<{ message: string }>(`/api/skills/${id}/favorite`);
};
