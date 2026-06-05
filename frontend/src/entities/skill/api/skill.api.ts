import { TGetSkillsParams, TSkillResponse } from './skill.types';
import { apiClient } from '@/shared/api';

export const getSkillsApi = async (params?: TGetSkillsParams) => {
  return apiClient.get<TSkillResponse>('/api/skills', { params });
};
